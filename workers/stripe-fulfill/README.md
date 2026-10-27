# DualisCapax Fiat-to-Fuel fulfillment bridge

Status: **restoration branch / not deployed / checkout remains closed**.

This worker is the Stripe settlement adapter, not the Fuel source of truth. A verified Stripe event may produce a write-once grant in D1; Iris must consume Fuel through the governed runtime and must not trust a browser-local balance.

## Safety boundaries

- Stripe signature is verified over the raw request body with a timestamp tolerance.
- Only allowlisted event types, SKUs, CAD amounts, and paid sessions are eligible.
- D1 is required for fulfillment. KV fallback is deliberately disabled because read-then-write claims are not atomic.
- D1 uses unique event IDs and checkout session IDs; fuel credits are write-once lots, never a mutable running total.
- A successful webhook receipt is not proof that Iris has consumed the credit. Runtime integration must be tested separately.
- Current `js/fuel-ledger.js` is explicitly a browser-local demonstration stub, and `js/iris-fuel-gate.js` reads/debits that client balance. This is not authoritative production accounting. Do not launch paid compute until the governed runtime has a server-side balance/reservation/charge path.
- This branch does not open checkout, create live Payment Links, change Stripe settings, set secrets, bind Cloudflare resources, or deploy a Worker.

## Required environment bindings

- `STRIPE_WEBHOOK_SECRET`: Worker secret; never commit.
- `DB`: Cloudflare D1 binding with `schema.sql` applied.
- `PAYMENT_LINK_SKU_JSON`: optional allowlisted Payment Link ID → SKU map; only configure after verifying actual links.

## Local / staging acceptance gates

1. Invalid signature rejected; stale timestamp rejected.
2. Unknown event ignored; failed or unpaid checkout never grants.
3. Unknown SKU, currency mismatch, or amount mismatch fails closed.
4. Replayed event ID grants once.
5. Different event IDs for the same checkout session still grant once.
6. D1 unavailable or schema missing returns failure and grants nothing; no KV fallback.
7. Fuel balance is derived from ledger lots; browser localStorage is never authoritative.
8. Iris's governed runtime reads the canonical balance and atomically charges usage under Trinity authorization.
9. Refunds, disputes, chargebacks, and reconciliation policy are defined before live launch.
10. Checkout stays closed until a human operator explicitly approves a production launch after passing the above gates.
