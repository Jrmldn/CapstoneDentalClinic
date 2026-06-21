# Payment Gateway Integration — Common Mistakes & How to Avoid Them

Reference checklist for integrating a payment gateway (e.g. PayMongo) into AppointDent or any Next.js/Supabase project.

## 1. Trusting the frontend as the source of truth
A success redirect in the browser does not mean payment cleared. Network delays, refreshes, or provider timeouts can trigger a success state without actual completion.
**Avoid by:** treating `/success` as a "processing" state. Grant access/fulfillment only after the webhook confirms the event server-side — never on the client redirect alone.

## 2. No webhook signature verification
Anyone can POST to a public webhook endpoint. Without verifying the cryptographic signature, attackers can forge payment events and grant themselves free access.
**Avoid by:** validating the gateway's signature (HMAC or equivalent) on every webhook request before processing. Reject mismatches outright.

## 3. Creating the payment before the order
Creating a payment intent first and trying to associate it with an order afterward leaves you with no record to reconcile if the server crashes mid-flow.
**Avoid by:** always creating the order record first (status: pending), then initiating payment with a reference to that order ID.

## 4. No idempotency on retries
Network timeouts cause retried requests. Without idempotency keys, retries create duplicate transactions and double-charge customers. The same applies to incoming webhooks — gateways deliver events "at least once," so duplicates are expected.
**Avoid by:** using idempotency keys on outgoing payment requests, and storing processed webhook event IDs (unique index) so repeat deliveries are no-ops.

## 5. Slow or synchronous webhook handlers
If a webhook handler takes too long to respond, the provider may time out and retry — causing duplicate processing.
**Avoid by:** returning a 200 response immediately, then processing the event asynchronously (background job/queue), not inline in the request.

## 6. Only handling "success" and "failure"
Real payment flows include soft declines, referrals, timeouts, processing states, and (for subscriptions) failed renewals — not just approved/declined. Ignoring `payment_failed`-type events can leave users on paid access after a card decline.
**Avoid by:** handling the full event lifecycle (pending, succeeded, failed, disputed, refunded) with distinct logic and user-facing messaging for each.

## 7. Handling raw card data yourself
Routing raw card numbers through your own servers — even temporarily — dramatically increases PCI DSS scope and security risk.
**Avoid by:** using the gateway's hosted fields/widget for card capture so tokenization happens on their end. Your backend should only ever see tokens, never raw card numbers.

## 8. No reconciliation process
Your database and the gateway's dashboard will occasionally diverge — silently, until it becomes a financial dispute.
**Avoid by:** running a periodic background job that compares your orders table against the gateway's records (e.g. last 24h) and flags discrepancies.

## 9. Secrets in version control
Payment provider secret keys committed to git — still a common, fully preventable mistake.
**Avoid by:** keeping secrets in environment variables only (never committed), and treating any key that was ever committed as compromised — rotate it immediately.

## 10. Under-testing failure paths
A flow that works in a demo often breaks in production: interrupted authentication, late webhooks, expired tokens, retried checkouts on poor connections.
**Avoid by:** testing the full matrix before launch — successful payment with webhook receipt, declined card with proper messaging, duplicate webhook delivery (must be a no-op), and session expiry/abandonment handling.

## 11. (PayMongo-specific) Relying on webhooks alone
Some PayMongo users report webhook reliability issues in production.
**Avoid by:** not relying solely on webhooks for critical state changes — add a fallback status-polling check for cases where a webhook may be delayed or missed.

---

**Core principle underlying all of the above:** the gateway and your backend are the source of truth — never the client. Order existence, payment status, and idempotency keys are what keep the system reliable under retries, duplication, and delay.