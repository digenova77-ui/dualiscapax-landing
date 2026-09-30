# TASK — IPFS migration of dualiscapax.ai (ED-TECH-20260817-IPFS-001)

**Posted:** 2026-09-30 by Eve (coordinator), on the Father's instruction.
**Status:** OPEN — desk work only. No deploy, no DNS write, no secret use from this session.
**Board:** FACTORY_BULLETIN_BOARD (Drive folder 1T6qBAzbwdmJj820bO9qji3wIx7xj0_q4)

---

## Goal

Move the DualisCapax public site from Cloudflare Pages to IPFS, with redundant pinning and a DNSLink name, so the site's bytes are content-addressed and the Father's permissions stay outside IPFS (the IPNS/DNSLink key is the only external authority).

## Source of truth (already on disk)

- Repo: `digenova77-ui/dualiscapax-landing`, branch `main`
- Tree: `cf-pages/` — the complete site (index.html, iris.html, unity.html, 404.html, holographic-core/v2/index.html, assets/, ai/, agreements/, _headers, _redirects, CNAME)
- Spec: Drive doc `DUALISCAPAX — Redundant IPFS Pinning Architecture & Deployment Workflow (Pinata & Filebase) [ED-TECH-20260817-IPFS-001]` (file_id 1boG-QTvyYzbcJmxdrhaO6kzaLRmZs-Okj5k4gsWvYIw)
- DNS draft: Drive doc `Rung 2 - Cloudflare DNS Draft (Pinata ipfs subdomain)` (file_id 1hGmlJo5dC7DX0JANGZyeOVkCCYwaExl_kSFLnIkMExQ)
- Script reference: `scripts/deploy-ipfs.js` in that spec (Pinata REST + Filebase S3, CIDv1, wrapWithDirectory)
- Workflow reference: `.github/workflows/deploy-ipfs.yml` in that spec

## Steps (desk executes; Father approves each gate)

1. **Pack.** From repo root, package `cf-pages/` as a zero-nest zip (contents at zip root, not a parent folder). Confirm `index.html`, `iris.html`, `unity.html`, `404.html`, `holographic-core/v2/index.html` are present.
2. **Pin to Pinata.** `POST https://api.pinata.cloud/pinning/pinFileToIPFS` with the zip, `pinataOptions: {cidVersion:1, wrapWithDirectory:true}`, metadata name `DualisCapax-Web-<ISO8601>`. Record the returned CIDv1 (base32).
3. **Pin to Filebase.** S3 PutObject to bucket `dualiscapax-web-production` (or the Father's named bucket) at key `dualiscapax-site/<relative-path>` for each file; read the root CID from object metadata (`cid` / `ipfs-hash`). Record it.
4. **Verify CID match.** Both CIDs must be identical. Mismatch = HOLE, stop, report.
5. **Gateway check.** `curl -sI https://ipfs.io/ipfs/<CID>/` and `curl -sI https://cloudflare-ipfs.com/ipfs/<CID>/` — both must return 200 with the DualisCapax title. A fake path must return 404 (the 404.html is in the tree).
6. **DNSLink (Father only).** Write TXT `_dnslink.dualiscapax.ai` = `dnslink=/ipfs/<CID>` (or `/ipns/<key>` if the CID will move). TTL 300 while testing. This session does not write DNS.
7. **Receipt.** Post a receipt to the board: CIDs, gateway curl results, timestamp, desk name. DCLM checks the claim before any further action.

## What this task is NOT

- Not a Pages upload. Pages stays as-is until the Father decides to retire it.
- Not a DNS write. The `_dnslink` TXT is the Father's verb.
- Not a secret use. No PINATA_JWT, FILEBASE_*, or CLOUDFLARE_* token is touched by this session.
- Not a till. No payment, no Unity ID mint, no FACE_ID.
- Not Talk-on-`/`. The iris.html page keeps its own mic consent flow; the homepage stays mic-off.

## Dualis-cut

- KEEP: IPFS as content store; DNSLink/IPNS as the movable name; Father holds the key.
- HOLE: live `_dnslink` fetch (not verified from this box); published seed CID.
- REFUSE: child rotating the Father's IPNS key; treating a spare pin as the apex; minting a Unity ID so the migration "counts".

## Verification (Father curls)

```
curl -sI https://ipfs.io/ipfs/<CID>/
curl -sI https://cloudflare-ipfs.com/ipfs/<CID>/
curl -sI https://<gateway>/ipfs/<CID>/no-such-door
# expect 404 from 404.html, not the homepage
```

Street unchanged until the Father sits the DNS record.
