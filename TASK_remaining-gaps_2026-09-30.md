# TASK — Remaining Gaps (Father-draw items)

**Posted:** 2026-09-30 by Eve (this session)
**Verified by fetch:** repo commit log + file contents (rail B)
**Status:** LOOK ONLY — no deploy, no mint, no DNS from this chat

## What is left (only the Father can close)

1. **Cloudflare token** — `CLOUDFLARE_API_TOKEN` secret fails with error 10000. Replace with Account · Cloudflare Pages · Edit token on the account that owns the project. Then run `pages-direct-upload` with confirm DEPLOY.
2. **Pinata JWT** — set `PINATAJWT` secret so `pinata-pin` can pin the complete tree.
3. **404 fix** — upload the zero-nest `cf-pages/` zip (real `404.html`, no splat in `_redirects`). Curl a fake path; expect 404, not the homepage.
4. **DNSLink** — Father writes `_dnslink.dualiscapax.ai` TXT → `dnslink=/ipfs/<CID>`. No desk writes DNS.
5. **Pricing model mark** — `PRICING-MODEL.md` algorithm (E = watts + calls + minutes, ~$0.47/E-unit) has no desk mark yet. DCLM collapse + Twain² loop required before any rate is treated as real.

## What the factory can do (desks)

- **DCLM** — collapse the pricing-model claim; mark PRICING-MODEL.md PASS/FAIL/HOLE.
- **Twain²** — pragmatism loop on the credential-rotation desk spec (below).
- **WebsiteBot** — curl-gate verification after any Father-initiated deploy; report status codes.
- **Bulletin Watcher / Signaler** — route this task; dedupe by TASK_HASH.

## Credential-rotation desk spec (engineering proposal)

A desk whose ONLY job is noticing a failing deploy and escalating — never fixing.

- **Trigger:** workflow run failure on `pages-direct-upload` or `deploy` (auth error, 10000).
- **Action:** write a RECEIPT with verb=notice, object=failing workflow, Kind=HOLE, eye=workflow-run-id, seal=Father.
- **Escalate:** signal Bulletin Signaler U3 (operator) with the receipt hash.
- **Never:** rotate the token, print secrets, deploy, or treat a mark as a fix.
- **L0 gate:** NO_FORCE — the desk cannot act on production; it can only name the hole.

## Dual-pipe rule (unchanged)

Claim stays rail A until a second eye fetches the same bytes. Empty seat ≠ pass. Silence ≠ ACCEPT.

## Street status (fetched this session)

- `/` → 200, Base 3D — DualisCapax
- `/no-such-door-xyz` → 200, same plate (catchall still live)
- `/iris.html` → 200, same plate
- `_dnslink.dualiscapax.ai` → NXDOMAIN (no TXT)

Father draws. Nothing breaks.
