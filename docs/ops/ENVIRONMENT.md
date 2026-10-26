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

1. Sign in to the Cloudflare dashboard and open **Workers & Pages**. Identify the Pages project actually bound to `dualiscapax.ai`; the repository workflow currently targets `dualiscapax-landing`. Older notes referred to `dualiscapax-web`, so do not assume these names refer to the same project.
2. Use a **preview/staging deployment** first if the verified Pages project provides one. Upload the exact `dist/cloudflare/lander-<commit>.zip` package using that Pages project's upload/deployment interface.
3. Confirm the deployed preview serves `/` and existing routes correctly, then check:
   - `/iris/status` returns JSON with `runtime: cloudflare-pages-advanced-mode`.
   - `/holographic-core/v2` returns the HUD page and response header `x-dc-iris: pages-bridge`.
   - `/assets/holographic-hostess-40/hostess.svg` returns SVG.
   - An unavailable upstream returns an explicit 502; it must not be treated as an accepted/healthy Iris state.
4. Check the Pages deployment logs and any standalone Worker routes for overlap. The independent Worker must not intercept the same paths unexpectedly.
5. Do not promote the preview to production or change DNS unless David explicitly approves that production cutover.

## Rollback

Keep the previous successful Pages deployment available in the Cloudflare deployment history. If the preview fails any existing route or the checks above, do not promote it. Use Cloudflare's previous deployment rollback mechanism rather than improvising DNS changes.

## Truth boundary

A source commit or locally generated ZIP is not a deployment. A successful Pages deployment is not proof that every Iris capability works. Record the actual deployment URL, commit, checks, and failure responses before reporting a live pass.

## Current rails (Trinity preserved)

Audit date: 2026-10-25. The source of truth for the repository's current workflow is `.github/workflows/pages-deploy.yml`; the checked-in root `wrangler.toml` names `dualiscapax-landing`, sets `pages_build_output_dir = "."`, and contains no `[previews]` block.

- **GitHub Actions Pages rail:** Manual `workflow_dispatch`; runs deterministic route/unit checks, packages a lander ZIP, validates Cloudflare credentials without intentionally printing them, deploys using `wrangler pages deploy`, then probes public routes. This is an actual deploy workflow by source definition, not proof of a successful recent run.
- **Dashboard Workers Builds rail:** The reported build error came from `npx wrangler preview` and asked for `[previews]`. That command is not the same as the Pages deploy workflow. Do not add `[previews]` to the root Pages config; first confirm whether the dashboard project is a Pages project or a separate Worker/Workers Builds project.
- **Manual ZIP rail:** The packer creates and validates an artifact but does not deploy it. Before manual upload, verify the actual Pages project bound to `dualiscapax.ai`. Older notes used `dualiscapax-web`, while the current workflow and root config use `dualiscapax-landing`; this project-name discrepancy remains to be confirmed in the dashboard.
- **Standalone Workers:** Source files in the repository are not automatically deployed merely because they exist. A successful preview or CI check does not prove that standalone Workers, Iris backend capabilities, or the public apex are current.
- **Production boundary:** No DNS, dashboard, secrets, or live-service changes are authorized by this documentation. Record the actual deployment URL, commit SHA, route checks, and failure responses before reporting a live pass.

Do not treat a push to `main`, a ready preview, or a locally generated ZIP as proof of production deployment.
