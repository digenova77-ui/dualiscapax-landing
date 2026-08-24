# dualiscapax.ai cutover (do this in Cloudflare)

GitHub Pages is ready to serve this repo as the modern public beta.
The CNAME file in this repo is set to: dualiscapax.ai

## Why .ai still shows the old site
Cloudflare is still proxying the LEGACY deployment. Until DNS (and any old Pages project) points here, dualiscapax.ai will not change.

## Cloudflare steps (required once)
1. Log into Cloudflare for zone dualiscapax.ai
2. Preferred: Workers & Pages → Create → Connect GitHub repo digenova77-ui/dualiscapax-landing
   - Build command: (empty)
   - Output directory: /
   - Custom domains: dualiscapax.ai and www.dualiscapax.ai
3. OR DNS only to GitHub Pages:
   - www CNAME → digenova77-ui.github.io (proxied or DNS only)
   - Apex: CNAME flatten to digenova77-ui.github.io OR GitHub A records
4. Disable / delete the OLD Pages project or origin that still holds the residual-tax landing
5. Remove Page Rules / Workers that force the old site
6. Caching → Purge Everything
7. Wait 1–5 minutes; test https://dualiscapax.ai in incognito

## Verify success
Page title should include: Financial · Emerging AI · Networked Access
Not: Residual-Tax Software Control Plane

## Share until then
https://digenova77-ui.github.io/dualiscapax-landing/
