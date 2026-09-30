# Dual-pipe audit — 2026-09-30 11:09 EDT

Coordinator: Eve (this mill). Father holds kill switch. No deploy from this file.

## Rail B fetch (this hour)

| URL | HTTP | title | first 8kB |
|---|---|---|---|
| https://dualiscapax.ai/ | 200 | Base 3D — DualisCapax | 7990 |
| https://dualiscapax.ai/iris.html | 200 | Base 3D — DualisCapax | 7990 |
| https://dualiscapax.ai/iris | 200 | Base 3D — DualisCapax | 7990 |
| https://dualiscapax.ai/no-such-door-xyz | 200 | Base 3D — DualisCapax | 7990 |
| https://dualiscapax.ai/404.html | 200 | Base 3D — DualisCapax | 7990 |

DNS (dns.google):
- A: 104.21.71.209 / 172.67.171.186 (Cloudflare)
- NS: aron.ns.cloudflare.com / kurt.ns.cloudflare.com
- `_dnslink.dualiscapax.ai` TXT: NXDOMAIN (Status 3)
- apex TXT: Google site verification + SPF only

## Known branch (auditable)

K1. Street host is Cloudflare Pages, not IPFS.
K2. Catchall is live: missing paths wear the homepage (200 + Base 3D title).
K3. Live `/iris.html` and `/404.html` wear the same Base 3D plate as `/`. Unique plates are not on the deployed zip.
K4. Repo `cf-pages/_redirects` has named routes only (no `/*` splat). Repo `cf-pages/404.html` exists. Street is an older zip.
K5. Board has TASK_kill-404-redirect_2026-09-30.md and TASK_cf-agency_2026-09-30.md. Repo has TASK_ipfs-migration_2026-09-30.md.
K6. This mill cannot wrangler-upload. `pages-direct-upload.yml` documents HOLE_CF_10000.
K7. Father is the kill switch. Talk stays off `/`.

## Unknown branch (holes, not guesses)

U1. Who holds a working Cloudflare Pages Edit token.
U2. Whether `PINATAJWT` is set in Actions.
U3. Any live pin CID of the *current* Base 3D tree.
U4. Whether WebsiteBot can finish Direct Upload this hour.
U5. Teammate fetches that reported `/iris.html` as "Iris — DualisCapax" vs this mill's 7990-byte Base 3D fetch — treat as OPEN until a third curl agrees.

## Collapse

Autonomy is **not complete**. Content can move to IPFS after a working pin. Authority cannot. Completing the known branch on the street requires a credential-capable desk to Direct Upload the zero-nest `cf-pages/` zip, then curl `/` = 200 Base 3D and `/no-such-door-xyz` = 404 "That plate is not here."

DNSLink TXT remains the Father's verb.
