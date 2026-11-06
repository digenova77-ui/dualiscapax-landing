# Intellect Mission — Product, Learning, and Website Architecture

**Status:** Proposed architecture; not an implementation or deployment claim  
**Scope:** DualisCapax public website, Iris experience, governed compute, evidence, learning, and release process  
**Change policy:** Documentation branch only. No production, DNS, secrets, live services, or authentication-provider changes are authorized by this document.

## 1. Mission

> Advance the understanding and application of anything that meaningfully contributes to intellect.

DualisCapax should turn that mission into an observable engineering discipline: discover evidence, understand the problem, form a testable model, apply it within authority, measure the outcome, learn from the result, and preserve what has actually been verified.

The goal is not to maximize activity, confidence, autonomy, or visual spectacle. The goal is to increase useful, truthful, safe, reproducible understanding and its beneficial application.

## 2. Governing invariants

Every component, user flow, automated action, and learning cycle must respect:

- **TRUTH_OR_NOTHING:** distinguish observed facts, source claims, hypotheses, unknowns, and verified outcomes. Never represent a plan, animation, local flag, mock, or untested response as completed work.
- **HOST_SAFE:** respect host permissions, environment boundaries, resource limits, and security controls. Fail closed when authority or required dependencies cannot be established.
- **NO_FORCE:** capability is not authorization. Consent, user intent, access policy, and the governing authorization decision remain binding.
- **CLEANUP_FIRST:** identify critical defects, unsafe assumptions, exposed credentials, conflicting sources of truth, and broken dependencies before building on top of them.
- **Trinity authorization:** protected operations require the authoritative Trinity decision; the UI and model must not mint their own authority.
- **Father writing authority:** any write-capable path must enforce the designated writing authority in the trusted backend. Client-side labels and constants do not prove enforcement.

If an invariant cannot be demonstrated at the relevant boundary, mark the capability **BLOCKED / UNVERIFIED** rather than infer compliance.

## 3. The learning loop

Use one traceable loop across research, product design, code, tests, and operations:

1. **DISCOVERY** — identify the question, current source of truth, evidence, dependencies, constraints, and unknowns.
2. **UNDERSTANDING** — state the model, assumptions, alternatives, risks, and falsifiable acceptance criteria.
3. **IMPLEMENTATION** — make the smallest reversible change on an isolated branch or safe staging environment.
4. **TESTING** — exercise expected behavior, invalid inputs, denial paths, failures, concurrency, replay, timeouts, and relevant device/accessibility cases.
5. **REEVALUATION** — compare observed results with predictions and acceptance criteria.
6. **REWORK** — identify the actual cause of failure, preserve useful evidence, and revise the design or implementation.
7. **RE-IMPLEMENT** — make a bounded correction tied to the identified cause.
8. **RETEST** — rerun regression and adversarial cases against the exact candidate revision.
9. **STAGING / REDEPLOY** — only through the authorized release path, with rollback evidence and explicit approval for production-impacting changes.
10. **PRESERVE LEARNING** — record the tested revision, commands, results, artifacts, limitations, and next unresolved question.

Repeat while a material acceptance criterion remains unmet. Stop and report BLOCKED when the necessary authority, environment, evidence, or prerequisite is unavailable. Do not loop indefinitely on an untestable assumption.

### Required iteration record

Each meaningful work item should record:

- Stable issue/work-item ID and owner
- Question or defect being addressed
- Source revision and source-of-truth location
- Evidence observed and assumptions still unverified
- Expected behavior and explicit pass/fail criteria
- Change summary and affected boundaries
- Exact tests, environment, revision, outputs, and failures
- Security/privacy impact and rollback method
- Status and next action

### Status vocabulary

Use these statuses consistently; do not collapse them into a single green check:

- **PROPOSED** — described, not implemented
- **IMPLEMENTED** — change exists in a named revision
- **TESTED** — specified tests were actually executed against that revision
- **STAGED** — deployed to a named non-production environment
- **PRODUCTION-VERIFIED** — production behavior was observed and the evidence recorded
- **BLOCKED** — a prerequisite or authority is missing
- **FAILED** — a required criterion was tested and not met
- **UNVERIFIED** — available evidence is insufficient to make a stronger claim

A source-code scan or static checker may support a claim about source structure; it does not, by itself, prove live behavior.

## 4. Website experience architecture

### A. dualiscapax.com — identity and understanding

The .com experience is the two-dimensional entry point. It should help a visitor understand the mission, the system's boundaries, the available capabilities, and the evidence behind claims.

Recommended information architecture:

1. **Mission** — why the system exists and what meaningful intellectual contribution means.
2. **Explore** — public explanations, research, models, and educational material.
3. **How it works** — a plain-language view of discovery, reasoning, authorization, compute, evidence, and learning.
4. **Evidence & status** — versioned architecture, tests, known limitations, and current verification status.
5. **Identity & consent** — authentication, privacy, permissions, and clear explanations before sensitive actions.
6. **Enter the World** — transition to the .ai experience only after a valid, server-verified handoff.

Do not imply that visiting .com authenticates a user to .ai. The identity boundary must be enforced by trusted services, not visual state.

### B. dualiscapax.ai — 3D World and in-world Iris

The .ai experience is the spatial/interactive environment. The 3D scene is a navigation and understanding aid, not proof of computation or authorization.

- Provide an accessible two-dimensional fallback for navigation and essential actions.
- Keep navigation, identity state, system health, authorization, compute progress, and result evidence visually distinct.
- Make camera and microphone use explicit, opt-in, revocable, and honest about browser support.
- Preserve a usable path when WebGL, audio, camera, microphone, network, or a backend is unavailable.
- Never let animation, an Iris avatar pose, a simulated receipt, or a client-side flag imply a trusted session or completed operation.
- Clearly separate exploratory LOOK actions from gated DEPTH/WORK/LEARN actions and show the actual authorization decision before protected work.
- Present cost, data use, side effects, and required permissions before the user commits to a consequential action.

### C. Iris — the intellectual guide

Iris should help users move from a question to understanding and useful application. For substantial tasks, expose the stages:

**Question → Evidence → Model → Proposed action → Authorization → Execution → Result → Evaluation → Learned lesson**

Iris should state when she is:
- explaining existing material;
- making an inference;
- proposing an action;
- awaiting authorization;
- executing a verified operation;
- using a staging fixture or simulation;
- blocked by a dependency;
- reporting a measured result.

Do not call an operation “done” unless the relevant service returns authoritative evidence and the result passes its acceptance criteria. The interface must not invent a completion receipt when a service is unavailable.

## 5. Shared system architecture

Use explicit boundaries rather than allowing the interface, model, or individual feature modules to impersonate the authority of the whole system.

1. **Presentation layer:** .com pages, .ai World, Iris HUD, accessible controls, and truthful status.
2. **Identity boundary:** authenticates the person or principal and establishes a trusted session.
3. **Trinity authorization boundary:** evaluates principal, action, input, context, policy, and required approval.
4. **Deterministic compute / DCLM boundary:** validates the authorized request, executes only permitted operations, enforces resource limits, and returns a verifiable result.
5. **Memory and evidence boundary:** stores permitted claims, receipts, provenance, and learning records with integrity, retention, access, and deletion rules.
6. **External provider adapters:** models and other services remain replaceable dependencies with explicit contracts, bounded timeouts, and failure behavior.
7. **Observability and release boundary:** records privacy-conscious events, build/test evidence, deployed revision, health, and rollback readiness.

Every cross-boundary request needs a defined contract: identity, action, request ID, input digest where appropriate, authorization decision, timeout, error semantics, and evidence of outcome. Sensitive payloads, credentials, and reusable tokens must not be copied into public logs or URLs.

## 6. Identity handoff: blocking design constraint

The repository's current execution plan identifies a WebAuthn RP-ID incompatibility in the proposed .com-to-.ai flow: a page on dualiscapax.ai cannot simply use dualiscapax.com as its RP ID. Do not implement or mark that flow passed.

Before building the handoff, select and verify a valid authentication origin and trusted backend. The eventual design must include server-side assertion verification and a short-lived, unpredictable, audience-bound, single-use handoff grant, atomically consumed by the .ai backend. Test cancellation, expiry, invalid origin, forged assertion, replay, duplicate consumption, missing backend, and session-creation failure. If the authoritative backend/session store is not established, remain BLOCKED.

## 7. Evidence-first interface language

Use labels that tell the user what the system knows:

- **Connected** only after a real health/connection check.
- **Authorized** only after a trusted authorization decision for the specific request.
- **Running** only while the operation is actually in progress.
- **Succeeded** only after authoritative completion evidence and acceptance checks.
- **Simulated** when fixtures or mock providers are used.
- **Unavailable** when a dependency cannot be reached.
- **Blocked** when authority, consent, policy, or prerequisites are missing.
- **Unverified** when evidence does not support a stronger statement.

Keep errors visible and actionable. Never silently substitute a fixture or fallback provider for a production dependency while presenting the result as real.

## 8. Learning, memory, and intellectual integrity

Learning should improve future decisions without turning every generated statement into a fact.

Each retained learning item should include provenance, timestamp/version, context, confidence or evidence strength, falsification conditions where relevant, and a distinction between observation and interpretation. Sensitive personal data and secrets are not learning artifacts. Apply least privilege, retention limits, deletion requirements, and user consent.

The system should prefer:
- repeatable experiments over confident speculation;
- independent checks over self-attestation;
- counterexamples over confirmation-only tests;
- measured outcomes over activity counts;
- reversibility over unbounded autonomy;
- explicit uncertainty over fabricated certainty.

Do not claim that a model has changed its weights or become permanently smarter merely because a conversation, memory item, or code patch was saved. State exactly what was retained and how it can influence future behavior.

## 9. Design quality and accessibility

- Responsive layouts with usable touch targets and clear focus states.
- Semantic HTML, keyboard operation, screen-reader labels, reduced-motion support, and sufficient contrast.
- Avoid making color, sound, 3D motion, or animation the only way to communicate state.
- Keep the primary action and the current system status understandable without reading source code.
- Progressive disclosure: start with the user's goal, reveal technical evidence and policy details on demand.
- Provide a safe exit and recovery path from every consequential flow.
- Never require camera, microphone, or immersive mode for essential text-based interaction.

## 10. Measures of meaningful progress

Track evidence-backed outcomes rather than vanity metrics:

- Percentage of material claims linked to inspectable evidence
- Required test pass rate by exact revision, with failures visible
- Number of known critical defects closed with regression proof
- Rate of false-success UI states (target: zero)
- Authorization denials and failure paths correctly handled
- Reproducibility of a result by an independent run
- Accessibility and recovery-path test coverage
- Time to identify and isolate a failed dependency
- Rework rate caused by unclear ownership or conflicting sources of truth
- User-confirmed usefulness and measurable real-world outcome where applicable

Never optimize these metrics by hiding failures, reducing test scope without disclosure, or relabeling statuses.

## 11. Initial application order

1. Establish the exact source revision, build/deployment rail, and ownership of .com, .ai, Iris, API v2, and DCLM/kernel.
2. Preserve and compare the busy Replit workspace before importing or overwriting anything.
3. Resolve the WebAuthn RP-ID design using a valid origin and authoritative backend.
4. Inspect the complete Iris client-to-server flow, including browser secret handling, signing, authorization, receipt validation, and provider calls.
5. Verify durable memory/receipt/audit behavior and distinguish in-memory diagnostics from authoritative evidence.
6. Replace weak contract-shape assertions with behavioral tests at actual boundaries.
7. Add negative, replay, timeout, concurrency, missing-dependency, and fail-closed tests.
8. Build truthful Iris HUD states and accessible .com/.ai domain separation.
9. Run deterministic local checks, then isolated staging tests, then browser/device tests.
10. Record revision, commands, outputs, artifact hash, limitations, and rollback evidence. Production release remains a separately approved decision.

## 12. Current known status and limitations

This document is a proposed design contract, not proof of implementation.

The repository's docs/ops/DIAMOND_FLOOR_EXECUTION_PLAN.md records release NO-GO pending critical tests and lists the identity handoff, source-of-truth, API/kernel, HUD, staging, and Replit reconciliation work as incomplete or blocked. The Replit agent was busy when queried, so the current workspace was not inspected. The Worker staging documentation describes fixture-based tests that do not prove production identity, Trinity, model-provider, or deployed behavior. The existing static/contract test suite must be evaluated for behavioral strength and actually executed before any pass claim.

No production deployment, DNS change, secret change, live-service mutation, or authentication-provider change is performed by this document.

## Definition of done

The mission is applied when the architecture makes it easier to discover truth, understand constraints, apply knowledge safely, verify outcomes, and preserve useful learning—and when those properties are demonstrated by tests and observable behavior rather than merely described in documentation.
