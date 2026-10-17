# Diamond-Floor Automation Excellence Checklist

**Updated:** 2026-10-17  
**Status:** Active engineering control document; checked boxes require evidence.  
**Scope:** DualisCapax playground, Iris HUD, API v2/kernel boundary, identity handoff, GitHub CI, Cloudflare release rail, and recovery operations.  
**Non-goals:** No automatic production deployment, DNS mutation, Cloudflare credential rotation, live-server changes, database changes, or auth-provider changes without explicit approval.

## Operating law

- [ ] Every automated operation has one named owner/authority.
- [ ] Every operation has one unambiguous trigger.
- [ ] Every operation declares its permitted inputs and side effects.
- [ ] Every operation has a deterministic success condition.
- [ ] Every operation has a bounded timeout and retry policy.
- [ ] Every operation is idempotent or has duplicate-job protection.
- [ ] Every failure ends in a known, visible state.
- [ ] Every potentially destructive operation has a dry-run/preview path.
- [ ] Every write has an auditable record that excludes secrets and sensitive payloads.
- [ ] Every external dependency has a timeout, health check, and failure message.
- [ ] No UI status may claim success without evidence from the operation.
- [ ] Proposed, implemented, tested, staged, and production-verified are separate statuses.
- [ ] Automation never bypasses user approval for production-impacting changes.
- [ ] Unknown authority, ambiguous intent, or missing prerequisites results in BLOCKED with the exact missing primitive.
- [ ] Truthful failure is preferable to fabricated success, fallback behavior, or silent data loss.

## A. Repository and source-of-truth control

### A1. Repository inventory
- [ ] Inventory every repository relevant to the product.
- [ ] Record each repository's purpose, owner, default branch, visibility, and deployment relationship.
- [ ] Record canonical repository URLs in a machine-readable manifest.
- [ ] Record the authoritative source for the landing site.
- [ ] Record the authoritative source for the isolated HUD.
- [ ] Record the authoritative source for API v2 and kernel code.
- [ ] Record which components exist only in Replit.
- [ ] Record which Replit changes are committed, uncommitted, or unknown.
- [ ] Record the current commit SHA for each source of truth.
- [ ] Record the last verified build/test SHA per repository.
- [ ] Identify duplicated implementations and declare which one is authoritative.
- [ ] Block copy/sync jobs when source authority is ambiguous.

### A2. Branch and change hygiene
- [ ] All work starts on a named non-production branch.
- [ ] Branch name encodes workstream or issue.
- [ ] Every commit has a meaningful imperative message.
- [ ] Every commit references a checklist item or issue when available.
- [ ] Changes to the same file are serialized to avoid stale-SHA overwrites.
- [ ] CI runs against the exact proposed commit SHA.
- [ ] Pull requests state scope, evidence, limitations, risk, and rollback.
- [ ] Pull requests remain drafts until required validation passes.
- [ ] No automation pushes directly to main unless a separately approved policy explicitly permits it.
- [ ] No bot auto-merges security, identity, routing, or deployment changes.
- [ ] Branch protection and required checks are reviewed and documented.
- [ ] Stale branches are reported; they are not automatically deleted without an approved retention policy.

## B. CI and test automation

### B1. Workflow safety
- [ ] CI uses least-privilege permissions.
- [ ] CI pins supported runtime versions.
- [ ] CI has explicit timeouts.
- [ ] CI does not expose secrets in logs, artifacts, test output, or error messages.
- [ ] Pull-request workflows do not execute untrusted code with deployment credentials.
- [ ] Test workflows cannot deploy to production.
- [ ] Workflow names identify the product/workstream and purpose.
- [ ] Workflow triggers are limited to intended branches and pull-request events.
- [ ] Dependency installation is deterministic where lockfiles exist.
- [ ] Workflow failure returns a non-zero result.
- [ ] CI results are associated with the exact tested SHA.
- [ ] A green check on one repository is never treated as proof that another repository passed.

### B2. Required test layers
- [ ] Unit tests cover deterministic functions and state transitions.
- [ ] Contract tests validate request and response shapes.
- [ ] Integration tests exercise real component boundaries with safe test fixtures.
- [ ] Negative tests cover missing, malformed, stale, and unauthorized inputs.
- [ ] Regression tests reproduce each confirmed defect.
- [ ] Accessibility checks cover keyboard operation, labels, focus, and status announcements.
- [ ] Browser tests cover supported desktop and mobile layouts.
- [ ] Browser tests distinguish secure-context-only capabilities from ordinary page rendering.
- [ ] Network tests verify timeout, non-2xx, malformed JSON, empty response, and disconnected-backend behavior.
- [ ] Security tests cover origin restrictions, replay, open redirects, injection, and secret leakage as applicable.
- [ ] Production build checks run in an isolated environment.
- [ ] Test artifacts contain enough information to reproduce a failure without including secrets.
- [ ] Flaky tests are identified and fixed rather than hidden by unlimited retries.
- [ ] Retry counts are bounded and retries do not duplicate irreversible actions.

### B3. Release criteria
- [ ] All required automated checks pass on the candidate SHA.
- [ ] The candidate SHA is the same one reviewed in the pull request.
- [ ] Browser-level validation is recorded separately from Node/unit test results.
- [ ] Live API validation is recorded separately from mock or fixture results.
- [ ] Known limitations appear in the release notes.
- [ ] A rollback artifact or known-good commit is identified.
- [ ] Release operator and approval are recorded.
- [ ] Deployment result is independently verified after release.
- [ ] Release is stopped if the target environment or deployment rail is uncertain.

## C. Iris UI and capability truthfulness

### C1. Interaction state machine
- [ ] Define valid states: idle, listening, thinking, speaking, working, error, and unavailable.
- [ ] Define allowed transitions between states.
- [ ] Every asynchronous operation has success, failure, timeout, cancellation, and cleanup transitions.
- [ ] A failed lookup returns Iris to a usable state.
- [ ] Repeated submissions cannot create uncontrolled overlapping requests.
- [ ] Cancel stops or invalidates outstanding UI work where technically possible.
- [ ] Stale responses cannot overwrite newer answers.
- [ ] Busy controls are disabled or safely queue work while a request is active.
- [ ] Empty input is rejected locally.
- [ ] Status is visible and announced accessibly.
- [ ] Errors do not expose internal stack traces or private configuration.
- [ ] Reduced-motion preferences are respected.
- [ ] Mobile layouts retain access to primary controls and status.

### C2. Answer-engine boundary
- [ ] API endpoint comes from trusted configuration, not arbitrary user-controlled URL parameters.
- [ ] Only approved origins receive user prompts.
- [ ] Requests have timeouts and cancellation behavior.
- [ ] HTTP failures are surfaced honestly.
- [ ] Invalid JSON is handled without crashing the interface.
- [ ] Empty answer payloads are treated as unavailable, not as successful answers.
- [ ] The UI never echoes the user's prompt as if it were an AI answer.
- [ ] The UI never presents a fixture or mock as a live kernel response.
- [ ] Request identifiers correlate UI state and server-side logs without logging prompt content.
- [ ] Any fallback engine is explicitly named and privacy-reviewed.
- [ ] Local document text is never silently forwarded to public search.
- [ ] Capability claims match observed and tested behavior.

### C3. Voice and speech
- [ ] Feature detection precedes use of browser speech APIs.
- [ ] Microphone access occurs only after an explicit user action.
- [ ] Permission denial produces a clear status and preserves typed input.
- [ ] Recognition errors return to a recoverable state.
- [ ] Recognition stops after cancellation, reset, and page teardown.
- [ ] Speech synthesis is stopped when the user cancels or starts a new response.
- [ ] Duplicate recognition events cannot submit the same transcript repeatedly.
- [ ] Voice transcript handling follows the same origin and privacy controls as typed input.
- [ ] Browser/device support matrix is documented.
- [ ] No voice capability is described as universal.

### C4. Camera and vision
- [ ] Camera preview is labelled as preview only until inference is connected.
- [ ] Camera permission is requested only after explicit user action.
- [ ] Camera tracks stop after close, cancel, and page teardown.
- [ ] No frame is uploaded unless the user explicitly initiates a supported vision action.
- [ ] If frame upload is added, endpoint, retention, consent, and data-flow are documented first.
- [ ] No image-understanding claim appears without a real inference result.
- [ ] Camera denial and missing-device paths are tested.

### C5. Local files and data minimization
- [ ] Supported file extensions are explicitly listed.
- [ ] Maximum file bytes are enforced before reading.
- [ ] Maximum extracted text characters are enforced.
- [ ] Binary content is rejected by an explicit guard.
- [ ] Credential-like content is screened with a documented, limited heuristic.
- [ ] Heuristic limitations are documented; screening is not represented as perfect secret detection.
- [ ] Failed replacement-file selection clears stale document context.
- [ ] File contents remain ephemeral unless the user explicitly submits a question.
- [ ] File contents are not written to localStorage, sessionStorage, analytics, or telemetry.
- [ ] File contents are not included in error logs.
- [ ] File text is sent only to the configured trusted answer engine after an explicit user action.
- [ ] File text is not forwarded to public search as a fallback.
- [ ] PDF, image, spreadsheet-cell, and other unsupported extraction paths are labelled accurately.
- [ ] File cancellation and clearing remove the in-memory context.
- [ ] File behavior is tested for empty, oversized, malformed, binary, secret-like, and valid inputs.

## D. API, kernel, and telemetry

### D1. API contract
- [ ] Enumerate actual deployed routes and their source handlers.
- [ ] Map each route to its authoritative service/module.
- [ ] Verify request schema and response schema.
- [ ] Verify authentication and authorization requirements.
- [ ] Verify CORS allowlist against intended callers.
- [ ] Verify content-type, payload size, and rate limits.
- [ ] Verify timeouts and upstream error mapping.
- [ ] Verify non-destructive behavior for inspection/telemetry routes.
- [ ] Reject unknown task kinds and malformed envelopes.
- [ ] Preserve correlation ID, request hash, timestamp, and sequence where specified.
- [ ] Ensure hashes are computed over a canonical representation.
- [ ] Ensure signatures are validated server-side where required.
- [ ] Confirm the live route reaches the real kernel, not a label, fixture, or stub.
- [ ] Mark unavailable kernel state explicitly.
- [ ] Never report residue=0 or a verified result unless measured and evidenced.

### D2. Observability
- [ ] Define structured event names and a versioned schema.
- [ ] Log status transitions, duration, outcome, and correlation ID.
- [ ] Never log credentials, bearer tokens, passkey assertions, raw prompts, or document contents.
- [ ] Distinguish client telemetry from server-observed facts.
- [ ] Distinguish synthetic checks from real user traffic.
- [ ] Set retention and access rules for logs.
- [ ] Track request success rate, error rate, timeout rate, and latency.
- [ ] Alert thresholds have an owner and a documented response.
- [ ] Alert messages include the failing component and next safe diagnostic step.
- [ ] Alert deduplication avoids repeated notification storms.
- [ ] Health endpoints do not leak secrets or internal infrastructure details.
- [ ] A green health endpoint is not treated as proof of end-to-end functionality.

## E. Identity and cross-domain handoff

### E1. Domain separation
- [ ] Document `.com` as the 2D identity surface.
- [ ] Document `.ai` as the 3D World surface.
- [ ] Enumerate allowed cross-domain requests and redirects.
- [ ] Verify no redirect loop returns an authenticated user to the identity entry screen.
- [ ] Verify direct unauthenticated entry to the 3D World fails closed.
- [ ] Verify the World does not trust localStorage flags, URL fragments, or client-only state as proof of identity.

### E2. WebAuthn and handoff
- [ ] Identify the authoritative WebAuthn relying-party origin.
- [ ] Validate that configured RP ID is equal to or a registrable-domain suffix of the calling host.
- [ ] Validate assertion challenge, origin, RP ID hash, flags, credential ownership, and signature server-side.
- [ ] Identify the authoritative server-side session store.
- [ ] Define a random, short-lived, single-use handoff grant.
- [ ] Bind grant to audience, issuance time, expiry, and intended session/user.
- [ ] Atomically consume the grant to prevent replay.
- [ ] Reject expired grants.
- [ ] Reject already-consumed grants.
- [ ] Reject wrong-audience grants.
- [ ] Reject forged callbacks and origin mismatch.
- [ ] Protect against CSRF and open redirects.
- [ ] Never put assertion, reusable token, or sensitive payload in a URL.
- [ ] Ensure grant and assertion values never enter analytics or logs.
- [ ] Establish a separate secure session on the receiving domain.
- [ ] Test success, cancel, stale callback, replay, expiry, wrong origin, direct entry, and backend outage.
- [ ] Keep handoff blocked until the authoritative backend and atomic replay protection are proven.

## F. Bridge, routing, and apex quarantine

- [ ] Maintain an explicit path allowlist.
- [ ] Reject unknown routes by default.
- [ ] Keep apex overwrite blocked unless a separately approved cutover is underway.
- [ ] Validate upstream host and path against a fixed allowlist.
- [ ] Never construct upstream URLs from arbitrary user input.
- [ ] Apply timeouts and response-size limits to upstream fetches.
- [ ] Set accurate content types and cache controls.
- [ ] Do not forward credentials or cookies unless explicitly required and reviewed.
- [ ] Test allowed path, unknown path, apex path, upstream 404, upstream 500, timeout, and malformed response.
- [ ] Verify worker code in source and verify deployed worker identity separately.
- [ ] No DNS, route, cache, or Worker changes during ordinary CI.

## G. Cloudflare and release automation — deferred until authorized

### G1. Incident identification
- [ ] Identify the exact Worker or Pages project that emitted the failed build.
- [ ] Record build ID, timestamp, commit SHA, target branch, and deployment environment.
- [ ] Confirm whether the failure belongs to Worker Builds or Pages direct upload.
- [ ] Keep the deleted/rotated build-token incident separate from any other token incident until evidence links them.
- [ ] Do not request or store a token in source code, chat logs, artifacts, or repository files.

### G2. Credential and build readiness
- [ ] Identify the required token type and minimum scopes from the actual build configuration.
- [ ] Confirm token owner and rotation policy.
- [ ] Restore credentials only through the authorized Cloudflare settings flow.
- [ ] Verify the token is available to the intended build integration without exposing its value.
- [ ] Re-run a non-production build first.
- [ ] Confirm the exact source commit and build artifact.
- [ ] Confirm the build output matches the expected artifact manifest.
- [ ] Confirm no unexpected environment variables or secrets were embedded into client assets.
- [ ] Stop before production deployment until explicitly approved.

### G3. Deployment and rollback
- [ ] Document the authoritative deployment rail.
- [ ] Record the last known-good deployment ID and artifact hash.
- [ ] Produce a preflight report without making changes.
- [ ] Verify target account, project, branch, domain, and environment.
- [ ] Require explicit human approval immediately before production mutation.
- [ ] Deploy one reviewed artifact only.
- [ ] Verify expected routes, headers, status, and content hash after deployment.
- [ ] Verify DNS records remain unchanged unless DNS change was explicitly approved.
- [ ] Define rollback trigger thresholds.
- [ ] Preserve the prior artifact and rollback instructions.
- [ ] Test rollback procedure in a non-production environment.
- [ ] Report deployment as complete only after independent post-deploy checks pass.

## H. Live-server safety

- [ ] Inventory NJ and Amsterdam hosts, their roles, and data dependencies.
- [ ] Keep live database host and application host roles distinct.
- [ ] No SSH or remote command is executed by unattended CI.
- [ ] No firewall, systemd, database, or live DNS changes occur without explicit approval.
- [ ] Before any approved change, capture service status and relevant configuration backup.
- [ ] Record the exact commands, target host, expected result, and rollback.
- [ ] Prefer read-only diagnostics first.
- [ ] Never print credentials or environment secrets during diagnostics.
- [ ] Validate health after approved changes.
- [ ] If validation fails, stop further mutations and follow the approved rollback.
- [ ] Do not infer production health from local tests or repository CI.

## I. Automation engine reliability

- [ ] Each job has a unique idempotency key.
- [ ] Duplicate jobs are detected before side effects.
- [ ] Each job has a declared timeout.
- [ ] Retries use bounded exponential backoff with jitter where appropriate.
- [ ] Non-retryable errors are classified explicitly.
- [ ] Job state is durable enough for the required recovery guarantees.
- [ ] State transitions are validated and auditable.
- [ ] A job cannot jump from proposed to production-verified without evidence.
- [ ] Cancellation behavior is defined for each job type.
- [ ] Interrupted jobs can be reconciled after restart.
- [ ] Partial completion is represented explicitly.
- [ ] Compensation/rollback actions are defined for reversible side effects.
- [ ] Irreversible actions require explicit confirmation.
- [ ] Concurrency limits prevent resource exhaustion.
- [ ] Queue depth and stuck-job age are monitored.
- [ ] Failed jobs expose a precise missing prerequisite.
- [ ] A human can inspect a dry-run plan before any sensitive action.
- [ ] No agent may broaden its own permissions or invent a missing credential.

## J. Evidence, integrity, and audit ledger

- [ ] Every implementation claim links to a commit, test run, artifact, or observation.
- [ ] Every test result includes the exact SHA tested.
- [ ] Every deployment observation includes environment and timestamp.
- [ ] Every generated artifact has a deterministic name and content hash.
- [ ] Hash inputs use canonical serialization and explicit encoding.
- [ ] Timestamps include UTC or an explicit offset.
- [ ] The audit record excludes secrets and unnecessary personal data.
- [ ] Failed and blocked attempts are recorded without overstating completion.
- [ ] Any manual override records who authorized it, what changed, and why.
- [ ] Ledger writes are append-only where the architecture requires it.
- [ ] Integrity verification can detect altered or missing records.
- [ ] Independent verification is distinguished from self-reported success.
- [ ] “Zero residue” is claimed only when the defined measurement procedure proves it.

## K. Operational runbooks

- [ ] Build failure runbook identifies project, commit, token/configuration, logs, and safe next step.
- [ ] API outage runbook checks DNS/TLS, CORS, route, upstream, timeout, and response schema in order.
- [ ] Iris failure runbook checks browser support, permissions, client state, API response, and recovery.
- [ ] Authentication failure runbook checks origin/RP ID, challenge, assertion validation, session store, and grant replay.
- [ ] Release rollback runbook identifies prior artifact, rollback authority, verification, and escalation.
- [ ] Incident runbooks use read-only diagnostics before mutation.
- [ ] Every runbook has an owner and last-verified date.
- [ ] Runbooks are tested periodically in a safe environment.
- [ ] Operator-facing output is short, actionable, and includes the exact missing prerequisite.

## L. Acceptance gate for automation excellence

- [ ] All production-affecting jobs are approval-gated.
- [ ] All non-production jobs are scoped and least-privileged.
- [ ] All code changes are versioned and reviewable.
- [ ] Required CI checks pass on the exact candidate SHA.
- [ ] Critical failure paths have regression tests.
- [ ] Browser/device and live integration checks are not misrepresented by unit-test results.
- [ ] Security review covers identity, origin trust, secrets, and replay.
- [ ] Observability and recovery runbooks are present.
- [ ] Rollback is documented and testable.
- [ ] Open blockers have named missing evidence and a safe next action.
- [ ] A release candidate is not declared ready while any critical item is unresolved.
- [ ] Final approval remains with the authorized human.

## Current known checkpoint (2026-10-17)

- [x] Landing/playground workstream has a draft PR and a passing six-file Node test run recorded in its PR.
- [x] Isolated HUD workstream has a draft PR and a passing two-file Node test run recorded in its PR.
- [x] Apex overwrite remains quarantined in the isolated HUD bridge source.
- [x] Cloudflare token incident is documented as deferred; no token or DNS changes were made.
- [ ] Replit workspace changes are not yet reconciled.
- [ ] Real-browser desktop/mobile verification is pending.
- [ ] Live API/CORS and actual kernel route are not yet independently verified.
- [ ] Authoritative identity backend and replay-safe session store are not yet confirmed.
- [ ] Deployment rail and rollback artifact require confirmation.
- [ ] No production deployment is authorized by this checklist.

## Next safe execution order

1. [ ] Inspect the exact source tree and workflow configuration in both repositories.
2. [ ] Confirm test runs still match the current branch heads.
3. [ ] Add/validate deterministic static checks for bridge allowlist, apex quarantine, and prohibited secret patterns.
4. [ ] Add browser-level tests that run without production credentials.
5. [ ] Map HUD API configuration to the real server route using read-only evidence.
6. [ ] Verify CORS and API behavior in a safe preview environment.
7. [ ] Reconcile Replit workspace changes when agent usage is available.
8. [ ] Identify authoritative identity backend and server-side session store.
9. [ ] Implement and test handoff only after prerequisites are verified.
10. [ ] Identify the exact Cloudflare build project and token integration; wait for user authorization before credential work.
11. [ ] Produce a release preflight and rollback plan.
12. [ ] Request explicit approval before any production-impacting action.
