# Prompt: Database normalization review (read-only audit, no breaking changes)

## Goal
Review the full Supabase schema for redundant/denormalized data — places where the same
fact is stored in more than one table/column without a clear reason, or where a value is
stored that could instead be derived. **This is an audit first, not a refactor.** Do not
change anything yet — produce a findings report, then we decide together what (if
anything) to fix.

## Hard constraint
**Do not break the existing flow.** This codebase has working, tested billing/payment/
appointment logic (`paymongoActions.ts`, `billingActions.ts`, `appointmentActions.ts`, the
patient/staff Transactions and Billing tabs). Any normalization suggestion must come with an
honest assessment of blast radius — what reads/writes would need to change, and whether it's
worth the risk versus just leaving it as-is.

## Already-known candidates (confirmed from partial review, verify against full schema)

1. **`transactions` has no FK to `paymongo_payments`.** Already scoped as its own issue
   (`issue-link-transactions-to-paymongo-payments.md`) — adding a nullable
   `paymongo_payment_id` column. Confirm this is still the right fix once you see the full
   schema, but this one's already decided — just confirming, not re-opening.

2. **`appointments.downpayment` vs. downpayment `transactions`/`transaction_items` rows** —
   likely *not* a problem. One stores the intended/expected downpayment amount on the
   appointment, the other records the actual paid event. These represent two different
   facts (expected vs. actual) that happen to usually match — flag if you find them ever
   drifting apart in practice, but don't treat "two tables have the same number" as
   automatically wrong here.

3. **`transactions.total_amount` vs. `transaction_items` line items** — `total_amount` is
   stored directly on `transactions` rather than always being computed by summing
   `transaction_items.total_price` (minus discount). Check: is `total_amount` ever
   recalculated from line items, or only set once at creation/finalize time? If it's only
   ever set once and never re-derived, this is intentional (a snapshot of the agreed total at
   billing time) — not a bug. Flag only if you find a path where `total_amount` and the sum
   of line items could legitimately diverge without anyone noticing (e.g. a line item edited
   after the transaction was finalized).

## What to actually check across the full schema

1. **List every table and its columns** (you have direct DB access — query
   `information_schema` or equivalent, or pull from `database/supabase-types.ts` if it's
   current).
2. For each table, look for:
   - Columns that duplicate data already derivable from a join (e.g. a patient's name
     stored on a `transactions` row when `patient_id` already joins to get it).
   - Two tables tracking what's functionally the same real-world event under different
     names/structures (similar to the `paymongo_payments`/`transactions` overlap already
     found).
   - Status/enum columns that exist in more than one place and could drift out of sync
     (e.g. `appointments.payment_status` vs. `appointments.status` vs. anything on
     `transactions` — confirm each actually tracks something distinct, per the
     `partial`/`unpaid`/`downpaid` precedent already established in this codebase).
   - Stale/unused columns left over from earlier schema iterations that nothing reads
     anymore.
3. For each finding, report:
   - What's duplicated/denormalized, and where.
   - **Whether it's actually a problem** — some duplication is intentional (snapshots,
     audit trails, performance) and shouldn't be "fixed" just because it's technically
     normalizable. Say so explicitly when that's the case, per items 2 and 3 above.
   - If it is worth fixing: what the fix would require touching (which actions, which
     components, which queries) — i.e. the actual blast radius — so we can judge whether
     it's worth doing now or deferring.

## Output format
A findings report (markdown), one section per table or per finding, **no code changes
applied**. End with a prioritized list: which findings (if any) are worth fixing now versus
documenting and leaving as-is.

## Explicitly out of scope for this pass
- Do not modify any table, run any migration, or change any action/component code.
- Do not re-open the `paymongo_payment_id` decision — that's already settled, just confirm
  it during the audit.
- Do not touch the Full Payment removal, the billing_status split, or anything else already
  closed out in prior fixes — this is a fresh audit of the rest of the schema.