# Iris Fuel ledger contract — design only

Repository inspection on 2026-10-27 confirms the browser Fuel helper is a localStorage demo, while the inspected Iris runtime authorizes requests through identity, Trinity, and Iris Memory but does not yet reserve Fuel on the server.

## Identity boundary
The ledger principal must be the canonical Unity identity verified by the identity service. Do not use browser-provided email, a query parameter, or a client balance as authority. Historical email-keyed Stripe grants require verified account linking before they can be spent by a Unity identity.

## Ledger model
Use append-only entries with a unique idempotency key. Derive balance from the sum of signed unit deltas; do not store a mutable browser counter. Stripe and crypto remain separate settlement adapters but converge at this ledger boundary.

- grant: positive units after independently verified settlement.
- reserve: negative units before paid model work, inserted only if balance is sufficient.
- charge: zero-delta audit entry tying successful provider work to a reservation.
- release: positive units once only after a confirmed safe failure.
- adjustment/refund reversal: separately authorized and reconciled entries.

## Private service contract
- balance(principal): return derived balance; principal comes from trusted runtime identity.
- reserve(principal, request_id, units, action, input digest, Trinity receipt): atomically reserve or deny.
- settle(reservation_id, provider receipt, outcome): idempotently record charge or release.
- grant(source rail, settlement reference, SKU, units): adapter-only after verified settlement.
- health: private configuration diagnostics without secrets or user ledger details.

Never expose grant, reserve, settle, or release to browser callers.

## Required ordering
1. Verify the signed runtime request and exact request digest.
2. Verify identity and obtain a matching Trinity allow.
3. Claim the request idempotently.
4. Reserve Fuel atomically before calling the model provider.
5. If the reservation fails, do not call the provider.
6. Record provider outcome and settle once; release only on a confirmed safe failure.
7. Return a receipt linking authorization, reservation, provider outcome, and ledger entry.

The coordination between Iris Memory's request claim and the ledger reservation must be proven with failure-injection tests. Ambiguous provider timeouts stay reserved pending reconciliation rather than being automatically released.

## Test gates
Test unauthenticated access, principal isolation, concurrent reservations, insufficient balance, duplicate requests, changed request digests, duplicate grants, provider success/failure, ambiguous timeouts, Trinity denial, ledger outage, and reconciliation from settlement through charge/release.

## Status
Design only. Not wired into the runtime, not applied to a database, not deployed. Production remains untouched.
