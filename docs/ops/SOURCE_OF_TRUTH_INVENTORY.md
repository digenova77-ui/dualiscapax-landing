# DualisCapax Source-of-Truth Inventory

**Snapshot:** 2026-10-17  
**Status:** Initial evidence-backed inventory; not a complete system map.  
**Law:** A repository, passing unit test, branch preview, or HTTP 200 is not by itself proof that production behavior is correct.

## 1. Known repositories and roles

| Repository | Observed main SHA at inspection | Known role | Limits of evidence |
|---|---|---|---|
| `digenova77-ui/dualiscapax-landing` | `0f3294c3153374a8eb1aace4f0e039ba1475612e` before checklist merge | Public landing/site source; static pages, browser clients, Pages Worker routing, numerous Actions workflows | Main pushes do not prove the live apex changed; production release is documented as manual/dispatch-only |
| `digenova77-ui/dualiscapax-hud` | `8876b33395757e78d4011791a60baf21f6bc4e91` | Isolated Iris HUD and bridge-worker source | PR #1 is draft/unmerged; source does not prove bridge is deployed |
| `digenova77-ui/dualiscapax-deploy` (private) | `fb8e17f55aabeb754bafa46d12a6f0eaa92e2eeb` | GitHub deploy worker for the `.com` sovereign stack; README describes manual workflow dispatch and an on-box receiver | Not the `.ai` Cloudflare Pages rail; not evidence that the chat API is deployed |
| `digenova77-ui/dualiscapax-factory-queue` (private) | Not inspected yet | Repository exists in connected GitHub installation | Role and authority are unverified |
| `digenova77-ui/dualiscapax-write-check` (private) | Not inspected yet | Repository exists in connected GitHub installation | Role and authority are unverified |

## 2. Landing release-rail evidence

- `wrangler.toml` describes a static brochure with no npm build.
- `.github/workflows/deploy.yml` labels the GitHub Pages rail retired and does not publish.
- `.github/workflows/workers-live.yml` labels the Actions worker auto-deploy rail retired.
- `.github/workflows/pages-direct-upload.yml` is `workflow_dispatch` only. It requires the exact input `DEPLOY`, packages `cf-pages`, verifies a SHA-256 artifact, and has a Cloudflare deployment job.
- That workflow documents `HOLE_CF_10000`: the injected Cloudflare token was present but lacked authorization to access the target Pages project. This is a blocker, not permission to rotate credentials automatically.
- Production release authority remains approval-gated. Do not dispatch the production workflow during ordinary tests.
- Cloudflare may create branch preview deployments automatically. A preview is not a production cutover and a green build is not browser verification.

## 3. API client and kernel boundary

- Landing browser clients reference `https://dualiscapax-depth.digenova77.workers.dev`.
- Source clients reference `/v2/chat`, `/v2/capabilities`, `/health`, and DCLM-specific routes.
- The authoritative source repository and deployed build SHA for the `dualiscapax-depth` Worker have not been established from the inspected trees.
- A browser client calling an endpoint is not proof that the endpoint accepts the schema, has sufficient fuel, allows the calling origin, or reaches the real kernel.
- Do not send live chat POST requests during source inventory; such requests may incur fuel or trigger external processing. Start with source contracts and safe read-only health/capability checks. Any charge-bearing or state-changing probe requires explicit approval.

## 4. Current review work

- Landing/playground PR #100: https://github.com/digenova77-ui/dualiscapax-landing/pull/100
- HUD PR #1: https://github.com/digenova77-ui/dualiscapax-hud/pull/1
- Automation Excellence checklist was merged as documentation and CI controls; review history: https://github.com/digenova77-ui/dualiscapax-landing/pull/102
- The landing unified API client origin guard is being added to PR #100 with a regression suite. Its final pass/fail state must be read from CI against the exact head SHA.

## 5. Production and server exclusions

- This inventory authorizes no production deployment, DNS mutation, Cloudflare token change, cache purge, live server mutation, database mutation, firewall change, or authentication-provider change.
- The `.com` deploy repository targets the New Jersey host and must not be mistaken for the `.ai` deployment mechanism.
- The API Worker source, deployed Worker identity, CORS allowlist, real kernel route, and current live response schema remain unverified.
- The authoritative WebAuthn backend/session store and replay-safe cross-domain handoff remain unverified.
- Replit workspace changes remain unreconciled while agent usage is paused.

## 6. Automated workflow inventory baseline

- A read-only scanner now classifies all workflow YAML files and emits a JSON artifact; it does not run deployment commands or change repository state.
- Initial baseline on 2026-10-17: 53 workflow files scanned; 29 classified as manual-mutation, 7 as scheduled-observer, 14 as read-only-or-artifact, and 3 as review-required.
- The initial heuristic report surfaced four review findings: `bulletin-handoff.yml` and `pinata-gateway-list.yml` reference secrets; `curl-gate.yml` did not expose an explicit permissions block to the scanner; `pinata-pin.yml` references secrets. These are review flags, not confirmed vulnerabilities.
- The scanner is deliberately report-only because it uses textual heuristics and can produce false positives. A human must review classifications before any rule becomes blocking.
- Workflow audit run: https://github.com/digenova77-ui/dualiscapax-landing/actions/runs/39007608143

## 7. Next inventory actions

- [ ] Classify every landing workflow as test-only, artifact-only, manual deploy, scheduled observer, or state-changing.
- [ ] Inspect the factory-queue and write-check repositories before assigning them roles.
- [ ] Identify the source repository for the `dualiscapax-depth` Worker and map deployed Worker version to commit.
- [ ] Verify API schema from the authoritative handler, not only the browser client.
- [ ] Run read-only health/capability checks from a safe environment; record status, CORS headers, and timestamps.
- [ ] Reconcile current PR heads, exact CI runs, and preview build IDs.
- [ ] Reconcile Replit changes after agent usage returns.
- [ ] Identify the authoritative WebAuthn backend/session store before implementing handoff.
- [ ] Keep production preflight/rollback preparation separate from production execution.
