# PayMongo Integration Plan

Implementation plan for wiring real PayMongo payments into AppointDent.
Companion to `payment_avoids.md` (each phase below maps to the pitfalls listed there).

## Current state (already shipped)

- **`paymongo_payments`** table — polymorphic (`context_type` + `context_id`), covers
  `transaction` / `installment_payment` / `appointment`. Has `paymongo_link_id` (unique),
  `amount`, `currency`, `status`, `checkout_url`, `payment_method`, `paid_at`.
- **`paymongo_events`** table — stores processed webhook event IDs (dedup).
- **`PaymentModal`** (`src/components/features/billing/PaymentModal.tsx`) — one shared payment
  UI, wired into the patient payments page and the booking flow.
- **`paymongoActions.ts`** — `initiatePayment` (currently a stub that applies payment
  immediately) + `confirmPaymongoPayment` + `applyPaymentToContext` helper that routes the
  paid outcome to the right table and revalidates dashboards.

Everything is designed to run in **stub mode** (no real gateway) until PayMongo keys exist.

## Architecture decision: Checkout Sessions API (v1)

PayMongo offers three hosted paths:

- **Links API** — simplest, but basic links **have no configurable return URL**: after paying,
  the patient lands on PayMongo's own receipt page and isn't sent back to the app.
- **Checkout Sessions API** — hosted (no PCI scope), and crucially supports `success_url` /
  `cancel_url`, so the patient is redirected back to our return route. Emits
  `checkout_session.payment.paid`.
- **Payment Intents API** — richer lifecycle events and inline card UX, but much more wiring
  (payment methods, attach, 3DS).

**Recommendation: Checkout Sessions for v1.** Originally scoped as Links API, but the
one-route/4-state return page (see *Phase 3*) needs a return URL, which only Checkout Sessions
(or Payment Intents) provide. Checkout Sessions keep PCI scope off our servers (#7) while
giving us the redirect-back UX. Switch to Payment Intents only if inline card-decline UX is
needed later.

> **Schema note:** the existing `paymongo_link_id` column stores the checkout session id
> (`cs_…`) under this approach — no rename needed, `checkout_url` is reused as-is.

---

## Phase 0 — Secrets & account setup  ⬜ pending (your side)
*(addresses avoid #9 — secrets in version control)*

1. Create PayMongo account; get **test** keys (`sk_test_…`, `pk_test_…`).
2. Add to `.env.local` (already gitignored; `.env.example` documents them):
   ```
   PAYMONGO_SECRET_KEY=sk_test_xxx
   PAYMONGO_WEBHOOK_SECRET=whsk_xxx
   ```
3. Register webhook in PayMongo dashboard → `https://<domain>/api/payments/paymongo/webhook`,
   subscribe to `checkout_session.payment.paid` (and `payment.failed` for decline handling).
4. Rotate any key that was ever committed.

## Phase 1 — Outgoing: create the payment link  🚧 partial
*(addresses avoids #3 order-first, #4 idempotency, #7 no raw card data)*

1. ✅ **`src/lib/paymongo/env.ts`** — `isPaymongoConfigured()`, `getPaymongoSecretKey()`,
   `getPaymongoWebhookSecret()`, `getPaymongoMode()`. Throws in production if keys missing.
2. 🚧 **`src/lib/paymongo/client.ts`** — typed REST wrapper (Basic auth) +
   `verifyWebhookSignature()` exist. **Needs swap to Checkout Sessions:** rename
   `createPaymentLink()` → `createCheckoutSession()` (accepts `success_url` / `cancel_url`) and
   `getPaymentLink()` → `getCheckoutSession()` (for polling). Card data never touches our
   servers — PayMongo hosts checkout (#7).
3. ⬜ **Rewrite `initiatePayment`** (still a stub — reverted, not yet wired to the client):
   - Context (appointment/transaction/installment) already exists first (#3 preserved).
   - **Idempotency via reuse-pending** (#4): before creating a session, check for an existing
     `pending` `paymongo_payments` row for the same `(context_type, context_id)` with a live
     `checkout_url` — return that instead of creating a duplicate session.
   - **Freshness check on reuse** (review #1): before handing back a reused `pending` row's
     link, call `getCheckoutSession()` to confirm it's still unpaid/valid on PayMongo's side. If
     it's expired/paid, mark the local row accordingly and create a fresh session instead. Build
     this into Phase 1 — don't defer to the Phase 4 poller, or a patient could be handed a dead
     checkout link with no signal it's dead.
   - When configured: insert `pending` row → create checkout session (passing
     `success_url=<return route>?ref=<payment id>` and `cancel_url`) → save the session id to
     `paymongo_link_id` + `checkout_url` → return `{ checkoutUrl }` so `PaymentModal` redirects.
   - When **not** configured: keep the stub path (apply immediately) for local dev.
   - **Remove the stub auto-apply once live** so fulfillment happens only via webhook (#1).
   - Validate a **per-method minimum** before creating a session. ⚠️ Minimums are
     **method-dependent and have changed over time** (verified against docs/community June 2026):
     cards ~PHP 100, but e-wallets like GCash/GrabPay have historically been higher. Confirm the
     current figures for the methods you enable when wiring `client.ts` (review R3 #2) rather
     than hard-coding a flat 100.

## Phase 2 — Incoming: webhook handler  ⬜ pending
*(addresses avoids #1 server-side truth, #2 signature, #4 dedup, #5 fast response)*

> `paymongo_events` dedup table is ✅ already migrated. The route handler itself is not built.

**`src/app/api/payments/paymongo/webhook/route.ts`** (`runtime = 'nodejs'`)

1. Read **raw body** via `req.text()` (needed for signature).
2. **Verify signature** (#2): parse `Paymongo-Signature` (`t=,te=,li=`), compute
   `HMAC-SHA256(\`${t}.${rawBody}\`)`, constant-time compare. Reject mismatches (401).
3. **Dedup** (#4): insert event id (`evt_…`) into `paymongo_events`; on unique-violation
   return 200 no-op. Claim-then-process; on processing failure delete the claim so PayMongo
   retries.
   - **Crash safety** (review #2): the claim delete must live in the `catch` block **only**,
     never in `finally` (a `finally` delete would wipe the claim even on success, re-opening
     dedup). Because a crash between claim-insert and fulfillment-complete would otherwise
     wedge that event's retries permanently, the fulfillment work must be idempotent on its
     own — re-running `confirmPaymongoPayment` for an already-paid row must be a safe no-op so
     a redelivered event recovers cleanly. Verify the shipped code matches this exactly.
4. **Route by event type**: `checkout_session.payment.paid` → confirm; `payment.failed` →
   mark the row `failed` (drives the retry UX in Phase 3). **Note the payload shapes differ**
   (verified against docs): the paid event's payload **is the checkout session** (carries the
   `cs_…` id → direct lookup in `paymongo_link_id`), but `payment.failed`'s payload is a
   **payment object** with no checkout-session id on it. To resolve a failed event back to the
   local row, **set the `paymongo_payments` id (or reference) as session `metadata` at creation**
   and read it back, or treat failed-handling as best-effort with the Phase 4 poller as the
   backstop. There is **no `checkout_session.payment.failed`** event — failures come through the
   generic `payment.failed`.
5. **Respond fast** (#5): fulfillment is a couple of indexed updates via
   `confirmPaymongoPayment(sessionId)` — acceptable inline; move to a queue if it grows.
6. `confirmPaymongoPayment` already routes by `context_type` and revalidates the staff +
   patient dashboards.

## Phase 3 — Status lifecycle & UX  ⬜ pending
*(addresses avoids #1, #6 full lifecycle)*

1. Use the full **status set** on `paymongo_payments`: `pending | paid | failed | expired |
   cancelled` (column is free-text — no migration needed).
2. **Redirect-back = "processing," not success** (#1): patient returns to a processing view
   that polls our DB (not PayMongo) until the webhook flips the row to `paid`. Never fulfill
   on the client redirect.
3. **Error states** in `PaymentModal` / payments page (#6): distinct messaging for failed
   ("Card declined — try another method"), expired ("Link expired — start over"), processing.
   Optionally email the patient on `failed` with a retry link.

### Return route — one route, four states

**Decision:** a single state-driven return route, **not** four status-named routes — the
status isn't known when the patient lands (the webhook may not have arrived yet), so routing
by status is impossible; the page must land neutral and resolve by polling.

**`src/app/patient-dashboard/payments/return/page.tsx`** — receives
`?ref=<paymongo_payment_id>` (set as the checkout session's `success_url`). Server-loads the
`paymongo_payments` row, then a small client component renders one of four states and polls our
DB (never PayMongo — #1):

| State (`paymongo_payments.status`) | UI |
|---|---|
| `pending` | "Processing your payment…" spinner; **poll the DB every ~3s** until it resolves, then swap to one of the below |
| `paid` | Success — confirmation + link to the appointment / payments page |
| `failed` | Error ("Card declined — try another method") + **Retry** button that re-opens `PaymentModal` |
| `expired` | "This payment link expired" + Retry / rebook |

Notes:
- The four states are conditional UI in one page, mirroring how `PaymentModal` and the payments
  page already branch — no duplicated route scaffolding.
- `cancel_url` points back to the originating page (booking or payments) — **intentional**, so
  an abandoned checkout returns cleanly and is **never misread as a `failed` payment**; the row
  stays `pending` and is swept by the Phase 4 poller. *(Confirmed correct, review R3 #3.)*
- **Poll fallback** (review R3 #1 — decided): fast-poll every ~3s for the first ~60s. If still
  `pending` at the ceiling, **don't dead-end** — switch to a slower auto-poll (~every 20s),
  show a **"Check now"** manual refresh button, and reassure the patient their dashboard will
  update automatically. This survives a delayed webhook (#11) without hammering or stranding
  the user.

## Phase 4 — Reliability & verification  ⬜ pending
*(addresses avoids #8 reconciliation, #10 testing, #11 PayMongo webhook reliability)*

1. **Polling fallback** (#11): scheduled job every 5–10 min queries PayMongo for links from
   the last hour; flips `pending` rows that PayMongo reports paid; marks links `expired` past
   their window. **On marking an `appointment`-context payment `expired`, auto-cancel the
   linked appointment to free the slot** (review #3 decision — grace period then auto-release).
2. **Reconciliation job** (#8): daily/monthly compare of `paymongo_payments` against
   PayMongo's API records; flag divergences for manual review.
3. **Test matrix before launch** (#10):
   - Successful payment → webhook → staff dashboard shows paid
   - Declined card → proper messaging
   - Duplicate webhook delivery → no-op
   - Forged webhook (bad signature) → rejected
   - Abandoned / expired link → handled
   - Webhook delayed/missing → polling fallback catches it

---

## Sequencing

| Phase | Deliverable | Status | Blocks on |
|-------|-------------|--------|-----------|
| 0 | Keys, env, webhook registration | ⬜ pending (your side) | PayMongo account |
| 1 | `lib/paymongo/{env,client}.ts`, real `initiatePayment` | 🚧 partial — libs done, `initiatePayment` still stub | Phase 0 |
| 2 | Webhook route + signature + dedup | ⬜ pending — `paymongo_events` table done, route not built | Phase 1 |
| 3 | Status lifecycle + return route (`/payments/return`, one route / 4 states), error UX | ⬜ pending | Phase 2 |
| 4 | Polling, reconciliation, full test pass | ⬜ pending | Phase 3 |

Phases 1–2 are the critical path to a working real payment. Phases 3–4 make it
production-safe. Everything is gated on `isPaymongoConfigured()` so the app keeps working in
stub mode until Phase 0 is done.

## Resolved product decisions

- **Appointment/slot when payment expires or fails** (review #3) — ✅ **decided: grace period,
  then auto-release.** The slot stays held while the PayMongo link is live (~1h) so the patient
  can retry. If still unpaid when the link expires, the Phase 4 poller marks the payment
  `expired` and auto-cancels the appointment, freeing the slot:
  ```
  booked → pending (unpaid)
     ↓ link expires (~1h)
  poller marks payment 'expired'
     ↓
  appointment auto-cancelled → slot freed
  ```
  A hard `failed` event (explicit decline) keeps the slot held until link expiry too — the
  patient may retry with another method within the grace window.

## Status legend

- ✅ done · 🚧 partial / in progress · ⬜ pending

### Payment record states (`paymongo_payments.status`)

Free-text column — no DB constraint, so states are enforced in code:

| State | Meaning | Set by |
|-------|---------|--------|
| `pending` | Link created, awaiting payment | `initiatePayment` (on insert) |
| `paid` | Payment confirmed | webhook (`confirmPaymongoPayment`) / stub path |
| `failed` | Payment attempt declined | webhook (Phase 3) |
| `expired` | Link lapsed unpaid | polling fallback (Phase 4) |
| `cancelled` | Abandoned / voided | Phase 3 |

Only `pending` and `paid` are exercised today (stub mode). `failed`/`expired`/`cancelled`
become live with Phases 3–4.

---

## Review log

Round 1 — three items raised, all addressed:

1. **Idempotency reuse-pending freshness gap** — a reused `pending` row could hand back a link
   already dead on PayMongo's side. **Resolved:** Phase 1 now does a `getPaymentLink()`
   freshness check before reuse (built into Phase 1, not deferred to the Phase 4 poller).
2. **Webhook claim-then-process crash safety** — claim delete must be `catch`-only (never
   `finally`), and fulfillment must survive a crash between claim-insert and completion.
   **Resolved:** Phase 2 specifies delete-on-`catch`-only and requires `confirmPaymongoPayment`
   to be idempotent (re-run on an already-paid row = safe no-op) so redelivered events recover.
3. **Appointment/slot fate on expired/failed payment** — product decision, undefined.
   **Resolved:** grace period then auto-release (see *Resolved product decisions*); wired into
   the Phase 4 poller.

Round 2 — return-page UX:

4. **Post-payment return UX** — needed a place for the patient to land after checkout.
   **Resolved:** one state-driven return route (`/patient-dashboard/payments/return`) with four
   states (processing / paid / failed / expired), not four separate routes (see *Phase 3*).
   This required switching the API choice from **Links → Checkout Sessions** (Links have no
   return URL; Checkout Sessions provide `success_url` / `cancel_url`) — architecture decision
   and Phases 0–2 updated accordingly.

Round 3 — return-page edge cases:

5. **Poll ceiling dead-end** — the 60s fallback was a static message with no path forward.
   **Resolved:** slower auto-poll (~20s) + "Check now" refresh button + dashboard reassurance
   (see *Phase 3 → Return route*).
6. **PHP 100 minimum vs Checkout Sessions** — minimum carried over from the Links plan.
   **Open/flagged:** added a ⚠️ note in Phase 1 to re-verify against Checkout Sessions docs when
   wiring `client.ts` (low urgency).
7. **`cancel_url` not misread as failure** — **confirmed correct**, not a fix; documented as
   intentional in Phase 3.
