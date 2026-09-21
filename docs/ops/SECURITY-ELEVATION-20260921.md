# Security elevation — 2026-09-21

Paper in git. Live apex still needs Seat pack (Cloudflare zip). Checkout stays closed.

## What changed in this branch

1. `_headers` and `cf-pages/_headers`: HSTS, COOP, CORP; drop TeamSnap, Pollinations, `api.x.ai`, cdnjs, jsDelivr from CSP; camera/mic/display-capture off at the lander.
2. `js/api-config.js`: `?api=` only accepted if the origin is allowlisted.
3. `secret-scan.yml` widened. `security.yml` added as the missing badge target.
4. D1 projection law written next to `schema.sql`. stripe-fulfill entitlements schema stays dark.

## Still Seat-only (not this PR)

- Pack zip + Cloudflare upload so apex actually serves the new headers.
- Zone HSTS / drop any `Access-Control-Allow-Origin: *` transform on HTML.
- `www` 522 (DOMAIN.md).
- Missing favicon / `brand/logo-mark-light.svg` 404s.
- Live iris-gateway ≠ git (deploy drift). Do not hang new work on workers-live.
- Code scanning not enabled on the repo.
- `unsafe-inline` remains because the lander still inlines script/style. Removing it is a hall rewrite — out of scope.
