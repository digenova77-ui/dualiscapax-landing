# Cloudflare Pages publishing path

**Scope:** `dualiscapax.ai` landing site in `digenova77-ui/dualiscapax-landing`.

## Runtime

The repository's root `wrangler.toml` declares `pages_build_output_dir = "."`. The root `_worker.js` is the Cloudflare Pages Advanced Mode request handler; its `env.ASSETS` binding must be provided by the Pages runtime. The separate `dualiscapax-hud/workers/iris-bridge.js` file is not automatically executed by Pages just because it exists in GitHub.

The root Pages worker preserves ordinary landing-page assets and friendly route mappings. **Protected HUD paths currently fail closed** because this handler has no verified receiver-session binding:

- `/holographic-core/v2`, its trailing-slash and `index.html` variants, and `/assets/holographic-hostess-40/hostess.svg` return `503` with `x-dc-iris: session-gate-unverified`.
- `/iris/status` and `/iris/status.json` return `503`, `hud_available: false`, and reason `session-gated-origin-route-not-verified`.
- The Pages fallback does **not** fetch or serve HUD HTML/SVG bytes. The HUD URL mapping in source is not proof of availability.
- The root path `/` remains served by the Pages asset binding; it is not rewritten to the HUD.

This is an intentional fail-closed source state, not proof of live route ownership or a working identity/session path. A protected HUD route must not be opened until the actual origin-join/receiver-session-gated path is implemented and verified in isolated staging.

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

1. Sign in to the Cloudflare dashboard and confirm which Pages project is actually bound to `dualiscapax.ai`. The root Wrangler config names `dualiscapax-web`, while `.github/workflows/pages-direct-upload.yml` currently targets `dualiscapax-landing`. This is an unresolved project-name/source-of-truth conflict; **do not run the dispatch-only upload workflow until an operator confirms the correct project and its token scope**.
2. If the project provides a preview/staging deployment, upload the exact `dist/cloudflare/lander-<commit>.zip` package there first.
3. Check the preview's ordinary public landing routes and explicitly record the expected HUD refusal:
   - `/iris/status` returns `503` with `hud_available: false` and reason `session-gated-origin-route-not-verified`.
   - `/holographic-core/v2` returns `503` with `x-dc-iris: session-gate-unverified`.
   - `/assets/holographic-hostess-40/hostess.svg` returns `503` until the session-gated origin path is verified.
   - `/` continues to serve the ordinary landing page.
4. Inspect Pages deployment logs and any standalone Worker routes for overlap. The independent Worker must not intercept the same paths unexpectedly.
5. Do not promote a preview to production or change DNS unless David explicitly approves that specific production cutover.

The current HUD refusal is expected until the protected route is connected to the real receiver-session gate. Do not treat the `503` as a healthy end-to-end Iris result; it is a deliberate safe fallback. Once an isolated staging path is implemented and verified, update this runbook and its checks to reflect the actual route contract.

## Rollback

Keep the previous successful Pages deployment available in the Cloudflare deployment history. If a preview breaks existing public routes or fails its documented checks, do not promote it. Use Cloudflare's previous deployment rollback mechanism rather than improvising DNS changes.

## Truth boundary

A source commit or locally generated ZIP is not a deployment. A successful Pages deployment is not proof that every Iris capability works. Record the actual deployment URL, commit SHA, checks, and failure responses before reporting a live pass.

## Current rails (Unity floor, Trinity preserved)

As of 2026-10-23:

- **Apex owner:** Cloudflare Pages project bound to `dualiscapax.ai`. The root `wrangler.toml` identifies `dualiscapax-web`; the dispatch-only `.github/workflows/pages-direct-upload.yml` still targets `dualiscapax-landing`. Confirm the real project before running any upload workflow.
- **Root `wrangler.toml`:** `name = "dualiscapax-web"`, `pages_build_output_dir = "."`, and an empty `[previews]` block.
- **Pages handler:** root `_worker.js` (Advanced Mode) owns the source-level Pages fallback. Ordinary landing assets pass through; protected HUD paths and `/iris/status` fail closed until a receiver-session-gated origin route is independently verified.
- **Depth / API workers:** standalone Workers (previously under `server/` or `workers/`) are source-only unless a concrete deployment record proves otherwise. Auto-deploy workflow `workers-live.yml` is retired. The operator-seated deployment process must be confirmed before any deployment; repository source is not proof of live configuration.
- **GitHub Actions:** packaging jobs create artifacts, not production deployments, unless a separate explicit dispatch-only deployment workflow is invoked. Dashboard token and project disconnect/reconnect actions remain operator-seated.
- **Unification rule:** nothing is deleted merely to make the deployment simpler; existing surfaces are transformed or parked. Unity remains the framework identity. Trinity remains the sole authorization gate. Dashboard token and project changes require operator confirmation.

A push to `main` is not a live overwrite. Record the actual Pages deployment, commit SHA, and route checks before any claim of production currency.
