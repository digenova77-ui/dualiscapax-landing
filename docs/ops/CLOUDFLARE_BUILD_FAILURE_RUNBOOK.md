# Cloudflare build and deployment: source of truth

**Status:** diagnostic/runbook. This document does not claim the current Cloudflare build is fixed.

**Scope:** `digenova77-ui/dualiscapax-landing`, the Pages landing surface associated with `dualiscapax.ai`, and the separate staging Iris Worker. Do not conflate a Pages deployment with the Iris Worker deployment.

## Executive summary

There are multiple deployment mechanisms in this repository. A green GitHub Actions run or a Ready Vercel preview does not establish that Cloudflare deployed the same commit. Cloudflare has reported failed preview builds for commits in PR #187, including `e126f79`. The exact underlying Cloudflare build error has not yet been retrieved in the available repository evidence; therefore a root cause must not be guessed or marked fixed.

The repository's documented preferred production publishing rail is a tracked-file ZIP uploaded through the Cloudflare Pages dashboard, followed by explicit route verification. The repository also has a manual GitHub Actions workflow that packages, token-preflights, deploys via Wrangler, and checks live routes. Cloudflare's Git-connected Workers Builds/preview pipeline is a distinct rail and has historically failed independently. Determine which project/build system produced a failure before repairing it.

## Surface and deployment rails

### A. Pages landing site

- Root `_worker.js` is the Cloudflare Pages Advanced Mode handler.
- Root `wrangler.toml` currently declares `name = "dualiscapax-landing"` and `pages_build_output_dir = "."`.
- `env.ASSETS` is supplied by the Pages runtime; other paths fall through to Pages assets.
- `scripts/pack_hierarchical_flat_zip.py --lander --check` validates the tracked-file payload.
- `scripts/pack_hierarchical_flat_zip.py --lander` creates a commit-specific ZIP and SHA-256 sidecar. It does **not** deploy.
- `.github/workflows/pages-deploy.yml` is a manual workflow. It checks routes and matching tests, packages the ZIP, validates `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, uploads via `wrangler pages deploy`, then runs live route checks.
- `docs/ops/ENVIRONMENT.md` describes manual dashboard ZIP upload as the preferred production rail and requires explicit approval before production promotion or DNS changes.

### B. Git-connected Cloudflare build/preview

This is not the same thing as the manual Pages ZIP flow. Cloudflare's PR bot reported failures for commits in PR #187. Do not infer the cause from Vercel's status, from a successful GitHub test job, or from the fact that a commit exists.

For each failure, record:
1. commit SHA and UTC time;
2. Cloudflare product surface (Pages build vs Workers Builds);
3. project/service name and build ID;
4. exact first fatal error and surrounding log lines;
5. build command, root directory, output directory, and config file actually used;
6. whether the failure occurred during dependency install, config validation, bundling, upload, or runtime verification.

Then make the smallest change that addresses the observed error, rerun the same build, and verify the same commit is green. Never delete/recreate the service or change DNS merely to silence a build error.

### C. Iris runtime Worker

- `workers/iris-runtime/worker.mjs` is a separate staging Worker.
- `workers/iris-runtime/wrangler.toml` names `iris-runtime-staging` and contains placeholder service names for identity, Trinity, memory, and model provider bindings.
- It requires configured Worker secrets/bindings before the runtime can be considered operational.
- A passing Node test imports the handler and checks selected fail-closed cases; it does not prove the staging service is deployed or that placeholder services exist.
- Do not point production routes at this staging worker without explicit review and verified bindings.

## Evidence from the current PR investigation

- PR: [#187 — Add executable Diamond claim gates](https://github.com/digenova77-ui/dualiscapax-landing/pull/187)
- Latest expanded test commit examined: `e126f794216c4bc373a114978092edcec8a06403`.
- GitHub Actions results retrieved for the preceding commit `b1daef57e329b7a0b61e80f5e2417b2805035753`: Diamond Claim Gates (both jobs) and Iris Runtime Fail-Closed Tests completed successfully. Existing Iris authorize CI, Iris/Trinity test gauntlet, and inspected Elite CI jobs also completed successfully on that earlier commit.
- Those green results do not establish that the newly expanded tests on `e126f79` passed.
- Vercel preview statuses for `e126f79` reported success/Ready; that is evidence only for the Vercel preview builds.
- Cloudflare's bot reported the Cloudflare preview build failed for `e126f79`. Its log link is in the PR timeline and requires authorized dashboard access. The actual fatal log line is not available in the repository evidence reviewed for this runbook.
- No claim is made here that Cloudflare is fixed or that production was deployed.

## Safe repair procedure

1. Open the exact Cloudflare build log linked from the failed PR comment.
2. Copy the first fatal error, build ID, project/service, command and config path into the incident record. Redact tokens, account secrets and sensitive environment values.
3. Classify the failure:
   - **Configuration validation:** compare the config actually selected by the build with Cloudflare Pages/Workers product requirements. Do not transplant Workers-only keys into Pages config.
   - **Dependency/build command:** reproduce the exact command and pinned toolchain in CI before changing deployment settings.
   - **Credentials/permissions:** verify secret presence and token scope from the dashboard/CI secret metadata without printing the token. Rotate only if exposure or revocation is confirmed.
   - **Upload/publish:** verify project target, output directory, and the package's root paths; do not change DNS as a workaround.
   - **Runtime route check:** inspect the failed route response and deployment version; preserve the previous known-good deployment.
4. Make a minimal change on a branch and add a regression check where the failure is deterministic.
5. Re-run the exact failing build and all applicable unit/integration checks.
6. Verify the preview routes: `/`, `/iris/status`, `/holographic-core/v2`, and `/assets/holographic-hostess-40/hostess.svg`. An unavailable upstream must be an explicit failure (e.g. 502), never fabricated success.
7. Promote only with explicit production approval. Preserve the previous deployment for rollback.
8. Record commit SHA, build ID, deployment URL, route results, and rollback reference.

## Completion criteria

The incident is closed only when all of the following are evidenced:

- [ ] Exact Cloudflare fatal error recorded and explained in plain language.
- [ ] Root cause tied to the correct project/build rail.
- [ ] Minimal fix committed with a regression check or a documented reason a test is not feasible.
- [ ] Same Cloudflare build rail passes on the repaired commit.
- [ ] Applicable GitHub test suites pass on that same commit.
- [ ] Preview routes and failure paths verified against the actual deployed preview.
- [ ] Production deployment status checked separately; no unapproved promotion or DNS change.
- [ ] This runbook updated with the confirmed cause, repair, evidence links, and rollback steps.

## Non-negotiable boundaries

- No secrets in Git, test fixtures, logs, or this document.
- Trinity remains the sole authorization authority; deployment success does not grant authorization.
- A build pass is not runtime proof; a runtime pass is not universal security proof.
- Never report a fix based only on a new commit or on another provider's green status.
