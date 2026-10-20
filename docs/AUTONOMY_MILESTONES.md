# Autonomous Network — Measurable Milestones

The milestones are acceptance criteria, not claims that all capabilities are already live.

## M1 — Deterministic fit and authority gate
- Candidate capability, reliability, cost, and scope fit are scored deterministically.
- Score and authorization are separate decisions.
- Missing task approval, owner grants, compliant official interface, or allowed side effects blocks execution.
- Automated tests cover positive and refusal paths.

## M2 — Integration consent lifecycle
- Discovery cannot grant itself access.
- Provider terms are accepted by the owner where required.
- A connected state requires a provider-supported flow, verified authorization, and the requested least-privilege scopes.
- Revocation and terminal blocked states cannot silently reconnect.

## M3 — Provider-neutral adapters
- Providers implement a common describe/execute contract.
- Every execution request carries a task identity, idempotency key, action, payload, and explicit granted scopes.
- Adapters must enforce scopes locally and return evidence digests.
- This repository defines the contract only; it does not yet contain live provider adapters.

## M4 — Supervisor and bounded retries
- Task IDs are deterministic for a task and idempotency key.
- Repeated submission with the same key and same payload does not duplicate a job.
- Reusing a key for different work is rejected.
- Every start requires an explicit authorization boolean from the caller.
- Retry attempts are capped at 10; failure reaches a terminal exhausted state.

## M5 — Tamper-evident ledger
- Each event contains a sequence, previous hash, canonical payload, and event hash.
- Any modified payload, broken sequence, or changed parent hash fails verification.
- The in-memory implementation supports unit tests. A SQLite-backed append-only API now persists rows transactionally and verifies the hash chain after reopening. Hash chaining alone is not a signature or external anchor; database access control, backups, signed checkpoints, external anchoring, and crash recovery remain future work.
- A one-shot orchestrator now requires an injected policy gate, exact least-privilege scopes, owner terms acceptance, matching task identity, official adapter metadata, and a policy version before calling an adapter.
- An unknown adapter exception is not retried automatically because the external side effect may already have occurred.

## M6 — Isolated execution and recovery
- Run adapters in an isolated worker with resource limits, timeouts, allowlisted egress, and cancellation.
- A fail-closed sandbox policy contract now checks task/authority binding, backend attestation, least-privilege read/write/environment/egress grants, forbidden host credential/privileged access, and bounded CPU/memory/process/wall-time limits. It produces a deterministic launch plan only after approval; it does not itself enforce OS isolation or start a process.
- The durable queue supports owner-checked lease renewal; expired leases cannot be revived, and lease duration is bounded.
- Cooperative cancellation now transitions queued work directly to `cancelled`, marks running work `cancel_requested`, and requires the lease-owning worker to acknowledge cancellation. Expired cancellation requests recover to `cancelled`; this is a protocol, not a hard process kill, so a future OS supervisor must enforce termination.
- A synchronous durable worker-runner reference now claims a lease, requires a task-bound authority/policy-version/exact-scope/terms grant, passes that exact grant to the executor, and blocks on missing/invalid policy or unknown executor outcomes. The executor receives a cooperative checkpoint context to renew its lease and observe cancellation before further work. It only retries a failure when the executor explicitly classifies it as retry-safe; cancellation during an in-flight side effect preserves a confirmed success and blocks uncertain outcomes. This is still a reference runner: no process isolation, daemon, secret vault, or real provider adapter is wired.
- Use idempotency keys at the provider boundary where supported.
- Retry only known-retryable failures; never retry unknown non-idempotent writes automatically.
- Capture structured logs and redact secrets.
- A deterministic evidence-envelope utility now recursively redacts credential-like fields and common bearer/token patterns, bounds nesting, collection sizes, strings, and total envelope size, and hashes canonical JSON. This is a content digest, not a producer signature or external attestation.

## M7 — Machine identity and account provisioning
- Each agent has a distinct machine identity and short-lived least-privilege grants.
- Use official OAuth/device authorization or documented service-account enrollment.
- A provisioning contract now prepares an approved machine service identity request and permits dispatch only through an injected official provisioning adapter after explicit owner approval, owner terms acceptance, a verified terms version, and an approval reference. It rejects unsupported arbitrary signup and validates provider identity and exact granted scopes.
- Automation may discover services and prepare signup/consent requests.
- Human/provider-required identity checks, terms acceptance, payment, MFA, and legal consent remain explicit.
- No fake identities, CAPTCHA bypass, credential sharing, or signup-limit evasion.
- Secrets stay in a dedicated secret manager and are never committed or written into URLs/logs.

## M8 — Closed-loop engineering
- Supervisor can open a scoped task, run tests, collect results, prepare a repair, and open a PR.
- Protected branches and production changes require configured repository policy and owner approval.
- It must stop on ambiguous authority, policy drift, repeated failure, unexpected side effects, or a request to change its own governing rules.

## M9 — Durable operation and observability
- Persist job and ledger state with migrations, backup/restore, and integrity checks.
- Add metrics for success rate, retry rate, latency, cost, refusals, and provider errors.
- Health checks and alerting must distinguish an unavailable provider from a failed integrity check.

## Current honest status
M1–M2 are represented by pure modules and tests. M3 has a provider-neutral protocol contract. M4–M5 have in-memory reference implementations. M6 now has a fail-closed sandbox policy/launch-plan contract, queue lease renewal, bounded redacted evidence envelopes, and regression tests, but no OS-enforced sandbox backend, process launcher, cancellation supervisor, or real resource/egress isolation. The worker runner is synchronous and requires injected policy and executor functions. M9 has a standard-library SQLite ledger reference with reopen and tamper-detection tests, but production backup/restore, access control, external anchoring, and operational metrics are incomplete. M7 now has an approval-gated provisioning contract and fake-provider tests, but no real provider adapter, credential vault, or actual account creation has been connected. The remaining M8–M9 work remains incomplete. No live account creation, real provider adapter, continuously running worker process, or production autonomy is enabled by these modules. The queue and ledger are persistence primitives only; they do not themselves authorize or execute tasks.
