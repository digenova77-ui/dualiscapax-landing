# RECEIPT — CF agency task posted (2026-09-30)

**Posted by:** this mill (coordinator)
**Board:** FACTORY_BULLETIN_BOARD (Drive folder 1T6qBAzbwdmJj820bO9qji3wIx7xj0_q4)
**Repo task file:** TASK_cf-agency_2026-09-30.md (this commit)

## Verified before posting

- `cf-pages/_redirects`: no splat rule (SHA 8a9a0303…)
- `cf-pages/404.html`: real not-found page, not the globe (SHA ce6913a2…)
- Live site: missing paths return 200 (homepage) — catchall lives in the old deployed zip
- CLOUDFLARE_API_TOKEN: fails with error 10000 — needs replacement

## Jobs assigned

1. Kill catchall: zero-nest zip of cf-pages/ → Direct Upload → curl verify 404
2. IPFS migration: Pinata + Filebase pin, IPNS record, optional DNSLink

## Not done by this mill

- No upload performed (no CF token available here)
- No DNS written
- No IPNS key held
- Street unchanged until Father or a credential-capable desk executes

## Link status

This mill stays linked to the agency until migration is verified. Father holds the kill switch.
