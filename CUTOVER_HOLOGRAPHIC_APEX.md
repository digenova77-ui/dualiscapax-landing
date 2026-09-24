# Cutover 2026-09-24 — holographic apex

Operator (David) asked to dump the live cafe Talk/Camera plate and put the isolated holographic RTE live.

## Kept
- Encyclopedia routes and 06_ENCYC_* corpus
- CNAME, _headers, _redirects, hall/, research/, holographic-core/v2

## Changed
- `index.html` (repo root) = DCLM-RTE-V2.0.4
- `cf-pages/index.html` = same file (this is the Cloudflare Pages zip root)
- Old Meet Iris cafe plate archived as `index.cafe-plate.archived.html`

## Live publish
GitHub Pages rail is retired. Live site is Cloudflare Pages project `dualiscapax-landing` from `cf-pages/`.
Trigger `.github/workflows/pages-direct-upload.yml` with confirm=DEPLOY after merge.
Then purge Cloudflare cache for `/`.
