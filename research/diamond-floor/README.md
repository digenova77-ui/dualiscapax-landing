# Diamond Floor Derivative — Implementation Contract

**Version:** 1.0.0  
**Created:** 2026-10-17  
**Status:** Prototype source; not deployed  
**Repository:** `digenova77-ui/dualiscapax-landing`

## Core interpretation

- **Diamond:** immutable governing geometry and validation rules.
- **Floor:** the lowest verified baseline from which every derived state starts.
- **Mesh:** typed, hash-linked artifacts and relationships.
- **Seed:** the minimal source facts and inputs from which a result is derived.
- **Taproot / bedrock:** provenance, original bytes, source attribution, and content hashes.
- **Ceiling:** the current reconciled state, expanded only by verified additions.
- **Derivative:** a recorded difference between a prior accepted state and a candidate state.

The ceiling starts at the floor. It rises only when a candidate artifact passes schema, integrity, provenance, and invariant checks. An unverified candidate remains a candidate; it never silently becomes accepted state.

## Three rings on one floor

- **Authority ring:** identity, permission, and provenance for the actor or source that introduces a candidate.
- **Measurement ring:** instrument, units, calibration/uncertainty where applicable, and source observations. Energy in joules remains a physical measurement; it is not silently equated with Merit or token value.
- **Execution/evidence ring:** deterministic inputs, execution record, output hashes, and reproducible verification.

All three rings must carry explicit evidence references. A label or boolean alone is not proof. This repository's validator checks that evidence references are present and status is asserted; external evidence must still be independently verified before a real acceptance decision.

## Required downward and upward passes

1. **Ceiling → mesh:** enumerate claims, artifacts, and dependencies that the current view depends on.
2. **Mesh → floor:** resolve each item to source bytes, canonical metadata, and explicit invariants.
3. **Floor → seed / taproot:** verify source identity, rights status, SHA-256, and source linkage.
4. **Seed / taproot → floor:** derive the immutable baseline manifest.
5. **Floor → mesh:** build typed relationships from verified inputs only.
6. **Mesh → ceiling:** produce a candidate ceiling plus an explicit derivative against the previous baseline.
7. **Reconcile:** verify the candidate against the same invariants; record PASS/PARTIAL/BLOCKED/FAIL and evidence.
8. **Measure the derivative:** report node, edge, ring, and invariant changes separately; a changed candidate is not a verified improvement merely because it is different.

A failed check blocks promotion. No missing data is filled with a mock success.

## Implemented in this branch

- `diamond_floor.py`: deterministic inventory, content-addressed ingest, provenance ledger, verification, and derivative reports. Any non-empty change set is `PARTIAL` until reviewed; a zero-change comparison is `PASS`, but neither authorizes promotion.
- `derivative_graph.py`: canonical hash-bound node/edge graph with a complete ceiling → mesh → floor → seed → taproot → bedrock trace, three required evidence rings, invariant checks, and node/edge/spectral/cross-layer/ring/invariant delta reporting.
- `graph.template.json`: explicit fail-closed graph template; placeholder evidence is deliberately blocked, not treated as a real validation.
- `test_derivative_graph.py`: exercises complete traces, missing ring evidence, trace gaps, tampering, cross-layer deltas, and no-promotion policy.
- `reconcile.py`: one fail-closed status across inventory integrity, source discovery, public DNS audit evidence, and ledger integrity. A placeholder DNS report is `BLOCKED`, not a false green.
- `test_reconcile.py`: verifies tamper detection, placeholder blocking, and the no-promotion invariant.
- `manifest.schema.json`: manifest contract.
- `test_diamond_floor.py`: standard-library tests.
- `README.md`: file routing, status semantics, and run instructions.

## File-routing policy

- Photo and visual assets: `research/photo-archive/assets/` (original bytes stored by SHA-256; descriptive metadata stays in manifests).
- Research data and machine-readable observations: `research/diamond-floor/data/`.
- Code and tests: `research/diamond-floor/`.
- Source references and rights: `research/diamond-floor/provenance/`.
- Generated reports: `research/diamond-floor/reports/`.
- Operational DNS snapshots: `research/photo-archive/public-dns-audit.json`.
- Production site source and worker remain in their existing paths.

Do not place credentials, personal authentication data, access tokens, or private keys in the archive. Secret-like filenames and common private-key formats are excluded from inventory by default.

## Determinism and integrity

- Canonical JSON uses UTF-8, sorted keys, compact separators, and rejects NaN/Infinity.
- File identity is SHA-256 over original bytes.
- No wall-clock timestamp is included in content identity or derivative digest.
- Wall-clock timestamps are permitted only as audit metadata.
- Append-only ledger records refer to the prior record digest; edits are detected by verification.
- Ingest never deletes or rewrites the original source file.
- Identical bytes resolve to the same object path.
- Provenance/rights metadata is required for explicit archive ingest.
- Rights status is descriptive metadata; the tool does not decide copyright law.
- Symlinks and directories are not ingested as file bytes.

## Acceptance criteria

- Running tests does not access the network or mutate production.
- Repeated inventory over unchanged files yields the same content digest.
- Tampering with stored bytes or ledger entries is detected.
- Missing sources, missing rights metadata, and hash mismatches fail closed.
- No claim of live deployment is made by a local test or GitHub commit.

## Explicit non-goals

This prototype does not change DNS, deploy Cloudflare Pages, modify the Vultr servers/database, infer consciousness, establish new physics, or claim the archive is a complete record of Earth. It creates a reproducible way to store and test evidence.
