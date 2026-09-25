# RECEIPT — pages-direct-upload still BLOCKED on CF 10000

**CASE_ID:** `ED-CF-LOOP-20260924-PAGES-TOKEN-10000`
**FINAL_STATE:** **BLOCKED** (code hygiene landed; deploy still needs operator token)
**PROBED:** run 36044218651 (2026-09-24T18:52Z) job Deploy to Cloudflare Pages
**No secret values in this file.**

## Exact break

Package job: GREEN. 497 files. `cf-pages-production.zip: OK`.
Wrangler: RED.

```
Authentication error [code: 10000]
GET /accounts/***/pages/projects/dualiscapax-landing
Unable to retrieve email … missing User→User Details→Read
Unable to get membership roles
```

`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are injected. Empty-check does not fire. Cloudflare authorization fails. Same hole as `docs/ops/RECEIPT-ED-CF-LOOP-20260918.md`. Last wrangler success on this rail: run 25 (2026-09-21, branch factory-floor-v01). Runs 26–37 fail.

## Code landed this receipt

`.github/workflows/pages-direct-upload.yml`
- pin `wrangler@3.112.0` (3.114.0 logs nodejs_compat broken)
- map wrangler non-zero to `HOLE_CF_10000` instead of a raw dump

This does **not** mint Pages Edit. Agents cannot log into Cloudflare.

## Operator close (do not paste tokens here)

1. https://dash.cloudflare.com/profile/api-tokens → Create Token
2. Account · Cloudflare Pages · Edit
3. Account · Account Settings · Read
4. User · User Details · Read (optional; kills the email warning)
5. Resource = the account that owns project `dualiscapax-landing`
6. GitHub → repo Settings → Secrets → Actions → replace `CLOUDFLARE_API_TOKEN`
7. Actions → `pages-direct-upload` → Run workflow → type `DEPLOY`
8. Closure: wrangler prints a deployment id AND `https://dualiscapax.ai/` 200 AND curl-gate paths you still claim are seats

Kitchen A (Git Connect this repo to the same Pages project) also closes the loop without an Actions token. Do not run A and B on purpose at the same time.
