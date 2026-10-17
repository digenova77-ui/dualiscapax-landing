# DCLM Perpetual Autonomy Readiness

**Date:** 2026-10-17 UTC  
**Architecture:** OmniState Autonomous Hybrid Compute  
**Status:** Assessment plan; not a completion claim  
**Scope:** Compute floor through reproducible build, state, job execution, self-modification, recovery, and long-duration operation  
**Safety boundary:** Isolated development and disposable VM first. No production deployment, DNS, credentials, live server, firewall, database, or auth-provider changes.

## Purpose

Determine whether the Deterministic Compute Logic Machine (DCLM) can safely construct, test, maintain, and recover its own architecture from the compute level outward.

“Perpetual” means designed for continuous operation with bounded failure detection and recovery. It does not mean guaranteed literal uptime or immunity to hardware, power, network, storage, or dependency failure.

## Governing contract

Every component and autonomous job must obey all four laws:

1. `TRUTH_OR_NOTHING` — claims require evidence; unknown remains unknown.
2. `NO_FORCE` — only explicitly authorized state transitions may execute.
3. `HOST_SAFE` — resource, permission, and environment boundaries are enforced.
4. `CLEANUP_FIRST` — incomplete work and residue are accounted for before unsafe continuation.

Lifecycle principle: **Continuity → Unity → Truth (CUT)**.

- **Continuity:** preserve versioned state, history, provenance, and recoverability.
- **Unity:** use one explicit contract for state, jobs, authority, and component handoffs.
- **Truth:** independently verify outcomes before marking them accepted.

DCLM means **Deterministic Compute Logic Machine**. Probabilistic or quantum-inspired algorithms may propose candidates; they do not bypass deterministic validation or authorization.

## Evidence status vocabulary

- **PASS:** acceptance test ran against a named version and evidence is linked.
- **PARTIAL:** some implementation exists, but the full boundary is not proven.
- **BLOCKED:** a named dependency, permission, or missing primitive prevents the test.
- **NOT TESTED:** no sufficient evidence has been collected.
- **FAIL:** test ran and failed its acceptance criterion.
- **NOT APPLICABLE:** rationale recorded.

A checked box is not evidence by itself. Each PASS record must include UTC time, commit/build SHA, exact command or test, expected and actual result, evidence link/log, and residual risk.

## Gate 0 — Authority and host safety

- [ ] Every job declares owner/authority, purpose, inputs, outputs, permitted side effects, and target environment.
- [ ] Unknown authority, ambiguous scope, or missing prerequisites returns `BLOCKED_WITH_EXACT_MISSING_PRIMITIVE`.
- [ ] Read-only inspection is separated from mutation.
- [ ] Mutating tasks run only from an explicit allowlist and inside a bounded sandbox.
- [ ] Production-impacting operations require a separate explicit approval; CI cannot infer approval from a green check.
- [ ] Credentials are never embedded in source, job payloads, artifacts, URLs, or logs.
- [ ] CPU, memory, disk, network, execution time, and retry counts have enforced limits.
- [ ] Emergency stop and known-good recovery path are documented and tested.
- [ ] No self-modification can expand its own permissions or disable these gates.

**Gate result:** NOT TESTED until negative tests demonstrate each refusal.

## Gate 1 — Deterministic compute floor

- [ ] Define canonical schemas for input, state, transition, output, and error.
- [ ] Pin code version, dependencies, configuration, locale/time assumptions, and any random seed.
- [ ] Identical declared inputs and initial state produce identical canonical outputs where determinism is required.
- [ ] Hashes are computed over a documented canonical representation.
- [ ] Clock, network, filesystem, and external service reads are explicit inputs—not hidden sources of nondeterminism.
- [ ] Tests distinguish deterministic core logic from probabilistic proposal generation.
- [ ] Rejected, timed-out, and malformed work cannot be reported as successful.
- [ ] Test vectors and expected outputs are committed and reproducible.

**Acceptance:** repeat the same test vectors in clean environments and compare canonical output and evidence hashes.

## Gate 2 — PlanckOS runtime and boot

- [ ] Identify the authoritative PlanckOS source repository, entry point, dependencies, and build instructions.
- [ ] Record baseline commit and current service/process/listener state using read-only inspection.
- [ ] Produce a reproducible build from a clean checkout.
- [ ] Build a bootable image in a disposable VM; do not replace the live Ubuntu host as an experiment.
- [ ] Boot the image and verify process supervision, networking, storage, permissions, and resource controls.
- [ ] Restart and shut down cleanly; test missing configuration and unavailable dependencies.
- [ ] Record image hash, build provenance, boot logs, and known limitations.
- [ ] Keep the current live server and database untouched until an independent migration plan and approval exist.

**Acceptance:** a second clean build is byte-identical where the build is designed to be reproducible, or all nondeterministic build inputs are identified and explained.

## Gate 3 — Durable state and recovery

- [ ] Define one canonical state schema, versioning rules, and migration policy.
- [ ] Make authoritative state transitions atomic or explicitly recoverable.
- [ ] Persist a durable job identity and idempotency key before executing side effects.
- [ ] Detect truncated, corrupt, stale, or contradictory records.
- [ ] Maintain append-only provenance or equivalent tamper-evident evidence for accepted transitions.
- [ ] Test disk-full, interrupted write, process kill, host restart, missing record, and corrupted record.
- [ ] Restore from backup into a clean disposable instance.
- [ ] Compare recovered state against an independently computed expected state.
- [ ] Define recovery-time and recovery-point objectives before claiming service-level guarantees.

**Acceptance:** every injected fault is detected; recovery yields the documented state or a safe, explicit blocked state—never fabricated success.

## Gate 4 — Universal Protocol (UP) and component contracts

- [ ] Specify versioned request/response schemas, authority, identity, limits, and error semantics.
- [ ] Keep existing DCCP routes compatible until UP contract tests pass and a migration is separately approved.
- [ ] Reject unknown versions, invalid signatures, oversized payloads, stale requests, and unauthorized operations.
- [ ] Use bounded timeouts, cancellation, idempotency, and duplicate-work suppression.
- [ ] Record request hash, execution version, state transition, and result evidence without logging sensitive payloads.
- [ ] Test unavailable kernel, disconnected peer, malformed response, and conflicting state.
- [ ] A client-supplied “accepted” flag or local receipt is never proof of server-side authorization.
- [ ] Test interoperability with independent contract fixtures.

**Acceptance:** all contract tests pass for valid, invalid, duplicate, stale, and unavailable cases.

## Gate 5 — Autonomous task loop

- [ ] Durable queue states are explicit: OPEN → VALIDATED → CLAIMED → RUNNING → VERIFIED or FAILED/BLOCKED.
- [ ] Validate task schema and operation allowlist before claiming work.
- [ ] A claim has an owner, expiry/lease policy, and deterministic work key.
- [ ] Expired claims can be recovered without duplicate irreversible side effects.
- [ ] Every operation has a success predicate, timeout, bounded retry policy, and cleanup rule.
- [ ] Failed tasks preserve diagnostic evidence and do not disappear from the queue.
- [ ] The system distinguishes proposed, approved, running, completed, and independently verified states.
- [ ] Two independent workers racing for the same task cannot both commit the same effect.
- [ ] Backpressure prevents an unbounded queue from exhausting the host.

**Acceptance:** concurrent duplicate submissions and worker termination produce one auditable outcome with no duplicate side effect.

## Gate 6 — Safe self-construction and self-repair

- [ ] DCLM can inventory source, dependency graph, configuration, and tests without changing the baseline.
- [ ] A generated change is a reviewable patch with a declared objective and affected files.
- [ ] Changes build in a clean isolated workspace without production secrets.
- [ ] Unit, contract, integration, security, and regression tests run on the exact candidate SHA.
- [ ] A passing test suite is necessary but not sufficient: policy and scope checks also pass.
- [ ] The candidate is compared with a known-good baseline and measured against explicit acceptance criteria.
- [ ] Failed candidates are discarded or quarantined; the last known-good build remains available.
- [ ] Promotion is limited to a sandbox until separately authorized.
- [ ] Rollback is tested, not merely documented.
- [ ] Self-modification cannot rewrite the acceptance criteria, erase failed evidence, or weaken the four laws.

**Acceptance:** inject a known defective patch and demonstrate automatic rejection; inject a passing bounded patch and demonstrate isolated build, test, promotion, and rollback.

## Gate 7 — Continuous operation and recovery

- [ ] Supervisor detects process exit, deadlock/health failure, and repeated restart loops.
- [ ] Restart policy uses bounded exponential backoff and a visible circuit-breaker/blocked state.
- [ ] Monitor disk, memory, CPU, network, certificate expiry, dependency availability, and queue backlog.
- [ ] Monitor alerts are independent of the component being monitored where practical.
- [ ] Backup integrity is checked and restoration is periodically exercised.
- [ ] Node/network partition and stale-peer behavior are defined.
- [ ] Clock drift and expired credentials are detected without unsafe automatic privilege expansion.
- [ ] Graceful degradation preserves critical safety invariants.
- [ ] A long-duration soak test records uptime, restarts, errors, backlog, resource trends, and recovery events.
- [ ] State an explicit tested duration and workload; never infer “perpetual” from a short smoke test.

**Acceptance:** a documented soak test and fault-injection run meet predefined availability and recovery thresholds without data-integrity violations.

## Gate 8 — Quantum-inspired / optical-inspired optimization

- [ ] Name the target workload and measurable objective before selecting an algorithm.
- [ ] Compare against a strong practical classical baseline on the same inputs and resource budget.
- [ ] Measure quality, wall-clock latency, CPU/GPU/energy cost where available, memory, and repeatability.
- [ ] Record random seeds and uncertainty for probabilistic search.
- [ ] Treat optical/diamond/gem pathways as an architecture metaphor unless a real optical implementation is measured.
- [ ] Do not claim quantum computation or quantum advantage from ordinary simulation alone.
- [ ] Optimization output is a proposal; DCLM validates it against hard constraints before any state mutation.
- [ ] Retain the baseline path if an optimization fails to demonstrate a repeatable benefit.

**Acceptance:** a repeatable benchmark report shows the workload, baseline, environment, raw results, variance, and limitations.

## Gate 9 — Independent verification and release

- [ ] Maintain a machine-readable inventory of components, versions, interfaces, and dependencies.
- [ ] Tie each result to exact commit/image SHA and test artifacts.
- [ ] Separate static analysis, unit tests, integration tests, browser tests, live service tests, and production verification.
- [ ] Verify logs and receipts independently; do not trust the worker's success statement alone.
- [ ] Run a security review of permissions, supply chain, secrets, update mechanism, and rollback.
- [ ] Verify the exact artifact that passed tests is the artifact proposed for release.
- [ ] Require explicit release approval for production-impacting changes.
- [ ] After approved release, verify observed behavior independently and keep rollback available.

## End-to-end acceptance drill

Run only in a disposable VM and isolated test repository:

1. Start from a clean, pinned source tree.
2. Build the runtime and boot it without manual code edits.
3. Submit one valid bounded task and one malformed/unauthorized task.
4. Have DCLM propose a small, reversible change to a test application.
5. Inject a defective candidate; confirm the gate rejects it and retains evidence.
6. Test a valid candidate; build and test it in isolation.
7. Kill the worker mid-task and restart; confirm idempotent recovery.
8. Corrupt a test state record and exhaust a disposable disk quota; confirm safe refusal/recovery.
9. Verify ledger, final state, build hash, tests, cleanup, and rollback independently.
10. Repeat from a clean environment and compare outcomes.

**Overall PASS:** all mandatory assertions pass on a named candidate, evidence is reproducible, rollback works, and no protected production system is touched.

**Overall NO-GO:** any unbounded mutation, missing authority, false success, unrecoverable partial effect, unverifiable artifact, or violation of a governing law.

## Initial evidence ledger — 2026-10-17

| Area | Initial status | Evidence / limitation |
|---|---|---|
| Factory queue validation | PARTIAL / FAIL-CLOSED | Factory PR #1, head `d801391ea320eac221ed0dd9ac1952c520b8cd1f`: GitHub Actions runs [39009443617](https://github.com/digenova77-ui/dualiscapax-factory-queue/actions/runs/39009443617) and [39009441525](https://github.com/digenova77-ui/dualiscapax-factory-queue/actions/runs/39009441525) passed. Malformed/invalid tasks are rejected; all declared operations (`inventory`, `ingest`, `classify`) remain blocked because none has a verified real handler. A filesystem lock serializes concurrent invocations, with a regression test. The queue currently performs no domain work; this is intentionally safer than false completion. Still missing real handlers, lease/expiry policy, crash recovery between claim and receipt, durable state-transition design, and an end-to-end worker-kill test. |
| Read-only inventory primitive | PARTIAL / ISOLATED | Factory PR #2: [review-only inventory primitive](https://github.com/digenova77-ui/dualiscapax-factory-queue/pull/2), head `a3da61c769c35e496aa8027ffb7d8845601058cb`; CI run [39009656325](https://github.com/digenova77-ui/dualiscapax-factory-queue/actions/runs/39009656325) passed. Adds deterministic path/size/SHA-256 manifest, workspace containment, secret/hidden-path exclusions, symlink protections, hard limits, fail-closed enumeration, and independent manifest verification tests. Not wired into `claim.py`; `IMPLEMENTED_OPERATIONS` remains empty. Needs independent code review and an end-to-end acceptance run before inventory may be enabled. |\n| Durable lifecycle primitive | PARTIAL / ISOLATED | Factory PR #3: [durable job lifecycle and lease recovery](https://github.com/digenova77-ui/dualiscapax-factory-queue/pull/3), branch head `8561fe41ce812f26ea2ef54ed6d5c1a040e7f3b4`. CI [run 39009899991](https://github.com/digenova77-ui/dualiscapax-factory-queue/actions/runs/39009899991) passed 38 tests, including a real subprocess kill after claim, lease-expiry reclaim, and fencing-token increment. Also tests atomic record replacement, single-winner concurrent claim, stale-worker rejection, verifier-hash mismatch, corrupt-state refusal, and terminal blocking. This remains a single-host POSIX reference primitive; it is not integrated into the worker and does not prove distributed consensus, hard power-loss behavior, or production recovery. |\n| Landing preview / Worker build | PARTIAL / BLOCKED | Landing PR #104 head `7d00225a938810c47b3d84437d4503fd97bd5169`: Cloudflare Pages preview bot reported success; Cloudflare Workers bot reported failed build for `dualiscapax-depth` and failed preview build. Read-only config inspection found root `wrangler.toml` declares `name = "dualiscapax-web"` and `pages_build_output_dir = "."`, with no `main` entry point; comments describe a static Pages brochure. This strongly suggests the Worker build is using a Pages-oriented config or wrong project/root directory, but the authenticated build log is unavailable, so this remains a hypothesis—not a verified root cause. Keep the Pages rail unchanged; diagnose the Worker project/root/build command separately. No production deploy or DNS change performed. |
| Workflow inventory | PARTIAL | Landing PR #103 describes a read-only scan of 53 workflows with four review flags; draft status and current head must be rechecked before relying on it. |
| Iris browser boundary | PARTIAL | HUD PR #1 describes mock-based browser tests; live API, vision, and CORS remain unverified. |
| PlanckOS compile/runtime | REPORTED | Historical notes report a successful Rust check and telemetry service; not a current live verification. |
| Bootable PlanckOS image | NOT TESTED | No reproducible boot-image evidence recorded here. |
| End-to-end self-building loop | NOT TESTED | No evidence yet of inspect → patch → isolated build → test → promote → rollback. |
| Crash/disk-corruption recovery | NOT TESTED | Fault-injection and clean restore evidence required. |
| Long-duration autonomy | NOT TESTED | No defined soak-test report recorded here. |
| Quantum-inspired performance advantage | NOT TESTED | Requires a specified workload and fair classical baseline. |
| Production deployment | NOT AUTHORIZED | This document grants no deployment, DNS, credential, server, database, firewall, or authentication permission. |

## Related source-of-truth documents

- [Diamond-Floor Execution Plan](DIAMOND_FLOOR_EXECUTION_PLAN.md)
- [Master Engineering Checklist](MASTER_ENGINEERING_CHECKLIST.md)
- [Automation Excellence Checklist](AUTOMATION_EXCELLENCE_CHECKLIST.md)

## Reference

NIST SP 800-160 Vol. 2 Rev. 1, *Developing Cyber-Resilient Systems: A Systems Security Engineering Approach*: https://csrc.nist.gov/pubs/sp/800/160/v2/r1/final

This reference supports the resilience engineering approach; it is not a certification of OmniState or DCLM.
