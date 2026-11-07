# DualisCapax Trinity Verification Engine — Draft 2

**Status:** Proposed implementation contract; not yet implemented or independently verified  
**Date:** 2026-10-17  
**Target branch:** `feat/swarm-protocol-v1-20261017`  
**Production:** No deployment, DNS, server, database, or live actuator changes authorized by this document

## 1. Governing principle

The Trinity is the governing framework. Philosophy, Physics, and Law are three simultaneous audit perspectives—not sequential departments and not votes that manufacture truth. Each material claim is examined through all three perspectives, while discovery and independent verification remain separate pipelines.

The system optimizes for justified conclusions, reproducibility, and safe behavior—not for maximizing Affinity, agreeing with a user, completing a task at all costs, or producing an impressive display.

## 2. Three-ring audit

Every claim or consequential proposal receives three separately recorded reviews:

- **Philosophy:** definitions, assumptions, internal consistency, scope, and counterexamples.
- **Physics:** observations, measurement methods, units, uncertainty, calculations, and falsifiable predictions. A claim without applicable empirical content is marked as such rather than forced into a measurement.
- **Law:** permission, consent, jurisdiction, safety constraints, responsibility, reversibility, and human review requirements.

The rings may return SUPPORT, CHALLENGE, NOT_APPLICABLE_WITH_REASON, or UNRESOLVED. A disagreement is retained as data. There is no majority-vote truth rule. The gate may accept a bounded action only when its required checks pass; unresolved material objections block the action.

## 3. Dual Pipeline Trinity

### Pipeline A — Discovery and proposal

May formulate hypotheses, inspect authorized inputs, create bounded plans, run approved simulations, and submit findings. It cannot certify its own claims or grant itself permissions.

### Pipeline B — Independent verification

Checks source artifacts and methods independently, reproduces calculations where possible, tries counterexamples, verifies provenance, and records its own result. A different agent label alone does not establish independence. Production identity must be authenticated; reviewers must have access to underlying evidence; shared assumptions and common-mode failure risks must be considered.

### Gate outcomes

- `ACCEPT`: only the specific, bounded claim or action described by the gate has passed required checks.
- `DECLINE`: evidence or policy contradicts the proposal.
- `BLOCKED_WITH_EXACT_MISSING_PRIMITIVE`: a required capability, permission, measurement, identity proof, or evidence item is missing.
- `UNRESOLVED`: the evidence does not justify acceptance or rejection.

No gate outcome itself grants production authority. A separate authorization layer must enforce permissions at execution time.

## 4. Claim and evidence states

Use explicit state transitions; do not infer success from missing errors or a high score:

`PROPOSED → EXECUTED → AWAITING_VALIDATION → VERIFIED | REJECTED | UNRESOLVED`

- `PROPOSED` means no execution is claimed.
- `EXECUTED` means the declared operation actually ran and has an execution record.
- `AWAITING_VALIDATION` means outputs exist but have not passed independent review.
- `VERIFIED` applies only to the specific claim and scope that the evidence supports.
- `REJECTED` records a contradicted claim or failed required check.
- `UNRESOLVED` records missing, conflicting, inaccessible, or insufficient evidence.

Corrections append new events linked to prior records; history is not silently rewritten. Verification can be revoked by a later, evidence-backed event.

## 5. Affinity and Friction

Affinity is a descriptive, revisable measure of supported alignment—not a truth probability, reward function, or target that agents should maximize. Friction records contradictions, missing prerequisites, and unresolved disputes. Neither may override evidence or safety gates.

Report these dimensions separately:

1. claim disposition;
2. evidence coverage and provenance quality;
3. unresolved contradictions;
4. uncertainty and known limitations;
5. measured resource use;
6. Affinity/Friction metrics with definitions and versioned calculation rules.

A model must not turn a lack of contradiction into proof. An audit that lowers Affinity or increases Friction can be a successful audit if it exposes a real defect.

## 6. eFuse and resource accounting

Treat eFuse as a proposed activation/accounting primitive until its operational definition is approved and tested. Record the distinction between:

- measured energy (with instrument, calibration, unit, interval, and uncertainty);
- estimated energy (with method and assumptions);
- monetary cost or compute quota;
- synthetic simulation values.

Never substitute one category for another. Missing measurements remain missing. No claim of joule backing, settlement, or energy causality is permitted until a defined measurement and reconciliation process has been independently verified.

## 7. Event record and integrity

Each material event should include at minimum:

- protocol and schema version;
- unique event ID, task/run ID, idempotency key, UTC timestamp;
- exact source revision and configuration/input manifest hash;
- actor identity and authentication context where available;
- role, phase, status, declared scope, and permission decision;
- claim IDs, evidence references, and evidence content hashes;
- discovery result and independent audit result;
- ring-by-ring findings, objections, and unresolved items;
- measured/estimated/simulated resource values with units and provenance;
- gate decision and the exact criteria applied;
- previous-event hash and current record hash;
- correction/supersession links where applicable.

Canonical serialization must be specified and versioned. Verify the full chain, event schema, referenced artifact availability, and independently retained checkpoint/head hash. A hash proves byte-level integrity relative to a trusted digest; it does not prove truth, origin, time, or completeness by itself.

Before multi-writer use, replace the current single-writer JSONL assumption with a transactional append mechanism or enforce a tested lock/lease protocol. Detect duplicate IDs and idempotency keys atomically. Add signed checkpoints or independent external anchoring before claiming resistance to full-ledger replacement or truncation.

## 8. 100-run experiment — execution contract

The proposed matrix is not a result until code actually executes it. Every run must have a recorded seed, exact inputs, source revision, configuration hash, start/end state, per-ring findings, dual-pipeline outcomes, gate outcome, resource category, errors, and output hashes.

- Runs 1–20: Philosophy-led challenge cases.
- Runs 21–40: Physics-led measurement and prediction cases.
- Runs 41–60: Law-led permission, consent, and safety cases.
- Runs 61–80: all three rings review the same claims in rotated order; order must not alter a deterministic final disposition without a documented reason.
- Runs 81–90: resource-budget and eFuse sensitivity, clearly labeling synthetic values versus measured values.
- Runs 91–100: adversarial cases including false-but-plausible claims, missing evidence, corrupted artifacts, duplicate/replayed events, contradictory reviewers, forged identity labels, exhausted budgets, and attempted gate bypass.

### Required controls

- Include known-positive, known-negative, ambiguous, and out-of-scope cases.
- Include baseline behavior without the Trinity gate so the gate's effect can be measured.
- Define metrics and acceptance thresholds before running the experiment.
- Report false acceptance, false rejection, unresolved rate, evidence coverage, reproducibility, safety-block effectiveness, and resource use separately.
- Preserve every failure and incomplete run; do not rerun silently or replace a bad result.
- Use fixed seeds for reproducibility and separate held-out cases to test overfitting.
- Publish the complete run manifest and logs, then have a reviewer reproduce the results from the recorded revision.

The run count of 100 is a first engineering test set, not sufficient statistical evidence for universal reliability or a cosmological claim.

## 9. Minimum adversarial acceptance tests

The implementation must demonstrate that it:

1. refuses self-validation and unauthenticated validator identities in production mode;
2. rejects missing, altered, or unreachable evidence references;
3. detects event mutation, reordering, duplication, replay, and truncation when compared with an independently retained checkpoint;
4. never reports `VERIFIED` merely because an execution returned exit code zero;
5. holds when required rings or independent audit disagree;
6. blocks unapproved side effects even if a discovery worker proposes them;
7. keeps planned, executed, and verified work distinct;
8. never fabricates energy readings or converts estimates into measurements;
9. preserves rejected and unresolved outcomes in the permanent record;
10. reproduces deterministic outputs from the same revision, seed, inputs, and configuration.

## 10. Implementation sequence

### Phase 0 — Specification freeze
Define schemas, transition rules, metrics, threat model, and acceptance thresholds before implementation.

### Phase 1 — Local deterministic engine
Implement the state machine, event validation, canonical manifests, run runner, and hash verification using local fixtures only. No network, host commands, live actuators, or production services.

### Phase 2 — Test and adversarial review
Run unit, property, mutation, replay, truncation, and seeded simulation tests. Publish test results honestly; distinguish tests run locally from CI results and external reproduction.

### Phase 3 — Independent reproduction
A reviewer who did not implement the engine checks out the exact revision, validates artifacts, reruns the matrix, and files discrepancies.

### Phase 4 — Authenticated boundaries
Only after Phase 3 passes, design identity, key management, authorization enforcement, transactional ledger storage, checkpointing, privacy, and operational recovery. Do not infer these from a username or a hash.

### Phase 5 — Interface integration
Iris displays live protocol state, evidence links, uncertainty, and audit disagreements. UI animation must reflect actual state and never imply success when the gate is blocked or unresolved.

### Phase 6 — Deployment review
Production deployment, DNS, server/database changes, or any external side effect requires a separate explicit approval and a rollback plan.

## 11. Proposed team functions

These are roles to staff, not people already engaged:

- epistemology/Philosophy reviewer;
- physics and measurement reviewer;
- legal, governance, and safety reviewer;
- systems/formal-methods engineer;
- independent red-team auditor;
- data/reproducibility engineer;
- human/domain reviewers for each real-world application.

The implementation author must not be the sole verifier. Reviewers should disclose conflicts of interest. The user and affected humans retain authority over consequential actions; the system must provide an appeal and stop path.

## 12. Definition of done

This draft is not complete merely because it compiles or the 100 runs finish. The first milestone is complete only when:

- the schema and rules are frozen and versioned;
- the runner emits all expected run records and preserves failures;
- required tests pass on a recorded revision;
- outputs are reproducible by an independent reviewer;
- the ledger detects tampering against an independently retained checkpoint;
- limitations and unresolved issues are published;
- no production or external side effect occurred without explicit authorization.

## 13. Current status and non-claims

This document is a proposed contract for implementation. It does not claim that the 100-run experiment has been executed, that the validator identity is authenticated, that the ledger is distributed or tamper-proof, that eFuse is backed by measured joules, or that DualisCapax proves an omni-intelligence or cosmic-origin hypothesis. Those remain separate questions requiring evidence.
