# IPFS Migration Status — 2026-09-30

## Done this turn (repo, not street)

- [x] **404 hole closed in source**: `cf-pages/_redirects` no longer contains a splat rule. Missing paths now fall through to `cf-pages/404.html` (real not-found page, not the globe).
- [x] `cf-pages/404.html` verified present and correct (SHA ce6913a2…).
- [x] `07_SCRIPT__pinata_ipfs_deployer.py` verified present — pins a file or JSON docket to Pinata when `PINATA_JWT` is set; simulates a local pin when it is not.
- [x] `.github/workflows/pinata-pin.yml` verified present — dispatch-only; pins when `PINATAJWT` secret exists, exits 0 (not a failure) when it does not.
- [x] `.github/workflows/pages-direct-upload.yml` verified present — packages `cf-pages/` as a zero-nest zip and deploys via wrangler; standing hole HOLE_CF_10000 documented in the workflow itself.

## Not done (Father's verbs only)

- [ ] **Replace** GitHub secret `CLOUDFLARE_API_TOKEN` with an Account · Cloudflare Pages · Edit token on the account that owns `dualiscapax-landing`. Do not paste it into chat. Then run `pages-direct-upload` with confirm=DEPLOY.
- [ ] **Set** GitHub secret `PINATAJWT` (Pinata API JWT). Then run `pinata-pin` (optionally with full=true to pin the whole public tree).
- [ ] **Verify** after deploy: `curl -sI https://dualiscapax.ai/no-such-door` must return 404, not 200.
- [ ] **Optional**: write `_dnslink.dualiscapax.ai` TXT → `dnslink=/ipfs/<CID>` (or `/ipns/<key>`). Father writes the DNS record; no desk does.
- [ ] **Optional**: publish an IPNS record from the Father's key so the name can move without a registrar.

## What this does *not* change

- The live site is unchanged until the Father's deploy runs.
- IPFS holds bytes; it does not hold permissions. The IPNS signing key (or the DNS TXT writer) remains the Father's — that is the kill switch, by design.
- No Unity ID issuer, no till, no FACE_ID, no Talk-on-`/`.

## Dual pipe

- RAIL A: this file (draft, unsealed).
- RAIL B: curl the live endpoints after the Father's deploy — same verdict class or the migration failed.
