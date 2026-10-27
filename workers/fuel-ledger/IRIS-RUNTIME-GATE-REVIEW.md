# Iris Fuel integration — runtime gate review

Review date: 2026-10-27
Scope: `workers/iris-runtime/worker.mjs`, `workers/iris-memory/worker.mjs`, restored Stripe fulfillment worker.
Status: read-only analysis plus design notes. Runtime behavior has not been changed or deployed.

## Confirmed ordering and gap

The current staging runtime's `/v1/authorize` validates the signed request, verifies identity, obtains a Trinity allow for the exact principal/action/digest, and atomically stores a receipt in Iris Memory. The current `/v1/infer` checks that the receipt is stored and matches the submitted text digest, then calls the model provider.

There is no authoritative Fuel reservation between receipt verification and `MODEL_PROVIDER /complete`. Therefore the runtime cannot yet enforce paid compute using server-side Fuel.

## Additional replay risk to close before paid compute

The inspected `/v1/infer` path verifies that a receipt is known, but the shown path does not atomically transition that request into a one-time inference state before calling the provider, nor does it persist and return a prior provider result. Repeated submissions with the same valid receipt and text appear able to reach the provider repeatedly. The isolate-local `inflight` set only protects `/v1/authorize`, not cross-isolate inference execution.

Treat this as a code-path risk requiring a regression test and fix before paid launch. It is based on the inspected source, not a live exploit test.

## Required durable state machine

Extend the authoritative request store or add a ledger-owned durable state machine. It must coordinate request claim, reservation, provider execution, and settlement without relying on isolate-local memory.

Suggested states:
- `AUTHORIZED`: matching Trinity receipt persisted.
- `RESERVED`: unique Fuel reservation confirmed for principal + request ID + action + digest + units.
- `RUNNING`: one execution owner has atomically claimed the provider attempt.
- `SUCCEEDED`: provider output/receipt persisted; retries return the stored result without another provider call.
- `FAILED_SAFE`: provider failure is known safe; one idempotent release is recorded.
- `UNKNOWN`: provider outcome is ambiguous; keep reservation held and reconcile before retry or release.

State transitions must be atomic and monotonic. Do not allow `RESERVED → RUNNING` more than once unless a recovery protocol can prove the previous provider attempt never executed. Provider idempotency support should be used where available, but cannot be assumed.

## Implementation sequence

1. Add tests proving a valid receipt cannot trigger two provider calls across separate Worker isolates or concurrent requests.
2. Define an authenticated internal ledger API and identity-bound principal mapping.
3. Add atomic reserve / idempotent settle operations with unique constraints and concurrency tests.
4. Add durable inference execution claim and persisted output so retries return the prior result.
5. Bind each paid action to an explicit server-side unit cost and pricing version; client-supplied units are never authoritative.
6. Add recovery/reconciliation for worker crashes and ambiguous provider timeouts.
7. Run failure injection for crashes after reserve, before provider call, during provider call, after provider success, and before settlement.
8. Test Stripe duplicate event/session grants and verify crypto grants enter the same canonical ledger without changing the crypto settlement path prematurely.
9. Only then wire staging bindings and run end-to-end staging tests. Production stays untouched.

## Invariants

- Trinity is the sole authorization gate; identity verification is not authorization.
- No provider call for gated work without a matching Trinity allow, valid durable claim, and successful Fuel reservation.
- No duplicate billable provider call for a request ID.
- No overdraw under concurrent reservations.
- No automatic release when provider outcome is unknown.
- No browser authority over balance, cost, principal, grants, or settlement.
- No KV read-then-write as a financial idempotency mechanism.
- No deployment or checkout activation from this design review.
