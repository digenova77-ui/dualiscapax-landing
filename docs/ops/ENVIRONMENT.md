# Cloudflare Pages publishing path

**Scope:** the DualisCapax landing surface and the separate Iris runtime. This file describes repository configuration; it does not assert that any deployment is currently healthy.

## Deployment rails — keep them separate

1. **Cloudflare Pages landing site:** root `_worker.js` is the Pages Advanced Mode request handler. It must forward ordinary asset requests to `env.ASSETS.fetch(request)`. The Pages Wrangler config is `wrangler.toml`, with `pages_build_output_dir = "."`.
2. **Manual Pages deploy workflow:** `.github/workflows/pages-deploy.yml` is manually triggered. It runs route/tests, packages tracked files, checks Cloudflare secrets without printing them, deploys the ZIP with `wrangler pages deploy --project-name=dualiscapax-landing`, and checks live routes. A successful workflow is not proof until route checks pass.
3. **Cloudflare Git-connected Pages build:** a separate build/deploy mechanism. A failure here does not prove that the manual ZIP workflow or a Vercel preview failed.
4. **Cloudflare Workers Builds:** another distinct rail. The Cloudflare PR bot has reported failed builds for Worker service `dualiscapax-landing` on commits including `e126f79` and `bcd150d`. This must not be treated as a Pages deployment result.
5. **Iris runtime staging Worker:** `workers/iris-runtime/worker.mjs`, configured by `workers/iris-runtime/wrangler.toml`. Its placeholder service bindings must be provisioned and verified independently before the runtime can be called operational.

## Project-name discrepancy — do not guess

The root `wrangler.toml` and `.github/workflows/pages-deploy.yml` both target `dualiscapax-landing`. Historical notes in this document previously named `dualiscapax-web` as the project bound to `dualiscapax.ai`. Those claims conflict. The repository alone cannot prove which Cloudflare Pages project currently owns the live custom domain.

**Before any deploy or config rename:** in the Cloudflare dashboard, verify which Pages project is bound to `dualiscapax.ai`, whether it is Git-connected or Direct Upload, and whether a separate Worker service named `dualiscapax-landing` has Workers Builds enabled. Record the project/service IDs and build settings. Then update this file and the deployment workflow together if a mismatch is confirmed. Do not rename or delete projects, disconnect integrations, alter DNS, or rotate tokens based on inference.

Cloudflare's official Pages guidance says to verify an existing Wrangler configuration against the dashboard before treating it as production source of truth. See [Wrangler configuration for Pages](https://developers.cloudflare.com/pages/functions/wrangler-configuration/) and [Debugging Pages builds](https://developers.cloudflare.com/pages/configuration/debugging-pages/).

## Current evidence and unresolved issue

- PR #187: https://github.com/digenova77-ui/dualiscapax-landing/pull/187
- Cloudflare Pages reported a deployment failure for commit `bcd150d`: https://dash.cloudflare.com/?to=/725a9382123c9f12a01e3eda718f6436/pages/view/dualiscapax-landing/1d5bd344-40a0-497a-977d-74c92943bda8
- Cloudflare Workers Builds reported a failure for the same commit: https://dash.cloudflare.com/?to=/725a9382123c9f12a01e3eda718f6436/workers/services/view/dualiscapax-landing/production/builds/bb9776a8-df81-4937-8bee-85acca4f2498
- The exact fatal log lines are not available from the GitHub PR timeline. Therefore, the precise build failure cause remains unconfirmed. Do not mark it fixed or infer the cause from a Vercel preview or passing GitHub unit tests.
- A docs-only commit also received a Cloudflare Workers Builds failure, which is evidence that this is not simply a failing Iris unit test. It does not, by itself, prove the cause.
- **High-priority existing lead for Workers Builds:** the pre-reconciliation version of this repository's `docs/ops/ENVIRONMENT.md` explicitly recorded that the Workers Builds token had been stale/rolled and required a dashboard-only repair. Cloudflare's official troubleshooting guide documents the exact failure mode: a build token that was deleted or rolled must be replaced in Workers Builds settings. Treat this as the leading hypothesis for the Workers Builds rail, not as a confirmed diagnosis until the build log shows that error. See https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/.
- **Separate Pages lead:** Pages Git integration authorization can independently fail. Cloudflare's troubleshooting guide says to check for disconnected/suspended Git installations or repository access warnings. This must be checked separately from the Workers Builds token. See https://developers.cloudflare.com/pages/configuration/git-integration/troubleshooting/.
- Latest observed failures on PR #188 commit `8e726a0`: Pages log https://dash.cloudflare.com/?to=/725a9382123c9f12a01e3eda718f6436/pages/view/dualiscapax-landing/38ae0d09-3f8b-422d-a0ef-1e91995617dd and Workers Builds log https://dash.cloudflare.com/?to=/725a9382123c9f12a01e3eda718f6436/workers/services/view/dualiscapax-landing/production/builds/0865638b-1aea-4472-9ff1-d7ff4197e82f.

## Safe diagnosis and repair

1. Open the exact failing build log in the Cloudflare dashboard. Capture product surface, project/service name, build ID, selected config file, build command, root/output directories, and the first fatal error plus surrounding lines. Redact credentials and secrets.
2. If the **Pages build** fails, first inspect the first fatal log line. Check Git integration authorization and repository access warnings, then root/build/output configuration, Pages Wrangler schema, and runtime bindings. Pages Advanced Mode requires a root `_worker.js` in the output and forwarding of normal asset requests to `env.ASSETS.fetch(request)`.
3. If **Workers Builds** fails, first check whether the log says the selected build token was deleted/rolled. If so, an authorized operator must create/select a valid token in Workers Builds settings and retry the build; never paste the token into GitHub, this PR, or chat. Then check which config and build command the service is actually using. Do not point a standalone Worker build at a Pages-only configuration or blindly add Workers-only fields to the Pages config. If the service is accidental/obsolete, pause or disconnect that rail only after confirming it does not own production traffic.
4. If the **manual Pages workflow** fails, use its own GitHub Actions logs to determine whether route tests, packaging, token preflight, upload, or live verification failed. Do not print token values. A missing/revoked token should be repaired in secret settings, not committed to Git.
5. Make the smallest targeted change on a branch, add a regression check where practical, rerun the exact failing rail, then verify the preview.
6. Test `/`, `/iris/status`, `/holographic-core/v2`, and `/assets/holographic-hostess-40/hostess.svg`. An unavailable upstream must return an explicit error such as 502; it must not be reported as healthy.
7. Promote only after explicit production approval. Preserve the previous successful deployment for rollback.

## Package and manual Pages workflow

From the intended, committed checkout:

```sh
python3 scripts/pack_hierarchical_flat_zip.py --lander --check
python3 scripts/pack_hierarchical_flat_zip.py --lander
```

The packer uses tracked files, validates required root files, duplicate paths and ZIP CRCs, excludes engineering-only paths and common credential/private-key names, and creates a ZIP plus SHA-256 sidecar. It does not deploy. Inspect the commit SHA and checksum before upload.

The manual workflow is invoked through GitHub Actions → Pages deploy → Run workflow. It deploys to `dualiscapax-landing` and then verifies `https://dualiscapax.ai`. Do not run it until the dashboard project/domain binding has been confirmed and production deployment is approved.

## Route and authorization boundaries

- Root `_worker.js` handles Pages Advanced Mode routes and forwards static assets through `env.ASSETS`.
- The separate `dualiscapax-hud/workers/iris-bridge.js` file is not automatically executed by Pages just because it exists in Git.
- The HUD bridge is not proof that full Iris speech, camera, API, memory, or refusal-ledger capabilities are live.
- Trinity remains the sole authorization authority. A build pass is not authorization, a unit-test pass is not live-runtime proof, and a deployment is not universal security proof.
- No secrets in Git or logs. No unapproved DNS changes, production promotions, project deletions, or credential changes.

## Closure criteria

- [ ] The custom-domain owner and each deployment rail are verified in the Cloudflare dashboard.
- [ ] The first fatal error is recorded and tied to the correct build rail.
- [ ] A minimal repair and regression check are committed.
- [ ] The same failing rail passes on the repaired commit.
- [ ] Applicable GitHub checks pass on that commit.
- [ ] Preview routes and explicit failure paths are verified against the deployed preview.
- [ ] Production status is checked separately; no unapproved promotion or DNS change.
- [ ] The confirmed root cause, evidence links, and rollback procedure are recorded here.
