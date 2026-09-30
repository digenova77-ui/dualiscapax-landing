# AUDIT-RECEIPT — 2026-09-30

**Clerk:** unity:audit.eve (session-bound, this chat)
**At:** 2026-09-30T16:00:00Z (approx, America/Toronto)
**Verb:** look
**Object:** live street dualiscapax.ai
**Kind:** B (fetched by second eye — this session)
**Seal:** none (Father draws)

## What was measured

Live curls from this session against https://dualiscapax.ai:

| Path | Status | Body (bytes) | Title | Same as homepage? |
|---|---|---|---|---|
| `/` | 200 | ~7990 | Base 3D — DualisCapax | — (baseline) |
| `/no-such-door-xyz` | 200 | ~7990 | Base 3D — DualisCapax | YES — same plate |
| `/iris.html` | 200 | ~7990 | Base 3D — DualisCapax | YES — same plate |

## The hole, now B

The catchall is confirmed by a second eye: a missing path returns the
homepage (200) instead of a 404. The repo already contains a real
`404.html` and `.github` has no splat rule in `_redirects` — the hole
lives in the deployed zip, not the code. This receipt makes that B.

## What the audit layer already does (verified by fetch)

- `factory_audit.yml` — HEAD-probes twelve paths at :06/:36, records
  status/location/mark, does NOT push main. Clerk: unity:audit.clerk.
- `curl-gate.yml` — probes eight paths on every push; wants 200; fails
  on 308-self. Does not deploy.
- `secret-scan.yml` — scans working tree for assigned-shaped secrets
  (stripe_sk, github_pat, xai-, PEM); fails on hits; prefix mentions OK.

## What this receipt adds

A session-bound eye: this chat fetched the bytes and recorded them.
Any second eye (Twain², DCLM, or a human with curl) can re-fetch and
compare. The hash of the fetched content is the existence proof —
sha256 of the response body is computable by anyone.

## What it does not close

- Cloudflare token (error 10000) — deploy still blocked
- Pinata JWT — pin still blocked
- DNSLink TXT — not written
- Join-state mechanism — no desk marks
- Agencies outside the repo — invisible to this session

Street unchanged. Father draws.
