# Machine Production Integration Contract

Status: design and release-gate document only. No production binding, secret, database, DNS record, or deployment is changed by this proposal.

## Product flow

The intended user flow is:

`authenticate -> quote -> accept -> authorize -> reserve -> compute -> settle -> record`

DCLM is the deterministic execution engine. Iris may prepare or explain a workload, but cannot authorize it or alter its price. Trinity is the sole authorization authority.

## Canonical identity boundary

- Use `https://dualiscapax.com` as the canonical application origin and `dualiscapax.com` as the WebAuthn relying-party ID.
- Complete passkey registration and authentication in the top-level canonical origin.
- The server must generate and consume one-time challenges, validate the returned credential response and exact origin/RP ID, and create the authenticated Unity session only after cryptographic verification succeeds.
- The server-side identity record maps the verified credential to Unity ID. A browser-supplied Unity ID or boolean verification claim is never proof.
- Private authenticator material stays on the authenticator. The application stores only the public credential material and necessary account metadata.
- The current `member.js` and `onboard.js` browser examples are prototypes, not completed server-side passkey authentication.
- The `.ai` HUD remains a presentation surface. Privileged actions are submitted by the canonical `.com` application; the HUD receives no credential or authority material. If embedded, messages are restricted to a strict origin and schema allow-list.

## Identity service

The production Worker identity binding (`IDENTITY_API`) must verify the server-side session and return a Unity principal only after a verified passkey ceremony. Registration and authentication challenges must be fresh, one-time, short-lived, and bound to the ceremony and account. Add rate limits, revocation, session rotation, logout, origin protection, and adversarial tests.

Missing identity service, invalid session, failed assertion, expired challenge, or principal mismatch means deny.

## Machine service contract

The production Worker calls a private server-side machine binding (proposed name `MACHINE_ENGINE`). The browser never selects a backend URL or supplies authoritative pricing.

### Quote

`POST /v1/machine/quote`

- Requires an authenticated Unity session.
- Accepts a bounded, versioned workload.
- Selects the active server-owned price schedule.
- Returns a quote ID, request digest, schedule version, currency, integer minor-unit amount, expiry, and billable status.
- Does not reserve funds or execute work.

### Accept

`POST /v1/machine/accept`

- Requires the same authenticated Unity principal and exact unexpired quote.
- Rechecks request digest, schedule version, currency, and amount.
- Requests a Trinity decision bound to the principal, `machine.run`, workload digest/version, quote ID, expiry, and exact amount.
- Reserves the amount atomically in a durable account ledger only after Trinity allows.
- Is idempotent: repeated acceptance cannot create another reservation.

### Run

`POST /v1/machine/run`

- Requires the accepted quote, matching reservation, and matching Trinity allow decision.
- Consumes the quote exactly once.
- Rejects replay, expiry, principal mismatch, quote tampering, and workload mismatch.
- Executes only the bounded workload covered by the quote and decision.
- Records the result digest, engine version, quote, reservation, authorization reference, and timestamps.

### Settlement

Settle only the reserved amount. Release reservations on pre-execution failure. Reconcile ambiguous/partial execution by idempotency key before retry or refund. Never report a charge or settlement before the durable ledger confirms it.

## Pricing and measurement

- No non-zero tariff is active until the owner approves the currency, units, formula, rounding, version, effective time, limits, and expiry.
- Use integer minor units for currency.
- Without an approved schedule, paid quote/accept/run remain closed. A CA$0.00 demo must be clearly marked non-billable.
- Do not claim joules or watts without a trusted hardware/host meter. User-entered values and browser timing are not billable energy measurements.
- An IoT broker is optional telemetry, never a dependency for core execution or authorization.

## Trinity authority

A generic allow or a receipt for another action is insufficient. Trinity must authorize the exact Unity principal, `machine.run` action, workload digest/version, quote ID, expiry, schedule version, currency, amount, and reservation/idempotency reference.

Iris cannot create, change, or override a Trinity decision. Missing, unavailable, denied, expired, revoked, or mismatched decisions fail closed.

## Durable state and failure behavior

Challenges, credentials, sessions, quotes, reservations, execution claims, settlement, and audit records require durable shared storage and appropriate transactional constraints. Process-local maps and browser storage are not authoritative for one-time claims or balances.

All required service bindings must be real and health-checked. A missing or placeholder binding returns unavailable/closed; there is no mock fallback. Platform secrets remain outside Git.

## Verified current boundary

- Engineering PR #80 implements the bounded deterministic machine core, demo quote, exact quote acceptance, PostgreSQL persistence, cross-instance execution, and replay rejection.
- Full and focused CI passed on `0ec84daf544fef82aa0194ac54ae8bd069b586a5`.
- PR #80 remains draft and unmerged; it is not deployed to the production landing site.
- The production landing Worker has a separate authorization policy. It does not yet authorize `machine.run` or invoke the machine engine.
- Current landing passkey examples do not implement server-side credential verification.
- No approved non-zero tariff, production account ledger, verified Unity identity service, production Trinity machine policy, or production machine binding has been established.
- CI PostgreSQL is ephemeral and is not the user's Amsterdam database.

## Release gates

1. Reviewed server-side passkey registration/authentication and adversarial tests.
2. Production identity binding with verified session state.
3. Trinity policy for exact quote-bound `machine.run`.
4. Private machine service binding and durable shared database.
5. Owner-approved tariff and account reservation/settlement model.
6. End-to-end tests for denial, unavailability, tampering, expiry, insufficient funds, replay, partial failure, settlement failure, and recovery.
7. Explicit production release approval and deployment verification.

Until every gate passes, production paid execution remains closed. This document is not permission to change production DNS, secrets, databases, bindings, or live services.
