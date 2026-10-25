# Cloudflare Pages publishing path

**Scope:** `dualiscapax.ai` landing site in `digenova77-ui/dualiscapax-landing`.

## Runtime

The repository's root `wrangler.toml` declares `pages_build_output_dir = "."`. The root `_worker.js` is the Cloudflare Pages Advanced Mode request handler; its `env.ASSETS` binding is provided by the Pages runtime. A separate Worker build must not assume that a Pages configuration is a standalone Workers Preview configuration.

The HUD HTML route fetches the current HUD repository's raw GitHub source at request time. A failed upstream fetch returns 502 rather than a fabricated success. This is a route bridge, not proof that the full Iris backend, speech, camera, API, or durable refusal ledger is live.

## Build the upload package

Run from the landing repository checkout, on the branch/commit intended for review:

```sh
python3 scripts/pack_hierarchical_flat_zip.py --lander --check
python3 scripts/pack_hierarchical_flat_zip.py --lander
```

The packer uses Git-tracked regular files, preserves website-relative paths, puts `_worker.js`, `wrangler.toml`, and `index.html` at the ZIP root, excludes repository-control/engineering paths and common credential/private-key names, checks required files, duplicate paths and ZIP CRC, and writes `dist/cloudflare/lander-<commit>.zip` plus a SHA-256 sidecar. It does not upload or deploy anything.

## Cloudflare project type and preview command

There are two different Cloudflare deployment products; do not conflate their preview commands.

- **Cloudflare Pages** uses `pages_build_output_dir = "."` and the Pages publishing command `wrangler pages deploy <directory> --project-name=dualiscapax-landing`. The repository's `.github/workflows/pages-deploy.yml` uses this path.
- **Cloudflare Workers Builds Preview** invokes `npx wrangler preview` and requires a Workers `previews` configuration block. Preview bindings should use isolated/staging resources, especially for Durable Objects. Do not add a Workers `[previews]` block to this Pages configuration as a blind fix.

### Observed failure — 2026-10-25

Cloudflare's connected build log ran `npx wrangler preview` and failed with:

```text
Your Wrangler configuration needs a `previews` block to run this command.
```

The same log warned that the Worker uses Durable Objects and they are not included in the suggested Preview configuration. The checked-in root `wrangler.toml` has `pages_build_output_dir = "."`, two Durable Object bindings, and a comment explicitly warning against adding `[previews]` because Pages rejects it. Therefore this is a **Cloudflare project/build-setting mismatch to resolve**, not a reason to alter the Pages config blindly.

Dashboard-side resolution:
1. Open **Workers & Pages** and select the project associated with the failed build.
2. Confirm whether the failing project is a **Pages project** or a **Worker connected to Workers Builds**.
3. If the project is intended to publish the Pages site, stop the Worker Preview command for that Pages project and use the Pages deploy/publish rail instead.
4. If a standalone Worker Preview is intentionally required, give it a separate Worker-specific Wrangler configuration with a real entry point and Preview-safe bindings/resources; do not point its preview at production resources.
5. Re-run a preview and capture its URL, commit, build result, and route probes before calling it passed.

The dashboard settings are not editable through the repository's connected GitHub tool. No dashboard setting, DNS, secret, or production deployment is changed by this document.

## Manual Cloudflare Pages upload

1. Open the Pages project actually bound to `dualiscapax.ai` and confirm its identity before continuing.
2. Use a preview/staging deployment first if available. Upload the exact `dist/cloudflare/lander-<commit>.zip` package using the Pages interface.
3. Verify the preview serves `/` and existing routes, including `/iris/status`, `/holographic-core/v2`, and `/assets/holographic-hostess-40/hostess.svg`.
4. Check deployment logs and independent Worker routes for overlap. A failed upstream fetch returning 502 must not be treated as a healthy Iris state.
5. Do not promote a preview to production or change DNS without explicit approval.

## Rollback and truth boundary

Keep the previous successful Pages deployment available. If a preview fails, do not promote it; use Cloudflare's prior deployment rollback mechanism rather than improvising DNS changes.

A source commit or generated ZIP is not a deployment. A successful Pages deployment is not proof that every Iris capability works. Record the actual deployment URL, commit SHA, route checks, and failure responses before reporting a live pass.

## Current rails

- **Apex owner:** Cloudflare Pages project bound to `dualiscapax.ai`; manual ZIP is the documented fallback/publishing path.
- **Root `wrangler.toml`:** Pages configuration; it currently has no `[previews]` block. Do not claim that block is present or that the Workers Preview build is fixed.
- **Pages handler:** root `_worker.js` (Advanced Mode); apex `/` falls through to Pages assets.
- **Depth/API Workers:** standalone Workers remain separate source/deployment surfaces. A file existing in GitHub does not mean it is deployed.
- **GitHub Actions:** `.github/workflows/pages-deploy.yml` defines a Pages deployment workflow with route checks, but its existence alone does not prove it has run successfully or that the public apex reflects its output.
- **Safety boundary:** dashboard token, project type, and project connection settings require operator access. Do not change production DNS or promote an unverified build.

A push to `main` is not proof of live deployment. Record the actual Pages deployment, commit SHA, and route checks before claiming production currency.
