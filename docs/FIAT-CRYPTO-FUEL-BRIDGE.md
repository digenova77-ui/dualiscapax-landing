# Fiat + crypto → one canonical Fuel ledger

## Decision

Keep fiat and crypto as separate settlement adapters, converging only after independently verified settlement into one canonical, auditable Fuel ledger. Stripe is the initial fiat adapter; the existing crypto rail remains untouched until its implementation is inspected and mapped.

## Flow

1. Customer selects CAD/USD checkout or the existing crypto route.
2. Adapter verifies settlement evidence (Stripe signature + paid session; crypto chain confirmation and policy).
3. Adapter submits an idempotent grant intent with a stable external transaction/session identifier.
4. Ledger enforces uniqueness and writes an immutable grant lot with source rail, source reference, SKU, amount, currency, conversion/pricing version, units, and timestamp.
5. Iris asks the governed backend for available Fuel and reserves/charges the exact amount atomically with the compute request.
6. A signed receipt links settlement → grant → compute charge. The browser may display a cached balance but cannot mint or authorize Fuel.

## Invariants

- Trinity remains the sole authorization gate; identity proof alone is not authorization.
- No grant from a client-side claim or unverified payment status.
- No mutable browser integer as source of truth.
- No non-atomic KV fallback for monetary entitlements.
- No double credit across Stripe event retries, async success events, or multiple events for one session.
- No silently inferred CAD/USD equivalence. Amounts, currency, fees, refunds, and exchange rules must be explicit.
- Crypto and fiat must use the same ledger contract without pretending they have identical settlement finality or risk.
- Fail closed when the authoritative ledger is unavailable.
- Do not activate checkout or deploy from this restoration branch.

## Open engineering questions

- Locate the existing crypto settlement and grant code, then adapt it to the same ledger interface rather than duplicating accounting.
- Confirm whether Iris's production runtime can read D1 directly or requires a private ledger API.
- Define idempotent compute reservations/charges and cancellation/refund semantics.
- Decide whether Fuel units are service credits only or tied to a published compute/energy conversion schedule. Do not claim energy backing until measurement, reserves, and redemption rules exist.
- Reconcile CAD/USD prices, Stripe fees, tax, refunds, disputes, and chargebacks before public launch.

## Confirmed integration gap (repository inspection, 2026-10-27)

- `js/fuel-ledger.js` describes itself as a local demonstration stub and stores `dc_fuel_balance_v1` in browser localStorage. Its `grant()` and `burn()` methods are client-side; they are not a production ledger.
- `js/iris-fuel-gate.js` checks that browser-side balance and invokes the local debit method synchronously. It does not call a canonical server-side Fuel balance/reservation endpoint.
- `workers/iris-runtime/worker.mjs` performs identity verification, Trinity evaluation, and an atomic request/receipt claim through `IRIS_MEMORY`, but the inspected `/v1/authorize` path has no Fuel ledger binding or atomic Fuel charge/reservation. Its comments identify it as staging/non-production.
- `bind-success.html` explicitly says the return page does not mint Fuel and that only the signed Stripe webhook plus D1 ledger can credit it. This is the correct trust boundary, but the authoritative ledger-to-Iris consumption link is not yet present in the inspected code.
- The gateway page labels checkout closed. No evidence in this inspection proves that live Stripe checkout, D1 bindings, or a production Iris Fuel ledger is active.

## Next implementation slice

Do not wire browser localStorage into a production grant. Design a private ledger service contract that supports:
- authenticated balance read;
- atomic reserve/debit bound to principal + request ID + authorized action + input digest;
- idempotent settlement/release of the reservation;
- immutable grant and charge records with payment rail/source references;
- reconciliation and refund/dispute adjustments as separate ledger entries.

The Iris runtime must first receive a valid Trinity allow, then atomically claim the request and reserve the required Fuel before invoking the model provider. If the authorization or ledger reservation fails, the model provider must not be called. Avoid a separate non-atomic "charge later" step. Define rollback/release behavior for provider failures and retries.

The exact order must be designed carefully so the Trinity authorization receipt, request idempotency claim, and Fuel reservation cannot diverge. This requires integration tests against the actual memory/ledger service contracts before deployment.
