# DualisCapax Diamond Standard v1.0

**Standard ID:** `DUALISCAPAX-DIAMOND-1.0`  
**Policy baseline:** `trinity-diamond-v1`  
**Status:** Normative specification; current repository implementation is partially conformant, not certified.  
**Governing rule:** Trinity is the framework. No scaffolding. No valid authority, no write.

## 1. Purpose and claim discipline

The Diamond Standard is a falsifiable acceptance contract for autonomous software. It does not claim invulnerability, autonomous authority, physical graphene performance, biological grafting, or production isolation merely because tests pass. A conformance claim must name the exact source revision, policy version, test artifacts, reviewer, environment, and limitations.

## 2. Mandatory requirements

A requirement is **PASS** only when its stated evidence exists, is tied to the tested revision and policy, and is reviewed by an authorized independent reviewer. **FAIL**, **UNKNOWN**, missing evidence, malformed evidence, policy drift, or missing authorization blocks conformance. A percentage score is coverage only; it never overrides a blocker.

| ID | Requirement | Minimum proof required | Current boundary |
|---|---|---|---|
| D-01 | Authority fails closed | Tests show missing, malformed, stale, or scope-mismatched authority cannot trigger writes or adapter side effects | Contract and unit tests exist; production gate integration requires review |
| D-02 | Evidence integrity | Canonicalization, bounded input, redaction, invalid values and collision cases are tested | Software tests do not prove the truth of supplied observations |
| D-03 | Policy binding | Authorization is bound to task, scope, policy version and complete policy digest; mutation invalidates the decision | Digest is integrity binding, not a signature or external trust anchor |
| D-04 | Execution containment | Actual OS-enforced sandbox prevents escape, privilege escalation, host credential access and unapproved egress | Launch-plan validation alone does NOT satisfy this requirement |
| D-05 | Idempotency and recovery | Concurrency, duplicate delivery, lease expiry/reclaim, stale worker fencing, cancellation and crash recovery are stress-tested | Queue tests alone do not prove external side effects are exactly-once |
| D-06 | Audit tamper evidence | Event sequence and hash chain are verified; signed/external checkpoint resists whole-ledger rewrite | A local hash chain alone does NOT authenticate its creator or prevent total rewrite |
| D-07 | Independent verification | Real approved signature implementation, managed trust roots, key rotation/revocation and independent reviewer | Injected test verifier is not production cryptographic verification |
| D-08 | Scientific validity | Calibrated instruments, controls, preregistered protocol, reproducible raw data, uncertainty and independent replication | Software topology and protocol checks are not physical-material evidence |

## 3. Decision rule

Conformance is granted only when all eight mandatory requirements have PASS evidence, evidence and reviewer references are present, owner authorization is explicit, and the exact required policy version matches. No averaging, score, override flag, retry, or agent assertion can turn a blocker into a pass.

The machine-readable evaluator is `autonomy/diamond_standard.py`; adversarial unit tests are in `tests/test_diamond_standard.py`. It validates the supplied evidence structure and fails closed. It does not fetch or authenticate evidence references, execute the test suite itself, or grant production authority.

## 4. Proof procedure

1. Pin the exact commit SHA and policy version.
2. Run the dedicated unit tests and the complete regression suite in CI.
3. Attach immutable workflow/artifact references and record the environment.
4. Have a reviewer independent of the implementation verify each requirement against the artifacts.
5. Mark each requirement PASS/FAIL/UNKNOWN; do not infer PASS from absent data.
6. For production claims, run independent threat-model review, sandbox escape tests, concurrency/fault-injection tests, and key-management verification.
7. Publish the conformance report and residual risks. Re-run when source, policy, dependencies, trust roots, or runtime changes.

## 5. Explicit non-claims

This standard does not certify the repository, deployment, server, identity system, physical materials, or scientific hypotheses by publication alone. The present code implements useful fail-closed contracts and testable behavior; requirements D-04, D-06 and D-07 require additional production-grade controls and independent proof before full certification.

## 6. Change control

Changes to this standard require owner-authorized review, a version increment, mapped tests, and a written rationale. Any requirement weakening, missing test, unreviewed policy drift, or loss of evidence is a conformance blocker.
