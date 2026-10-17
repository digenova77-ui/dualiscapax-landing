# Unknown Bucket — Legacy Git-Connected Build Rail

Status: SHADOW COPY ONLY — NOT ACTIVE AUTHORITY
Snapshot branch: `shadow/legacy-git-builds-2026-10-17`
Source branch at capture: `main`
Source commit at capture: `bf1d1ae238ea1e568eeaf369f07f0b86d538cb22`

## Purpose
Preserve the existing repository state so the former Git-connected build arrangement can be studied or re-implemented if explicitly authorized. This snapshot is not a deployment instruction and does not supersede Trinity.

## Preserved items
- Root `wrangler.toml` and its `[previews]` block.
- `.github/workflows/workers-live.yml` (already retired/no deploy).
- `.github/workflows/deploy.yml` (already retired/no publish).
- `.github/workflows/package-cloudflare-pages.yml` (artifact packaging/validation only).
- `docs/ops/ENVIRONMENT.md` and the existing root `_worker.js`.
- All other files present on the source commit, retained by the branch snapshot.

## Authority boundary
Trinity is the governing authorization gate. No repository artifact, CI status, build token, or deployment integration independently grants production-write authority. Preserve validation, credential exclusions, integrity checks, and fail-closed behavior unless Trinity-authorized replacements are implemented and verified.

## Live-state limitation
Creating this shadow branch does not disable Cloudflare Workers Builds or GitHub Pages/other deployment integrations. Those are external service settings and must be disabled at their respective control planes, then verified from deployment history and live route checks. Do not report them disabled until that verification exists.
