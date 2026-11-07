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
- [x] Inspect before editing; the Pages worker and retired publish workflow were inspected before the source patch.
- [ ] No credentials, private keys, passkey material, tokens, or sensitive identity data in source, URLs, browser storage, or logs.
- [ ] Fail closed: no accepted state, world unlock, or privileged action unless the server's verified response authorizes it.
- [x] Keep the existing system coherent: HUD routes are isolated under `/holographic-core/v2`; apex stays served by Pages assets.
- [x] Preserve project laws in the publishing path: `TRUTH_OR_NOTHING`, `NO_FORCE`, `HOST_SAFE`, `CLEANUP_FIRST`.
- [x] Separate source changes from deployment status; no claim that the live site changed.
- [ ] Every code change must have a commit SHA, validation evidence, and a rollback path.

## Phase 0 — Establish a trustworthy baseline

- [x] Confirm connected GitHub identity and repository write capability using a non-production test repository. Evidence: test commit `90da83e9f79cbce327439b3aa820f5d9a973c4b8` in `dualiscapax-write-check`.
- [x] Inspect the default branch and top-level application entry point in `dualiscapax-landing`.
- [x] Inspect recent GitHub Actions runs. A GitHub Pages build/deploy run for commit `b63320d6c49663bab9c39586fb4f82bf5b9a53d6` completed successfully on 2026-10-16; this does not prove the canonical domain is served by that deployment.
- [ ] Record repository default branch, current HEAD SHA, most recent commit, and branch protection/rulesets.
- [ ] Establish the authoritative live delivery path: Cloudflare Worker/Pages, GitHub Pages, IPFS/IPNS, or a documented combination. Confirm with live read-only evidence before any production deploy.
- [ ] Capture current public responses for canonical domain, key routes, security headers, and relevant API endpoints. Do not include secrets or private identity data. Current execution environment could not resolve `dualiscapax.ai` (`curl` returned DNS resolution failure), so live HTTP/DNS status remains NOT TESTED here—not evidence that the site is down.
- [ ] Record current live baseline and known issues so later tests can compare before/after.
- [ ] Identify all active domains and their intended roles: `dualiscapax.ai`, `www.dualiscapax.ai`, and `dualiscapax.com`.

## Phase 1 — Repository and delivery recovery

- [x] Inspect root `index.html`, `_worker.js`, `wrangler.toml`, and the retired GitHub Pages workflow.
- [x] Add explicit isolated HUD routes to the Pages Advanced Mode worker. Source merged to main in commit `3cd4de8ebce3c0b103594fd55da0559a4453e6c3`; routes are not live-verified.
- [x] Restore `scripts/pack_hierarchical_flat_zip.py` on branch `fix/cloudflare-pages-package-2026-10-17`. The packer is source-added but has not yet been executed in a checkout.
- [x] Restore `docs/ops/ENVIRONMENT.md` with the manual Pages upload and staging instructions.
- [x] Execute the Pages package validation and build in GitHub Actions. Run: https://github.com/digenova77-ui/dualiscapax-landing/actions/runs/39028163018; source commit `b3bfd02ffbb8097ed18621c9fd84ea46e2a210e6`; validation and ZIP build steps passed.
- [x] Inspect the resulting artifact: required root files (`index.html`, `_worker.js`, `wrangler.toml`) present; ZIP CRC and SHA-256 sidecar verified; `.github/`, `docs/`, and `scripts/` excluded. Artifact ID `12099028793`; SHA-256 `e954635eacd535a11d1754f5b2d23f1f39d92f18cdabfa19451af19b4f1e1786` applies to the GitHub Actions artifact ZIP.
- [x] Harden the packer so repository automation and engineering notes are not copied into the public Pages package; commit `b3bfd02ffbb8097ed18621c9fd84ea46e2a210e6`.
- [ ] Updated legacy `pack-self-deploy` to use the canonical hardened packer instead of independently zipping `cf-pages`; commit `f92f77f35f64d1cab1330e0598aad8a755826da1`. Validate a run before marking complete.
- [ ] Confirm the actual Cloudflare Pages project attached to `dualiscapax.ai`; `wrangler.toml` and environment docs identify `dualiscapax-web`, while the direct-upload workflow still targets `dualiscapax-landing` and documents Cloudflare error `10000`. Do not change the deployment target until the bound project is verified.
- [ ] Build/inspect a staging deployment, test root and HUD routes plus failure behavior, and verify no overlapping Worker routes.
- [ ] Promote to production only with explicit approval; verify deployed behavior and retain rollback target.
- [ ] Confirm the actual Cloudflare Pages project attached to `dualiscapax.ai`, current deployment and overlapping Worker routes.
- [ ] Deploy to preview/staging, not production; test root and legacy routes plus `/iris/status`, HUD HTML, SVG, and upstream failure behavior.
- [ ] Promote to production only with explicit approval; verify deployed behavior and retain rollback target.

## Phase 2 — HUD and Agent Iris

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

## Phase 3 — API v2, DCCP jacket, and kernel integration

- [ ] Identify the canonical API base and its environment-specific values; do not bake production URLs or credentials into client code unnecessarily.
- [ ] Inspect route registration and server implementation for `/api/iris`, `/api/v2/chat`, `/api/v2/compute`, and documented `/v2/*` routes.
- [ ] Test method, status code, content type, response schema, CORS, CSP compatibility, timeout, and error body for each route.
- [ ] Confirm API v2 request schema, payload length limits, flags, request hash, optional signature semantics, and idempotency/duplicate-job behavior.
- [ ] Confirm server-side authentication and authorization; a protocol string or client-supplied `accepted` flag is not proof.
- [ ] Confirm refusal and missing-kernel states are explicit and fail closed; never convert `KERNEL_UNAVAILABLE` into success.
- [ ] Confirm no mock identity, fake receipts, or placeholder responses can be mistaken for real authorization.
- [ ] Verify kernel response is cryptographically bound to the request and receipt.

## Deployment status — 2026-10-17

Source changes are not a deployment. No Cloudflare dashboard credentials or direct deployment tool were available in this work session. Do not mark live deployment as PASS until the manual staging upload, route checks, and rollback target have been recorded. Do not change DNS or touch live servers/databases as part of this recovery.

## Remove deleted depth Worker residue — 2026-10-17

Branch `fix/remove-depth-residue-20261017`. The Worker `dualiscapax-depth` was deleted by David on 2026-10-17 (workers.dev now returns HTTP 404, error code 1042).
- [x] Live NJ impact — PASS (none found): .com and .ai return 404 for `js/api-config.js` and `js/api-world.js`. The 7 referencing pages are not served on NJ (308/503). The live home pages and their scripts reference no workers.dev host.
- [x] Removed the default API host from `js/api-config.js` and `js/api-world.js`, and removed its entry from `data/geo-hosts.json`. With no `DC_API_BASE` set, calls return `NO_API_BASE` without any network request (tested in Node with fetch stubbed to throw).
- [ ] Repoint to an NJ API — NOT APPLICABLE: no equivalent NJ endpoint verified (`dualiscapax.ai/api/health` 404).
- [ ] Restore the Worker — BLOCKED on David's decision and a valid token. Source recovered from git `7d4d67ce5^:server/` (repo version of 2026-08-31; may differ from what was deployed).
- Rollback: revert this branch.
