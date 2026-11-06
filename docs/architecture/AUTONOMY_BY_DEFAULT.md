# Autonomy by Default — Operating Principle

**Status:** proposed architecture law; not a deployed capability.

## Principle

For work that has already been authorized within explicit scope, budget, time, and risk limits, autonomous continuation is the default. Routine human intervention should not be required to schedule, dispatch, retry, verify, or settle ordinary eligible jobs.

This principle does not grant new authority. It governs execution only inside authority already granted by Trinity and the applicable protocol policy.

## Default behavior

1. Detect eligible work from protocol-visible state.
2. Validate the job, authorization reference, policy version, budget, and expiry.
3. Atomically claim the job so duplicate observers cannot cause duplicate settlement.
4. Execute through eligible independent providers.
5. Verify results against the task-specific verification policy.
6. Settle or record the defined failure outcome exactly once.
7. Retry or reassign recoverable failures under bounded deterministic rules.
8. Publish a verifiable receipt for each state transition.

## Defined stop conditions

Pause the affected job or capability when any of the following occurs:
- Trinity authorization is denied, missing, expired, revoked, or mismatched.
- A required invariant fails or evidence is contradictory.
- The job exceeds its explicit budget, scope, expiry, or risk bound.
- A security incident or suspected key compromise requires containment.
- Verification cannot establish the required result.
- A protocol upgrade or irreversible action requires additional authorization.
- The network cannot provide the minimum safety guarantees required by the job.

A stop is scoped to the affected action whenever safe isolation is possible; unrelated authorized work may continue. A global pause is reserved for a defined system-wide threat or an explicitly authorized emergency policy.

## Recovery behavior

For recoverable failures, the protocol should:
- use bounded retries with deterministic backoff rules;
- expire abandoned leases and allow safe reassignment;
- deduplicate requests and settlement;
- preserve evidence and job state across provider loss;
- fail over between independent RPC, scheduler, compute, and storage providers;
- alert or request intervention only when automated recovery reaches its defined limit.

Retries must not bypass authorization, increase budgets, broaden permissions, or repeat irreversible external effects.

## Interruption and resumption

Pause and resume are explicit protocol states. Resumption revalidates the authorization, expiry, policy version, and current job state. It does not assume that a prior authorization remains valid forever. Revocation must be enforceable for future actions; already-finalized irreversible external effects may not be reversible.

## Acceptance tests

- An eligible authorized job progresses without a human click at each stage.
- A transient provider failure triggers safe reassignment without central intervention.
- Repeated delivery cannot create duplicate settlement.
- Expired or revoked authorization blocks new protected actions.
- Invalid verification prevents payment.
- A job exceeding its budget halts or follows its preauthorized failure policy.
- One provider outage does not stop unrelated eligible jobs.
- A website outage does not prevent network participants from continuing protocol-authorized jobs.
- Restarting participants does not lose authoritative state or create duplicate effects.
- Every stop and recovery decision has a machine-checkable reason and an auditable receipt.

## Measure success

Measure the percentage of eligible jobs completed without manual intervention, safe recovery rate, duplicate-effect rate, false acceptance rate, time to recover, cost per verified job, and number of centralized dependencies required for routine operation.

“Hard to stop” must mean resilient to ordinary faults and routine friction—not resistant to legitimate authorization revocation, safety containment, or user control.
