# Trinity Unification — Diamond Architecture

**Governing rule:** Trinity is the canonical decision law. Diamond is a conformance profile. Subsystems enforce the same decision; they do not mint authority.

## What was consolidated
- `autonomy/trinity.py` now owns the canonical fail-closed gate semantics: exact policy version, explicit owner authorization, unique required gates, complete PASS evidence, and evidence/reviewer references.
- `autonomy/diamond_standard.py` is a profile adapter mapping Diamond requirements and legacy blocker names to Trinity. It no longer independently decides whether evidence is complete.
- `tests/test_trinity.py` exercises the shared decision primitive against missing, duplicate, malformed, unreviewed, stale-policy, and non-boolean PASS cases.
- `autonomy/durable_queue.py` now increments a persistent lease generation on every claim and requires the exact generation for renew, completion, and cancellation acknowledgement. Existing SQLite databases receive a forward-only schema migration. `autonomy/worker_runner.py` carries the claim generation through every queue mutation.

## What must not be stripped away
The evidence encoder, OS sandbox, durable queue, lease fencing, cryptographic verification, and audit ledger remain separate enforcement mechanisms because they protect different failure modes. They must consume one Trinity policy and never grant themselves authority. Combining their code into one module would make security less inspectable, not more unified.

## Remaining consolidation plan
1. Map Diamond Ceiling dimensions to the eight Diamond Standard requirements before replacing the older evaluator; do not silently treat five dimensions as proof of eight.
2. Introduce one immutable authorization envelope binding task, scopes, policy version/digest, expiry/replay protection, and backend identity.
3. Lease fencing is implemented and covered for same-worker identity reuse, stale completion/renewal rejection, and legacy schema migration. Remaining: validate multi-process contention and operational rollout against a copy of the production database before enabling workers.
4. Retain independent OS-level isolation and external trust anchors; local policy digests and hash chains are not signatures.
5. Remove duplicate constants and abstractions only after repository-wide reference search and full regression CI.

## Proof and status
The refactor is on the engineering branch only. Passing unit tests prove the tested semantics of the shared evaluator, not production isolation or full Diamond certification. The Trinity autonomy regression workflow passes on the current branch head. This verifies the repository's configured test suites only; it does not prove live OS isolation, external side-effect idempotency, multi-process production contention, independent certification, or successful deployment. No merge or deployment is part of this change.
