# DualisCapax Swarm Synthesis and Wave Control

Status: isolated design synthesis; not a claim of a live distributed swarm.

## Thesis

Do not clone a vendor stack. Extract useful invariants and combine them behind one inspectable protocol:

- Agent orchestration: specialist roles, bounded handoffs, explicit ownership.
- Agent evaluation: traces, regression suites, outcome-based iteration.
- Distributed systems: durable task identity, idempotency, bounded retries, leases, explicit failure states.
- Reconciliation controllers: compare desired state with observed state and converge safely.
- Formal methods: invariants, fail-closed transitions, independent checks, rollback, least privilege.

The aim is a small number of composable primitives, not a large framework.

## Research references

1. OpenAI Agents SDK: https://developers.openai.com/api/docs/guides/agents/sdk and https://openai.github.io/openai-agents-python/multi_agent/
2. Anthropic, Building Effective Agents: https://www.anthropic.com/engineering/building-effective-agents
3. Ray task and actor fault tolerance: https://docs.ray.io/en/latest/ray-core/fault_tolerance/actors.html
4. Kubernetes controllers: https://kubernetes.io/docs/concepts/architecture/controller/
5. SWE-bench: https://www.swebench.com/

These sources document useful primitives; they do not prove that any one vendor has solved general autonomous swarm operation.

## What to combine

### Initiative without unbounded authority
Any registered worker may initiate bounded discovery or proposal work. Each task should carry a stable ID, scope, budget, expiry, dependencies, and idempotency key. Initiative does not imply permission to mutate protected systems.

### Events as the shared interface
Every meaningful transition becomes an event: discovered, proposed, challenged, validation-pending, verified, rejected, blocked, released, measured, or rolled back. Iris reads the same event stream as the HUD; the HUD must not invent activity or maintain a competing status source.

### Truth and scheduling are separate
A score may prioritize what to investigate; it cannot make a claim true. Claims require independent evidence review. UNVERIFIED, VERIFIED, REJECTED, BLOCKED, and INCONCLUSIVE must remain distinct.

### Deterministic wave planning
The wave planner should select eligible proposals under a task-count limit and estimated-cost budget, use transparent scoring and stable tie-breaking, and explicitly return execution_authorized=false. Planning must not run tasks, authenticate identities, measure actual costs, or grant permissions.

### Independent verification
A verifier must be authenticated separately from the claim author and inspect or reproduce evidence. A different string in a validator_id field is not authentication. Evidence hashes establish byte integrity, not truth or relevance.

### Feedback that compounds safely
At the end of each wave, compare predicted and observed outcomes: accepted result, regression, latency, compute/token cost, metered energy if available, duplicate work, and recovery time. Promote policies or skills only after they pass a fixed regression corpus and an independent gate. A candidate cannot redefine its own success criteria or replace its own verifier.

## Control-loop contract

1. Observe facts, task outcomes, failures, measurements, and evidence references.
2. Diagnose gaps while keeping causal hypotheses labelled as hypotheses.
3. Propose bounded candidate work.
4. Challenge the proposal and identify safety/cleanup risks.
5. Plan deterministically under explicit count and cost limits.
6. Verify independently.
7. Apply policy and authorization outside the planner.
8. Measure outcomes against a baseline.
9. Add regression cases and propose reusable improvements.
10. Repeat while retaining the last known-good policy and rollback path.

## Required invariants

- TRUTH_OR_NOTHING: unknown is not true.
- NO_FORCE: a proposal is not permission to execute.
- HOST_SAFE: no production actuator from a planning event.
- CLEANUP_FIRST: every mutation plan includes rollback or cleanup.
- Stable task IDs and idempotency keys; duplicate IDs fail closed.
- Deterministic selection for identical inputs.
- Hard resource budgets; no unbounded retries or recursion.
- Authenticated verifier distinct from the claim author.
- Failed, timed-out, missing, or contradictory checks never become PASS by default.
- Preserve evidence and the previous known-good state for audit and rollback.

## What not to copy

- Vendor lock-in as the core architecture.
- Agent count as a proxy for intelligence.
- Free-form messages as the sole state store.
- Self-reported completion as proof.
- Infinite retries, unbounded recursive delegation, or hidden side effects.
- A scalar score that conflates truth, risk, cost, and permission.
- Claims of real joules, eFuse settlement, or economic output without trusted measurement.

## Current implementation boundary

The event protocol and local lifecycle are standard-library Python primitives. They do not call a model, connect distributed workers, authenticate principals, measure energy, or execute shell commands. The JSONL hash chain is single-writer and tamper-evident, not distributed consensus. Production integration requires a transactional store, authenticated identities, isolated execution, trusted measurements, and a separately authorized release path.

## Acceptance criteria

- Unit tests cover deterministic planning, invalid input, budgets, and no execution authority.
- Existing protocol and lifecycle tests remain green.
- Same candidate set yields same plan regardless of input order.
- Selected work remains PLANNED, never VERIFIED or RELEASED.
- Event persistence is connected to a transactional task store before concurrency is introduced.
