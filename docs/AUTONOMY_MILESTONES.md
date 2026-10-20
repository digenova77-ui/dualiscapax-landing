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
- Use idempotency keys at the provider boundary where supported.
- Retry only known-retryable failures; never retry unknown non-idempotent writes automatically.
- Capture structured logs and redact secrets.

## M7 — Machine identity and account provisioning
- Each agent has a distinct machine identity and short-lived least-privilege grants.
- Use official OAuth/device authorization or documented service-account enrollment.
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
M1–M2 are represented by pure modules and tests. M3 has a provider-neutral protocol contract. M4–M5 have in-memory reference implementations. M6 has a one-shot orchestration seam and tests using fake adapters, but no sandboxed worker or resource/egress isolation. M9 has a standard-library SQLite ledger reference with reopen and tamper-detection tests, but production backup/restore, access control, external anchoring, and operational metrics are incomplete. M7 and the remaining M8–M9 work remain incomplete. No live account creation, real provider adapter, persistent worker, or production autonomy is enabled by these modules.
