# Diamond Floor: Long-Horizon Evidence Contract

**Status:** normative engineering requirements; not a claim that the system currently satisfies them.

## Purpose

A claim is admissible only to the extent that an independent reviewer can reconstruct its source, scope, transformations, authority, and limitations. A dashboard, screenshot, green check, successful build, hash, or signature is not by itself proof that the underlying real-world claim is true.

The system must distinguish:
- **Observation:** a source returned bytes or a measurement at a recorded time.
- **Integrity check:** bytes match a declared digest or a chain verifies internally.
- **Authenticity:** a source or signer is linked to a stated identity under a documented trust policy.
- **Validation:** an independent procedure tested a claim against a declared criterion.
- **Inference:** a conclusion derived from observations, with method and uncertainty recorded.
- **Acceptance:** an explicitly authorized human or policy gate approved a specific candidate.
- **Deployment:** a separately authorized change to a named target.

No status may silently substitute for another.

## Required evidence envelope

Every retained observation MUST record:
1. Stable identifier and schema/version.
2. Exact source reference and captured bytes' cryptographic digest.
3. Capture time in UTC, clock source/uncertainty where material, and time semantics (event time versus collection time).
4. Collection method, software/version, parameters, and execution environment where material.
5. Scope, units, location/reference frame where applicable, and known coverage gaps.
6. Raw result separately from derived interpretation.
7. Provenance links to parent evidence and deterministic transformation versions.
8. Verification state and the identity/method of any verifier.
9. Rights, privacy, retention, and handling constraints.
10. Explicit uncertainty, known failure modes, and review status.

Missing required fields produce BLOCKED or NEEDS_REVIEW, never an inferred success.

## Integrity, authenticity, and tamper evidence

- Canonical serialization and digest algorithms MUST be named and versioned.
- A digest proves byte equality relative to the digest; it does not prove who created the bytes, when they existed, or whether their claims are true.
- A hash chain detects certain changes relative to a trusted head; a self-contained chain can be rewritten in its entirety. Chain heads therefore require independent anchoring to be tamper-evident against a privileged rewrite.
- Signatures MUST identify the key and applicable trust policy. Key creation, custody, rotation, revocation, compromise, and algorithm migration must be recorded. A valid signature proves use of a key, not truth of the signed statement.
- For consequential evidence, publish checkpoints to independent trust domains and preserve signed checkpoint receipts. No single repository, account, provider, or operator is the sole trust root.
- Never put secrets, private keys, passphrases, or biometric templates in evidence manifests, public URLs, logs, or public artifacts.

## Long-horizon preservation

No present system can honestly guarantee readability or availability one hundred billion years from now. The engineering goal is layered survivability, detectable loss, and recoverability—not an impossible permanence claim.

- Keep canonical, human-readable source formats and documented schemas; retain parsers, test vectors, and migration tools.
- Maintain geographically and administratively independent replicas, with access controls and periodic restore drills.
- Run scheduled fixity checks against trusted, independently anchored digests; report missing or divergent replicas.
- Re-sign or re-anchor evidence before algorithms, keys, certificates, or trust services become obsolete; preserve historical verification material.
- Migrate media and formats through documented, reproducible transformations; retain old bytes and link every migration to its source and result digests whenever lawful and feasible.
- Record custody transfers, retention decisions, legal/rights constraints, and known gaps.
- Use independent time-stamping or transparency services where available; preserve their receipts and trust assumptions.
- Provide an export that does not depend on a proprietary viewer, active SaaS account, or a single online endpoint.

## Truthful state machine

Allowed high-level statuses are OBSERVATION, NEEDS_REVIEW, PASS, PARTIAL, BLOCKED, and FAIL. Their meanings must be defined per schema.

- PASS means only that the named, bounded test passed against the named input at the named time.
- PARTIAL means useful evidence exists but declared coverage or acceptance criteria remain unmet.
- BLOCKED means required evidence, authority, or verification is absent.
- FAIL means a required integrity or validation condition was contradicted.
- A network response is not proof of a service's internal correctness.
- A source URL is not rights clearance.
- A hash is not independent verification.
- A model output is not a measurement.
- A preview is not production.
- A build passing tests is not deployment approval.
- No candidate is promoted automatically.

Every status report MUST include its time, scope, input digests, tool/version, and limitations. Historical snapshots must never be described as live checks.

## Independent acceptance gate

A candidate is eligible for acceptance only when:
1. All required source references resolve to retained evidence or explicitly documented unavailable sources.
2. Input, transformation, and output digests verify.
3. The three rings—authority, measurement, execution evidence—have separately attributable evidence; one ring cannot stand in for another.
4. The six-layer trace—ceiling, mesh, floor, seed, taproot, bedrock—has explicit parent/child lineage and declared gaps.
5. Required invariants (TRUTH_OR_NOTHING, NO_FORCE, HOST_SAFE, CLEANUP_FIRST / equivalent versioned gates) have concrete tests and evidence, not labels alone.
6. An independent verifier reruns the checks from a clean environment and records its own result.
7. An authorized acceptance decision identifies the exact candidate digest.
8. Deployment, if ever requested, has a separate approval and rollback plan.

Until these conditions are met, the correct result is BLOCKED or PARTIAL.

## Non-goals and prohibitions

This contract does not assert that Earth stores all information, that environmental signals encode recoverable consciousness, or that any current dataset proves such a hypothesis. Those are research questions requiring defined hypotheses, instruments, controls, independent replication, and uncertainty analysis.

The evidence system MUST NOT fabricate measurements, identity, authority, scientific conclusions, successful checks, or durable storage guarantees. It MUST NOT contact production or mutate DNS, servers, databases, or deployment targets as a side effect of evidence collection or reconciliation.
