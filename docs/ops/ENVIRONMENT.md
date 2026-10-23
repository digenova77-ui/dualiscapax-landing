# Cloudflare Pages publishing path

**Scope:** `dualiscapax.ai` landing site in `digenova77-ui/dualiscapax-landing`.

## Runtime

The repository's `wrangler.toml` declares `pages_build_output_dir = "."`. The root `_worker.js` is the Cloudflare Pages Advanced Mode request handler; its `env.ASSETS` binding must be provided by the Pages runtime. The separate `dualiscapax-hud/workers/iris-bridge.js` file is not automatically executed by Pages just because it exists in GitHub.

The root Pages worker now explicitly routes:
- `/holographic-core/v2`, `/holographic-core/v2/`, and `/holographic-core/v2/index.html` to the HUD HTML source.
- `/assets/holographic-hostess-40/hostess.svg` to the HUD asset.
- `/iris/status` and `/iris/status.json` to a content-free Pages runtime status.
- Other requests, including `/`, to the existing Pages asset binding.

The HUD HTML route fetches the current HUD repository's raw GitHub source at request time. A failed upstream fetch returns 502 rather than a fabricated success. This is an initial route bridge, not a claim that the full Iris backend, speech, camera, API, or durable refusal ledger is live.

## Build the upload package

Run from the landing repository checkout, on the branch/commit you intend to publish:

```sh
python3 scripts/pack_hierarchical_flat_zip.py --lander --check
python3 scripts/pack_hierarchical_flat_zip.py --lander
```

The packer:
- Uses only Git-tracked regular files, not untracked local files.
- Preserves website-relative paths and puts `_worker.js`, `wrangler.toml`, and `index.html` at the ZIP root.
- Excludes repository-control and engineering-only paths (`.github/`, `docs/`, `scripts/`), plus common credential/private-key names; these must never be part of the public Pages payload.
- The package validator fails if any excluded internal path appears in the archive.
- Excludes common credential/private-key names and local dependency/cache directories.
- Checks for required files, duplicate archive paths, and ZIP CRC errors.
- Writes `dist/cloudflare/lander-<commit>.zip` and a matching `.sha256` sidecar.
- Does not upload or deploy anything.

Check the printed commit and SHA-256 before using the archive. The output ZIP is built from the Git-tracked checkout, so commit any intended changes before packaging.

## Manual Cloudflare Pages upload

1. Sign in to the Cloudflare dashboard and open **Workers & Pages → dualiscapax-web** (confirm this is the project actually bound to `dualiscapax.ai` before continuing).
2. Use a **preview/staging deployment** first if the project provides one. Upload the exact `dist/cloudflare/lander-<commit>.zip` package using the Pages upload/deployment interface.
3. Confirm the deployed preview serves `/` and existing routes correctly, then check:
   - `/iris/status` returns JSON with `runtime: cloudflare-pages-advanced-mode`.
   - `/holographic-core/v2` returns the HUD page and response header `x-dc-iris: pages-bridge`.
   - `/assets/holographic-hostess-40/hostess.svg` returns SVG.
   - An unavailable upstream returns an explicit 502; it must not be treated as an accepted/healthy Iris state.
4. Check the Pages deployment logs and any standalone Worker routes for overlap. The independent Worker must not intercept the same paths unexpectedly.
5. Do not promote the preview to production or change DNS unless the project maintainer explicitly approves that production cutover.

## Rollback

Keep the previous successful Pages deployment available in the Cloudflare deployment history. If the preview fails any existing route or the checks above, do not promote it. Use Cloudflare's previous deployment rollback mechanism rather than improvising DNS changes.

## Truth boundary

A source commit or locally generated ZIP is not a deployment. A successful Pages deployment is not proof that every Iris capability works. Record the actual deployment URL, commit, checks, and failure responses before reporting a live pass.

## Current publishing paths (Unity floor, Trinity preserved)

As of 2026-10-17:

- **Apex owner:** Cloudflare Pages project bound to `dualiscapax.ai`. Preferred publish path is the manual ZIP produced by `package-cloudflare-pages` (or local `pack_hierarchical_flat_zip.py`). Git-connected Workers Builds on `dualiscapax-landing` / `dualiscapax-depth` have been observed failing (missing `previews` block resolved in root `wrangler.toml`; stale/rolled build token remains a dashboard-only repair). Automatic Git builds are not the production publishing path.
- **Root `wrangler.toml`:** `name = "dualiscapax-web"`, `pages_build_output_dir = "."`, empty `[previews]` block present so `npx wrangler preview` can run if Builds is retained.
- **Pages handler:** root `_worker.js` (Advanced Mode) owns route bridge for HUD paths and `/iris/status`. Apex `/` stays on Pages assets.
- **Depth / API workers:** Standalone Workers (previously under `server/` or `workers/`) are source-only. Auto-deploy workflow `workers-live.yml` is retired. An operator deploys manually with the local `wrangler` CLI. `dualiscapax-depth.digenova77.workers.dev` currently returns 404.
- **GitHub Actions:** Majority of historical workflows are `disabled_manually`. Active ones include packaging (artifact only, not deploy), deterministic checks, and smoke tests. They do not promote to the live apex.
- **Unification rule:** Nothing is deleted; existing surfaces are transformed or parked. Unity remains the sole framework identity. Trinity, Climate, and prior content are preserved underneath. Dashboard token and project disconnect/reconnect actions remain manual operator actions; this repository records the source of truth and the preferred manual path.

A push to `main` is not a live overwrite. Record the actual Pages deployment, commit SHA, and route checks before any claim of production currency.
