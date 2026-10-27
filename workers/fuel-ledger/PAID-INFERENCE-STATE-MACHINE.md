# Iris paid inference execution contract

Status: design gate for staging implementation; not wired or deployed.

## Objective
A valid authorization receipt is not a reusable permission to invoke a billable provider indefinitely. The durable service must arbitrate execution across Worker isolates and persist the terminal result.

## Request identity
An execution is uniquely keyed by the receipt's request ID. The immutable fingerprint includes:
- canonical Unity principal
- receipt ID and contract
- action
- input SHA-256
- server-derived pricing version and required Fuel units

Any retry that changes a fingerprint field is a conflict, not a new attempt.

## Durable states
- AUTHORIZED: Trinity allow receipt persisted.
- RESERVED: exact required Fuel atomically reserved.
- RUNNING: one durable owner holds the single provider-attempt claim.
- SUCCEEDED: output and provider receipt persisted; retries return this same output without another provider call.
- FAILED_SAFE: confirmed non-execution or confirmed safe failure; release is recorded once.
- UNKNOWN: provider may have executed but outcome is uncertain; reservation remains held pending reconciliation.

Allowed transitions:
AUTHORIZED → RESERVED → RUNNING → SUCCEEDED
AUTHORIZED → RESERVED → FAILED_SAFE (only when provider definitely was not called)
RUNNING → FAILED_SAFE only when the provider confirms a safe failure
RUNNING → UNKNOWN when execution outcome cannot be established
UNKNOWN → SUCCEEDED or FAILED_SAFE only after provider reconciliation

No transition may silently reset RUNNING or UNKNOWN to permit a second provider call. A lease expiry alone is not proof the provider did not execute.

## Atomic operations
1. `reserveExecution(fingerprint, units)`: validate the persisted Trinity receipt; atomically reserve Fuel and create execution state. Duplicate identical calls return the existing state; mismatched calls conflict.
2. `claimProviderAttempt(request_id)`: one-time compare-and-set RESERVED → RUNNING, returning an execution token. No second token is issued.
3. `completeExecution(request_id, token, provider_receipt, output)`: atomically persist output and terminal success. A duplicate identical completion is idempotent; a different output/receipt conflicts.
4. `markUnknown(request_id, token, reason)`: preserve the reservation and block retries until reconciled.
5. `releaseSafeFailure(request_id, token, evidence)`: only after authoritative proof of safe failure, append one release and transition to FAILED_SAFE.
6. `getExecution(request_id, fingerprint)`: returns durable state/result only when the caller's trusted runtime context matches the stored principal and digest.

All operations require authenticated internal service access. Never expose these operations directly to browsers.

## Cross-service atomicity
Iris Memory and a separate D1 ledger cannot participate in one shared transaction. The staging design therefore needs a durable saga/outbox or a single authoritative coordinator with recoverable states. Every step must be idempotent and reconcile after crashes. Do not claim the operation is atomic across services unless the implementation demonstrates it.

Recommended saga:
- Persist AUTHORIZED + immutable fingerprint.
- Request ledger reservation using deterministic idempotency key; record reservation ID.
- CAS state to RESERVED, reconciling a crash between ledger success and state update by looking up the deterministic reservation.
- CAS RESERVED → RUNNING before provider invocation.
- Persist result and ledger settlement; if a crash occurs after provider success but before result persistence, query provider using its idempotency/reference support. If the provider offers no idempotency or lookup, mark UNKNOWN and require reconciliation rather than automatically retrying.
- Return stored output on retries after SUCCEEDED.

## Security and accounting rules
- Required Fuel units and pricing version come from trusted server configuration, never the client body.
- Gated actions cannot call the provider without Trinity allow and a confirmed reservation.
- If the ledger is unavailable, fail closed.
- A reserve deducts available balance once. Successful charge is an audit entry and must not deduct the same units again.
- Release credits back once only after a confirmed safe failure.
- Unknown provider outcome keeps funds reserved.
- No browser-local balance is authoritative.
- No direct provider call is permitted from the client for a governed action.

## Required acceptance tests
- Two concurrent calls with identical request fingerprint: one provider attempt at most.
- Same request ID with altered principal/action/digest/units: conflict, no provider call.
- Replay after SUCCEEDED: identical persisted output, provider call count unchanged.
- Crash after reservation before RUNNING: recovery discovers existing reservation and does not double reserve.
- Crash after RUNNING before provider response: state UNKNOWN; no automatic second provider call.
- Crash after provider success before persistence: reconciliation or UNKNOWN; no blind retry.
- Confirmed provider failure: exactly one release.
- Ambiguous timeout: no release and no second provider attempt until reconciliation.
- Trinity denial, invalid/expired/revoked receipt, or ledger outage: no provider call.
- Concurrent distinct requests cannot overdraw one principal's Fuel.
- Duplicate Stripe event and duplicate checkout session create one grant.
- Historical email grants are not spendable until verified identity linking.
- Stripe and crypto settlement adapters both create provenance-tagged grants in the same canonical ledger.
- Logs contain correlation IDs but no secrets, raw payment details, or sensitive model output by default.

## Exit criteria
Do not enable paid compute until the staging service bindings and tests prove these behaviors under concurrent requests and injected failures. Production deployment and checkout activation require a separate explicit approval.
