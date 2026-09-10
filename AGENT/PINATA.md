# PINATA — L1 pin path

Stamp: 2026-09-10T02:30Z
Pages remains the live origin (`DOMAIN.md`). This file is how the same L1 tree is pinned when Seat wants a CID.

## What chat learned and will not pretend

- Folder pins use `POST https://api.pinata.cloud/pinning/pinFileToIPFS` with one `file` part per path. V3 `/v3/files` does not take folders.
- Folders are **public IPFS only**.
- CIDv1 via `pinataOptions: { "cidVersion": 1 }`. Do not add `mode`/`mtime` (UnixFS 1.5 changes the CID).
- One folder POST ≤ 25 GB, aim ≤ 15 GB. Lander mode is tens of files.
- HTML will not render on `gateway.pinata.cloud`. Need a **dedicated gateway + custom domain**.
- DNSLink is a later TXT `_dnslink.dualiscapax.ai` = `dnslink=/ipfs/<cid>`. It is not live.
- Do not point apex A records at Pinata while Pages is the origin.
- `PINATA_JWT` is Seat-paste. Never git. Chat cannot mint it.

## Run

Dry run (no secret):

```
node scripts/pin-pinata.mjs
```

Pin (Seat shell or Actions):

```
PINATA_JWT=… node scripts/pin-pinata.mjs --pin
```

`--full` includes the whole public tree except `.git`, `.github`, `workers`, env files.

Receipt: `data/pinata-last.json`.

## Seat clicks after a CID exists

1. Repo Settings → Secrets → Actions → `PINATA_JWT` (scoped pin JWT).
2. Actions → `pinata-pin` → Run workflow.
3. Pinata app → Gateways → dedicated gateway → Add Custom Domain if HTML must be browsed there.
4. Optional TXT `_dnslink.dualiscapax.ai`. Leave `@` A records on GitHub Pages until a written Seat cutover.

Checkout stays closed. Workers stay unbound. Unity ID stays on-device.
