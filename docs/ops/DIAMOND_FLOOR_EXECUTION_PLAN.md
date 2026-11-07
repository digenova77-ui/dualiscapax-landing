# Diamond-Floor Execution Plan

Status: active plan; not a completion claim. Production changes: none. Release gate: NO-GO until critical tests pass.

## Domain contract
- dualiscapax.com is the 2D identity surface only.
- dualiscapax.ai is the 3D World and in-world Iris only.
- Identity must be validated server-side before .ai creates an authenticated session.
- Preserve TRUTH_OR_NOTHING, NO_FORCE, HOST_SAFE, CLEANUP_FIRST.
- No production deploy, DNS, auth-provider, live server, firewall, or database changes without explicit approval.

## Critical security finding
The existing handshake/FRONT-INTERFACE.md proposes WebAuthn on dualiscapax.ai with rpId dualiscapax.com. WebAuthn requires rpId to equal the caller host or be a registrable domain suffix of it; .com is not a valid RP ID for an .ai origin. Do not implement or mark this flow PASS.

Required direction: authenticate at a valid RP origin, verify the assertion server-side, issue a short-lived unpredictable single-use handoff grant, and atomically consume it on the trusted .ai backend to establish an .ai session. Bind to audience and expiry; prevent replay, CSRF, open redirects, and URL/token leakage. First identify the authoritative backend and session store. If unavailable, mark BLOCKED rather than faking acceptance.

## Work board
| ID | Priority | Task | Acceptance evidence | Status |
|---|---|---|---|---|
| DF-001 | P0 | Preserve Replit workspace | Export or verified Git sync, compared without overwriting either side | BLOCKED: Replit agent paused; workspace not inspected |
| DF-002 | P0 | Confirm source of truth | Branch, HEAD, entry points, generated assets, deployment rail recorded | PARTIAL |
| DF-003 | P0 | Correct WebAuthn design | RP ID and origin rules respected; server-side validation documented | IN PROGRESS: incompatibility identified; NOTE 2026-10-17: Grok Bot live change G1–G4 runs the ceremony on .com (rp .com) and posts the assertion to .ai /api/v2/task; RP/origin compliance NOT TESTED |
| DF-004 | P0 | Implement one-time handoff | Expiring single-use grant consumed atomically; secure .ai session | BLOCKED: backend/session implementation unconfirmed; NOTE 2026-10-17: law_v 8 unity_handoff deployed (G1/G2); real-device test NOT TESTED; see checklist "Grok Bot production changes" |
| DF-005 | P0 | Test identity failure paths | cancel, timeout, invalid/stale/replayed challenge and missing session all fail closed | NOT STARTED |
| DF-006 | P0 | Enforce domain separation | .com 2D only; .ai 3D only; no redirect loop | NOT STARTED; NOTE 2026-10-17: .com home now served from NJ (G4, FAIL on device); .com→.ai only via handoff; NOT TESTED |
| DF-007 | P1 | Audit Iris modules | Canonical page, sphere, session, AV, chat/API paths inventoried | PARTIAL: js/iris-page.js and js/iris-session.js found |
| DF-008 | P1 | Repair Iris HUD | Responsive, accessible, real controls and truthful states | NOT STARTED |
| DF-009 | P1 | Verify Iris capabilities | chat/voice/camera/vision only claim capability when actually connected | NOT STARTED |
| DF-010 | P0 | Verify API v2/kernel | canonical base, schema, auth, failure behavior and real kernel connection tested | BLOCKED: route/backend unverified; NOTE 2026-10-17: POST /api/v2/task (.ai) now routes to law core /v2/door (G2); other ops 403 |
| DF-011 | P1 | Reconcile routes | redirects match intended existing destinations and pass route tests | NOT STARTED |
| DF-012 | P0 | Build and test | clean build, tests, browser/mobile checks and artifact hash recorded | NOT STARTED |
| DF-013 | P0 | Staging and rollback | safe preview and rollback verified; release separately approved | BLOCKED: delivery rail unresolved |
| DF-014 | P1 | Import Replit work | export compared; only verified changes transplanted | BLOCKED: workspace changes unknown |

## Release acceptance tests
- Fresh, unpredictable, single-use challenge; origin/RP validated server-side.
- Failed, cancelled, expired, forged, stale, replayed, and unavailable states stay locked.
- Handoff grant is short-lived, single-use, audience-bound and atomically consumed.
- No assertion, credential, reusable token, or private identity data in URL, local storage, or logs.
- Successful handoff creates a trusted .ai session and opens the actual 3D World; direct unauthenticated entry stays locked.
- Iris controls work on mobile/desktop; microphone and camera are opt-in; unsupported APIs and denied permissions are handled.
- UI statuses reflect real service state; animation or client flags never imply authorization.
- Clean build and required tests pass; CSP/CORS, routes, asset paths and API responses checked.
- Record commit SHA, test evidence, artifact hash and rollback. No production changes without explicit approval.

## Current evidence
- Baseline commit: 300befb2f7aa4e0589ed5ef333a83a39a556d5c1.
- Iris page module: js/iris-page.js, blob 84bac9af8965564523ef7872b36eaef1cd329318.
- Iris session module: js/iris-session.js, blob cf799deeccf2aba61b6fabbb4548291ae92be2e3.
- Handoff specification: handshake/FRONT-INTERFACE.md, blob 4c8066628305bf2cec6aa05173745ce54a806f1a; it says telemetry was not live when documented.
- Replit workspace export: NOT VERIFIED. End-to-end auth: NOT TESTED. Iris capabilities: NOT TESTED. Production changes: NONE.

## Execution order
1. Preserve/export Replit and compare to GitHub.
2. Inventory code and deployment topology read-only.
3. Resolve RP-ID mismatch and select trusted server-side handoff.
4. Implement identity bridge on isolated branch with tests.
5. Repair Iris/HUD against actual service contracts.
6. Run build, unit, integration, browser, mobile, security and failure-path tests.
7. Record diff, commit, tests, artifact hash and rollback.
8. Request explicit release approval only after staging verification.

Completion means tested behavior with reproducible evidence, not merely files or submitted prompts.