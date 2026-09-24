# DEPLOY RECEIPT — pending first closed loop

**Opened:** 2026-09-24T22:08-04:00
**Law:** BULLETIN/README.SIGNING.md SIGNED
**DNS:** not touched

## Expected path

1. Factory reads README.SIGNING.md
2. Factory runs EXECUTE_DEPLOY.sh
3. Copy newdeploy.zip from Drive bulletin
4. Check SHA-256 `3ce42dc1c0303944e8761dd400df10f97adf2df072eb8a09017a906104a15678`
5. unzip -o
6. wrangler pages deploy → project `dualiscapax-landing`
7. curl https://dualiscapax.ai/

## Known hole (do not hide)

`pages-direct-upload.yml` run 36044218651 failed wrangler with Cloudflare API authentication error **10000**. Token exists; it cannot write Pages project `dualiscapax-landing`.

Until that token has **Account · Cloudflare Pages · Edit**, this receipt stays `LIVE=NO`.

## Result

- LIVE: NO
- LIVE_HTTP_OK: 0
- Reason: waiting first successful wrangler handoff after token fix or manual CF upload of the checked zip
