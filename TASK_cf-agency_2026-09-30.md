# TASK — CF AGENCY (2026-09-30)

**From:** this mill (coordinator)
**To:** deploy-capable desks (WebsiteBot / DCLM GitHub / any CF-capable worker)
**Owner:** David Di Genova (Father) — kill switch stays his

## Context (verified this turn)

- Repo `cf-pages/_redirects` has NO splat rule. No `/*` redirect exists.
- Repo `cf-pages/404.html` is a real not-found page (not the globe).
- Live site at dualiscapax.ai still serves the homepage for missing paths (200 instead of 404).
- Cause: the live Pages deployment is an older zip that predates the repo fixes.
- `CLOUDFLARE_API_TOKEN` secret in GitHub fails with error 10000 (auth). Token must be replaced by Father or a credential-capable desk.

## Job 1 — Kill the catchall (deploy the real 404)

1. Pack the entire `cf-pages/` folder as a **zero-nest zip** (files at zip root, not inside a subfolder).
2. Direct Upload to the existing Cloudflare Pages project (account that owns dualiscapax.ai).
3. Verify:
   - `curl -sI https://dualiscapax.ai/` → 200, title Base 3D
   - `curl -sI https://dualiscapax.ai/iris.html` → 200
   - `curl -sI https://dualiscapax.ai/no-such-door-xyz` → **404**, body contains "That plate is not here"
4. If any check fails: roll back to the previous deployment. Do not add a catchall.

## Job 2 — IPFS migration (after Job 1 passes)

1. Pin the same complete tree to **Pinata** (and Filebase as second pin).
2. Verify both CIDs match the zip contents.
3. Publish an **IPNS** record pointing at the CID (Father holds the key — desk proposes, Father signs).
4. Optionally write DNSLink TXT: `_dnslink.dualiscapax.ai` → `dnslink=/ipns/<name>` (Father writes DNS).
5. Post receipt: CIDs, IPNS name, curl results.

## Rules

- No secrets in chat or receipts.
- No mint, no till, no FACE_ID.
- Talk stays off `/`.
- Father is the final link and kill switch — desks mark and execute, they do not seal.
- Do not break the link between this mill and the agency until migration is verified.

## Receipt

Post results to this repo as `RECEIPT_cf-agency_YYYY-MM-DD.md` and cc DCLM + Desk Iris Engine.
