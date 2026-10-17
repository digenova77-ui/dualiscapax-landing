# DualisCapax Master Engineering Checklist

**Owner:** DualisCapax engineering workstream  
**Baseline date:** 2026-10-17 UTC  
**Repository:** `digenova77-ui/dualiscapax-landing`  
**Status:** Initial audit in progress; this document is a checklist, not a claim that the items are complete.

## Evidence and status rules

Use only these statuses:

- **PASS** — the specific requirement was tested and evidence is recorded.
- **PARTIAL** — some implementation exists, but end-to-end behavior is not proven.
- **BLOCKED** — a named dependency or external permission prevents completion.
- **NOT TESTED** — evidence is not yet available.
- **FAIL** — a test was run and did not meet the acceptance criterion.
- **NOT APPLICABLE** — explain why.

For each completed item record: date/time UTC, commit SHA or deployed version, exact command or test, expected result, actual result, evidence URL/log reference, and remaining risk. File existence, a successful build, a passing unit test, and a successful deployment are different facts.

## Governing constraints

- [ ] Preserve the live domain, DNS, database, and New Jersey server. No changes to production infrastructure without a reviewed plan and explicit go-ahead.
- [ ] Inspect before editing; create a backup or reversible commit before risky changes.
- [ ] No credentials, private keys, passkey material, tokens, or sensitive identity data in source, URLs, browser storage, or logs.
- [ ] Fail closed: no accepted state, world unlock, or privileged action unless the server's verified response authorizes it.
- [ ] Keep the existing system coherent. Do not introduce a second framework or parallel deployment rail without a demonstrated need.
- [ ] Preserve project laws: `TRUTH_OR_NOTHING`, `NO_FORCE`, `HOST_SAFE`, `CLEANUP_FIRST`.
- [ ] Separate proposed, committed, built, deployed, and live-verified states in every report.
- [ ] Every code change must have a commit SHA, validation evidence, and a rollback path.
- [ ] Never claim work happened on the live site unless the deployed behavior was directly verified.

## Phase 0 — Establish a trustworthy baseline

- [x] Confirm connected GitHub identity and repository write capability using a non-production test repository. Evidence: test commit `90da83e9f79cbce327439b3aa820f5d9a973c4b8` in `dualiscapax-write-check`.
- [x] Inspect the default branch and top-level application entry point in `dualiscapax-landing`.
- [x] Inspect recent GitHub Actions runs. A GitHub Pages build/deploy run for commit `b63320d6c49663bab9c39586fb4f82bf5b9a53d6` completed successfully on 2026-10-16; this does not prove the canonical domain is served by that deployment.
- [ ] Record repository default branch, current HEAD SHA, most recent commit, and branch protection/rulesets.
- [ ] Establish the authoritative live delivery path: Cloudflare Worker/Pages, GitHub Pages, IPFS/IPNS, or a documented combination. Confirm with read-only evidence before any deploy.
- [ ] Capture current public responses for canonical domain, key routes, security headers, and relevant API endpoints. Do not include secrets or private identity data.
- [ ] Record current live baseline and known issues so later tests can compare before/after.
- [ ] Identify all active domains and their intended roles: `dualiscapax.ai`, `www.dualiscapax.ai`, and `dualiscapax.com`.

## Phase 1 — Repository and code inventory

- [x] Inspect root `index.html` and its referenced JavaScript/CSS bundles.
- [x] Inspect the API probe logic in `assets/main-aLcyOp8b.js`.
- [x] Inspect Iris page/session files and the front-interface handoff specification.
- [x] Compare rewrite targets against tracked repository paths; found nine configured targets without a matching tracked file/directory in the initial tree scan.
- [ ] Inventory every entry page and its scripts, styles, workers, API base configuration, and navigation destinations.
- [ ] Search for duplicate/obsolete implementations of Iris, HUD, authentication, API v2, DCLM, and kernel adapters.
- [ ] Verify referenced assets, fonts, manifests, service workers, WASM modules, and imports resolve in the built output.
- [ ] Identify generated/minified files versus canonical source files; edit the source of truth, not a stale build output.
- [ ] Review CSP, CORS, cache rules, redirects, headers, and any service-worker cache behavior together.
- [ ] Identify existing test/build commands and any workflow assumptions about directory layout.

## Phase 2 — Biometric/passkey handoff

- [x] Read `handshake/FRONT-INTERFACE.md`; it documents the intended flow and explicitly says the telemetry wire was not live at the time of that document.
- [ ] Inspect the actual `.com` credential creation/get implementation and confirm the relying-party ID, HTTPS top-level context, challenge generation, user verification, resident key policy, timeout, and error handling.
- [ ] Verify `https://dualiscapax.com/.well-known/webauthn` returns HTTP 200, correct JSON content type, and the expected origin list.
- [ ] Verify the receiving `.ai` page calls `navigator.credentials.get` with the intended relying-party ID and does not create a second credential.
- [ ] Verify no credential ID, assertion, digest, biometric data, password, or token is put in the URL, cookie, local storage, or postMessage.
- [ ] Verify the receiver validates the assertion server-side; a browser prompt alone is not authentication.
- [ ] Verify the only intended protocol body is sent to the correct endpoint, with strict schema validation and bounded payload size.
- [ ] Verify server response is checked for an explicit accepted result; malformed, refused, timed-out, unavailable, and non-2xx responses must remain locked.
- [ ] Test cancellation, no authenticator, wrong RP/origin, stale challenge, replay, timeout, network failure, and repeated-click behavior.
- [ ] Ensure the user receives a clear non-sensitive failure reason and can retry without accidental navigation loops.
- [ ] Test on supported Android/mobile browsers and desktop browsers using test credentials and a staging environment.
- [ ] Confirm the biometric/passkey handoff works end-to-end before marking PASS.

## Phase 3 — HUD and Agent Iris

- [x] Confirm root `index.html` currently mounts a canvas and loads scene bundles; the root markup inspected does not itself provide the controls queried by the main bundle.
- [x] Confirm main bundle supports optional API-probe, camera-reset, and local-kernel controls, and that the API base defaults to NOT_CONFIGURED if no endpoint is supplied.
- [x] Inspect `js/iris-page.js` and `js/iris-session.js` for page explanation and session state handling.
- [ ] Choose one canonical receiving page and make the biometric handoff land there consistently.
- [ ] Add a functional HUD to that page, with accessible labels, focus order, touch targets, keyboard support, and responsive mobile layout.
- [ ] HUD must show truthful states such as LOCKED, VERIFYING, API UNAVAILABLE, ACCEPTED, REFUSED, LISTENING, THINKING, and SPEAKING; never show success before verified confirmation.
- [ ] Connect visible controls to actual implementations; remove inert buttons and placeholder status indicators.
- [ ] Connect Iris sphere/orb lifecycle to the session controller; ensure mount, listen, think, speak, interrupt, and cleanup work without duplicate listeners.
- [ ] Test microphone permission grant/denial, unsupported browser APIs, no microphone, and speech synthesis failure.
- [ ] Keep camera access opt-in and visibly active; do not imply optical perception when none is active.
- [ ] Distinguish local demo/kernel results from remote server-authorized results in both UI and logs.
- [ ] Add an accessible text fallback if WebGL or 3D rendering fails.
- [ ] Test reload, route change, browser back/forward, multiple tabs, reduced motion, low-power/mobile devices, and cleanup.
- [ ] Confirm Iris never claims to see, hear, execute, or connect unless the respective capability is actually active.

## Phase 4 — API v2, DCCP jacket, and kernel integration

- [ ] Identify the canonical API base and its environment-specific values; do not bake production URLs or credentials into client code unnecessarily.
- [ ] Inspect route registration and server implementation for `/api/iris`, `/api/v2/chat`, `/api/v2/compute`, and documented `/v2/*` routes.
- [ ] Test method, status code, content type, response schema, CORS, CSP compatibility, timeout, and error body for each route.
- [ ] Confirm API v2 request schema, payload length limits, flags, request hash, optional signature semantics, and idempotency/duplicate-job behavior.
- [ ] Confirm server-side authentication and authorization; a protocol string or client-supplied `accepted` flag is not proof.
- [ ] Confirm refusal and missing-kernel states are explicit and fail closed; never convert `KERNEL_UNAVAILABLE` into success.
- [ ] Confirm no mock identity, fake receipts, or placeholder responses can be mistaken for real authorization.
- [ ] Verify kernel adapter connects to the intended PlanckOS/runtime interface, rather than only rendering a local receipt.
- [ ] Verify sequence numbers, hashes, timestamps, ledger writes, and residue calculations are deterministic and validated.
- [ ] Test timeout, malformed JSON, wrong content type, oversized payload, duplicate request, stale request, kernel crash, and upstream outage.
- [ ] Confirm telemetry is read-only, privacy-bounded, and not required for a basic authorized handoff unless explicitly designed as a prerequisite.
- [ ] Record real request/response evidence with secrets and private data redacted.

## Phase 5 — Routing and page integrity

- [x] Compare the 35 `_redirects` entries with the 479-path main-branch tree. Initial scan found unmatched destinations including `/synapse.html`, `/sport.html`, `/look.html`, `/sandbox`, and `/iris`.
- [ ] Re-run the route comparison against the current commit and classify each mismatch as intentional external route, rewrite, missing page, or obsolete rule.
- [ ] Repair or remove broken rewrite rules only after checking intended route behavior and canonical URLs.
- [ ] Test all public routes for correct status, expected page title/content, and no redirect loops.
- [ ] Test trailing slash, no trailing slash, `.html` aliases, query strings, fragments, and unknown routes.
- [ ] Verify canonical links, sitemap, robots rules, and internal navigation agree with the intended public route structure.
- [ ] Test the biometric destination specifically on a clean browser session, not only from a warmed cache.
- [ ] Verify 404 pages are useful and do not leak implementation details.

## Phase 6 — Security and privacy

- [x] Confirm a secret-scanning workflow exists in the repository; the existence of the workflow is not proof that the latest run passed.
- [ ] Inspect the latest secret-scan workflow run and resolve any real findings before deployment.
- [ ] Review repository history and current tracked files for accidental credentials; rotate any confirmed exposed secret rather than merely deleting it from the latest file.
- [ ] Review CSP directives, especially `connect-src`, against the exact API origins the application needs.
- [ ] Verify CORS allows only intended origins and methods; avoid wildcard credentials.
- [ ] Verify HTTPS-only behavior, HSTS where appropriate, secure cookie flags if cookies are used, and no mixed content.
- [ ] Verify authentication challenges are fresh, single-use, origin-bound, and validated server-side.
- [ ] Verify rate limiting, abuse controls, request-size limits, safe error handling, and server-side authorization.
- [ ] Verify logs exclude tokens, WebAuthn assertion bodies, private keys, biometric data, and unnecessary personal data.
- [ ] Review third-party dependencies and pinned workflow actions; document updates separately from functional fixes.
- [ ] Confirm security headers on the deployed site, not only in configuration files.

## Phase 7 — Build, tests, and quality gates

- [ ] Identify the canonical build command and reproduce it from a clean checkout.
- [ ] Run lint/type checks if configured; document unavailable or missing test infrastructure instead of implying tests ran.
- [ ] Run unit tests for protocol parsing, status transitions, refusal paths, and request validation.
- [ ] Run integration tests against a staging API using non-production credentials and test identities.
- [ ] Run browser tests for initial load, biometric return, HUD visibility, API status, voice controls, navigation, and failure states.
- [ ] Check browser console and network requests for failed assets, CORS/CSP blocks, unhandled promises, and 4xx/5xx responses.
- [ ] Test supported mobile viewport sizes and a desktop viewport.
- [ ] Confirm the output artifact contains all required files and no secrets, local environment files, backups, or nested unexpected web-root directory.
- [ ] Generate and record SHA-256 for the exact release artifact.
- [ ] Make the build fail on required test failure; do not bypass a failed gate just to publish.

## Phase 8 — Deployment and rollback

- [x] Inspect `.github/workflows/pages-direct-upload.yml`; it documents a missing `cf-pages/` source requirement and a Cloudflare authentication error code 10000.
- [x] Inspect `.github/workflows/workers-live.yml`; it explicitly describes the automatic Worker deploy rail as retired.
- [x] Observe a GitHub Pages deployment run succeeding on 2026-10-16; the canonical production serving path remains to be confirmed.
- [ ] Confirm the authoritative publishing destination for `dualiscapax.ai` using live DNS/deployment configuration evidence.
- [ ] Resolve the conflict between GitHub Pages workflow behavior, Cloudflare Pages manual workflow, Worker source, and the IPFS/IPNS publishing process.
- [ ] Confirm whether a Pages deployment would alter the canonical domain before triggering any workflow.
- [ ] Fix the Cloudflare token configuration through the authorized dashboard/secret store; never ask the operator to paste the token into chat.
- [ ] Ensure the workflow packages the intended source tree at the ZIP root and checks artifact contents before deploy.
- [ ] Use a staging/preview destination first; if no safe preview exists, stop and request explicit approval for a production window.
- [ ] Capture the current known-good artifact/version and exact rollback command/process.
- [ ] Deploy only after explicit release approval and passing gates.
- [ ] Verify the deployed commit/artifact, canonical routes, headers, handoff, API, and HUD from an external client after deployment.
- [ ] Roll back immediately if agreed critical smoke tests fail; record the incident and actual rollback evidence.

## Phase 9 — Server and runtime safety

- [ ] Treat the New Jersey host as production-critical; use read-only inspection first.
- [ ] Verify DCCP service state, recent logs, listeners, route behavior, and dependency health without restarting services.
- [ ] Verify PlanckOS process and telemetry endpoint independently from DCCP; one healthy service does not prove the other is connected.
- [ ] Trace why `/api/v2/compute` can return `KERNEL_UNAVAILABLE` and document the exact missing dependency or route binding.
- [ ] Confirm PostgreSQL connectivity and access restrictions without exposing connection strings or data.
- [ ] Verify the live domain and database are unaffected by staging experiments.
- [ ] No service restart, firewall change, DNS change, database migration, or deploy without an explicit plan, backup, validation, and rollback.
- [ ] Record a final health matrix distinguishing process alive, port reachable, route responding, kernel available, and end-to-end behavior passing.

## Phase 10 — Documentation, evidence, and handoff

- [ ] Keep this checklist current; check an item only when its acceptance criterion is evidenced.
- [ ] Record each issue with impact, reproducible steps, owner/action, dependency, and next verification.
- [ ] Record every change with commit SHA, file list, purpose, tests, artifact hash, and deployment state.
- [ ] Keep operating instructions aligned with the actual deployment path; remove stale or contradictory instructions only after confirming their replacement.
- [ ] Keep the Factory Bulletin Board distinction between proposed, approved, executed, and verified work.
- [ ] Produce a concise release report: PASS, PARTIAL, BLOCKED, NOT TESTED, and FAIL counts; known risks; rollback reference; next exact action.
- [ ] Do not declare overall completion while any critical handoff, authentication, API, security, or live-smoke-test requirement remains unverified.

## Initial audit ledger

| Area | Initial status | Evidence / finding | Next action |
|---|---|---|---|
| GitHub write access | PASS for test repository | Test commit `90da83e9f79cbce327439b3aa820f5d9a973c4b8` | Confirm only the specific repo/action needing writes |
| Root HUD | PARTIAL | Root page contains a canvas and bundles; queried HUD controls are not present in root HTML | Trace intended receiver and canonical source |
| API base | PARTIAL | Main bundle defaults to `NOT_CONFIGURED` if no base is supplied | Identify real configured API and verify response |
| WebAuthn handoff | NOT TESTED end-to-end | Specification exists; it says telemetry wire was not live | Inspect implementation and staging behavior |
| Routes | FAIL for initial path comparison | Nine rewrite destinations lacked a matching tracked target | Reconcile routes with intended paths |
| Deployment path | BLOCKED / unresolved | Pages run succeeded; Cloudflare workflow documents missing artifact source and auth error 10000 | Establish source of truth and fix rail safely |
| Secret scan | NOT TESTED | Workflow exists; latest result not yet inspected | Read latest run and results |
| Live server | NOT TESTED in this checklist pass | No live mutation performed | Read-only route/service verification |
| Production changes | NONE MADE | Audit and checklist work only | Preserve until release gate is met |

## Release gate

Production release is **NO-GO** until all critical items in Phases 2, 3, 4, 6, 7, and 8 pass, the canonical deployment target is established, and the rollback path is verified. Non-critical documentation items may remain open only if explicitly listed and approved.

## Biometric handoff remediation (2026-10-17)

- [x] Confirmed the current handoff spec explicitly requires a second passkey prompt after navigation and describes the telemetry wire as not live.
- [x] Staged a specification correction on branch fix/one-ceremony-biometric-handoff-20261017: one WebAuthn ceremony, server-side assertion validation, short-lived single-use handoff exchanged by HTTPS POST body, receiver-side session establishment, automatic clean-URL redirect into the 3D app, and fail-closed behavior.
- [ ] Locate or implement the actual identity backend's WebAuthn assertion verification. Repository searches so far found the specification but did not establish the complete live implementation.
- [ ] Implement the one-time handoff store/consume path on both backends; ensure atomic single-use consumption, expiry, audience binding, origin checks, replay protection, and secure session cookies.
- [ ] Implement the receiver-side automatic POST handoff and clean redirect; remove the manual second link and redundant second biometric prompt only after server validation replaces their authorization function.
- [ ] Stage and test supported mobile/desktop browsers: success, cancel, wrong origin/RP ID, invalid assertion, expired/replayed handoff, CORS/CSRF rejection, API down, and no URL/storage leakage.
- [ ] Do not merge or deploy until the implementation is present, tests pass, and production serving path is established.