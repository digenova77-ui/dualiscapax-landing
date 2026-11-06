# Trinity Information Integrity and Multi-Perspective Runtime Model

**Status:** Proposed architecture specification. Not yet implemented as a runtime capability; no production deployment or authority changes are implied by this document.

## 1. Purpose

Define a reusable information-flow layer for DualisCapax that helps an application understand a situation from multiple perspectives, preserve progressive memory, trace how evidence influences decisions, detect integrity failures, and learn from measured outcomes.

This layer is domain-independent in structure. Domain-specific rule packs define what counts as evidence, valid state, acceptable uncertainty, and a successful outcome in each application.

## 2. Governing invariant

> No consequential conclusion should be treated as established solely because one observer, model, data source, or institution asserts it. Preserve perspectives and provenance; reconcile claims against evidence; record uncertainty; and require Trinity authorization before consequential action.

The system must distinguish:
- observation from interpretation;
- source fact from derived claim;
- correlation from causation;
- hypothesis from validated result;
- historical belief from current belief;
- recommendation from authorized action;
- simulation result from real-world outcome.

## 3. Architecture

### 3.1 Perspective registry

Represent each materially relevant observer or source with:
- stable source/entity reference;
- viewpoint and access limitations;
- timestamp and context;
- observation or claim;
- evidence references;
- confidence and uncertainty basis;
- known interests or potential conflicts, when relevant and lawfully collected.

Do not infer that two reports are independent merely because they have different names. Record shared sources and dependencies where known.

### 3.2 Evidence and provenance ledger

Every material claim should point to its source evidence and transformation history. Records are append-only at the logical level: corrections create new versions and explicit supersession links rather than silently erasing prior decisions.

Minimum record fields:
- record_id, subject_id, claim_type;
- source_refs, observed_at, recorded_at;
- method_version, rule_pack_version;
- status (observed, inferred, disputed, validated, superseded, unknown);
- uncertainty, limitations;
- supersedes, related_records.

Sensitive source data should remain access-controlled; public ledgers should expose only the minimum information needed to verify integrity.

### 3.3 Information-flow graph

Model the task as a directed graph:
- nodes: entities, observations, claims, constraints, decisions, actions, resources, and outcomes;
- edges: supports, contradicts, derives-from, depends-on, authorizes, executes, measures, and supersedes;
- every derived conclusion links to its input nodes and transformation version.

The graph must distinguish observed causal links from proposed causal hypotheses. A graph connection alone is not proof of causation.

### 3.4 Multi-perspective reconciliation

For each consequential question:
1. define the target and decision question;
2. enumerate relevant perspectives and missing viewpoints;
3. normalize terms and units without erasing source meaning;
4. identify agreement, contradiction, dependency, and missing evidence;
5. test alternative explanations and counterexamples;
6. record the best-supported conclusion plus unresolved uncertainty;
7. state what evidence would change the conclusion.

Do not require unanimity. Do not allow a majority vote to override evidence or authorization. If evidence cannot resolve a conflict, preserve it as unresolved.

### 3.5 Progressive memory

Memory should separate:
- episodic records of events and actions;
- source-backed facts;
- derived knowledge and hypotheses;
- decisions and their rationale;
- outcomes and lessons;
- identity, permissions, and active commitments.

New evidence may revise the current belief state, but must not silently rewrite historical records. Retrieval should be objective-driven and graph-aware: fetch relevant evidence and dependencies rather than indiscriminately loading all stored content. Apply retention, privacy, access, and deletion rules appropriate to the domain.

### 3.6 Anti-Trinity failure signals

Treat “anti-Trinity” as a name for detectable failure patterns, not as an assumed external agent or cause.

| Failure signal | Detection condition | Default response |
|---|---|---|
| Evidence detachment | Material claim lacks valid source or derivation | Mark unsupported; block consequential reliance |
| Authority detachment | Proposed action exceeds principal, scope, or permission | Deny through Trinity; record attempt |
| Memory/provenance break | History, source, version, or supersession chain cannot be verified | Quarantine affected record and request recovery/review |
| Feedback failure | Repeated adverse outcome does not update evaluation | Flag model/process for review |
| Perspective collapse | Material contradiction or missing stakeholder is suppressed | Reopen reconciliation or mark incomplete |
| Metric gaming | Success metric improves while independent outcome evidence worsens | Freeze metric-based promotion and investigate |
| Uncertainty laundering | Unsupported inference is presented as established fact | Downgrade status and preserve the inference chain |

These are proposed controls. Detection thresholds must be specified and tested for each domain.

## 4. Decision and learning loop

1. Observe: collect permitted, attributable evidence.
2. Map: update the information-flow graph.
3. Reconcile: compare perspectives and identify gaps.
4. Hypothesize: generate candidate explanations and interventions.
5. Evaluate: compare candidates against constraints, baselines, costs, uncertainty, and failure cases.
6. Authorize: request a Trinity decision using the exact principal, action, scope, request identifier, and evidence/input digest required by the active contract.
7. Execute: perform only the authorized action, with idempotency and resource limits where applicable.
8. Measure: collect outcome evidence independently of the prediction where practical.
9. Learn: append the result, compare prediction with outcome, update current beliefs, and preserve prior states.
10. Recover: if integrity checks fail, stop the affected consequential path, preserve evidence, and use an authorized recovery process.

Learning and recommendation may proceed continuously within permitted limits. Learning must not grant new authority, rewrite governing rules, or automatically promote a model into a consequential role.

## 5. Authorization boundary

Trinity remains the sole authorization gate. This document defines no alternate gate and does not authorize autonomous external action.

The information-integrity layer may:
- inspect permitted data;
- create and link records;
- identify contradictions and missing evidence;
- propose hypotheses or changes;
- run sandboxed evaluations;
- produce reviewable reports.

It may not independently:
- grant itself or another agent new permissions;
- alter identity or revocation state;
- bypass required human/legal approval;
- transfer funds, change treatment, deploy code, or control physical systems without the relevant authorization;
- suppress audit history;
- resist legitimate shutdown or consent withdrawal.

## 6. Minimal data contract

A decision record should include:
- request and principal identifiers;
- declared objective and scope;
- applicable rule-pack version;
- evidence references and input digest;
- perspectives considered and material perspectives unavailable;
- competing hypotheses and contradictions;
- decision status and rationale;
- uncertainty and known limitations;
- Trinity authorization reference, if action is approved;
- execution reference and outcome evidence, if executed;
- review, appeal, correction, and supersession links.

Use a canonical serialization and stable hashing procedure before relying on digests for integrity. A hash proves byte-level correspondence to a known digest; it does not prove that the underlying claim is true.

## 7. Verification plan

Implement as a read-only or sandboxed prototype first. No production data, medical intervention, fund transfer, or physical control is required for initial testing.

Required tests:
1. Conflicting observer reports are both preserved.
2. The reconciler distinguishes an unresolved conflict from a proven false claim.
3. Every derived claim can be traced to inputs and transformation versions.
4. A correction creates a new version and does not erase history.
5. Missing or tampered provenance fails closed for consequential use.
6. A proposed action outside scope is rejected by Trinity.
7. A failed or adverse outcome is recorded and affects future evaluation.
8. Shared upstream sources are not counted as independent corroboration.
9. A model's confidence cannot replace missing evidence.
10. Restart/recovery reproduces the authorized state and detects mismatched rule versions.
11. Retrieval selects relevant records without asserting that unreturned records do not exist.
12. Retention, access control, and privacy rules are enforced in tests.

## 8. Evaluation metrics

Track:
- source traceability rate;
- contradiction detection and resolution rate;
- unsupported-claim rate;
- calibration of confidence against observed outcomes;
- false-positive and false-negative rates;
- time and cost to reach a reproducible decision;
- correction and appeal rate;
- outcome improvement against a documented baseline;
- number of actions correctly blocked for missing authority;
- memory retrieval relevance and stale-context rate.

Do not optimize for agreement, confidence, number of memories, or speed alone. Optimize for reproducible outcomes subject to safety, privacy, fairness, and authorization constraints.

## 9. Implementation sequence

**Phase A — Contract and fixtures:** define schemas, status transitions, canonical test fixtures, and deterministic examples.

**Phase B — Read-only graph prototype:** ingest synthetic records, build provenance edges, display perspectives and contradictions, and emit an auditable reconciliation report.

**Phase C — Failure-mode tests:** add adversarial fixtures for missing provenance, source collusion, stale memory, metric gaming, and scope violations.

**Phase D — Runtime adapter:** only after tests pass, connect to the existing identity/session/Trinity flow through an explicit interface. Preserve existing authorization semantics; do not invent a parallel permission model.

**Phase E — Domain pilot:** choose one low-risk use case with permitted data and independent evaluation. Medical, financial, aerospace, and physical-control deployments require domain-specific validation and approval.

## 10. Acceptance criteria

The prototype is ready for review only when:
- all required tests pass;
- git diff --check and the repository's relevant checks pass;
- no production configuration or secrets were changed;
- every capability is labeled as proposed, implemented, or verified accurately;
- the report clearly states known limitations and remaining gaps.

Passing synthetic tests establishes only that the tested behaviors work in the test harness. It does not prove consciousness, universal truth, clinical efficacy, legal correctness, or production readiness.
