# PINATA — L1 pin path

Stamp: 2026-09-10T02:40Z
Pages remains the live origin (`DOMAIN.md`).
Operational ladder: [`AGENT/PINATA-OPS.md`](PINATA-OPS.md). Status: [`data/pinata-ops.json`](../data/pinata-ops.json) (rung 0).

## What chat learned and will not pretend

- Folder pins use `POST https://api.pinata.cloud/pinning/pinFileToIPFS` with one `file` part per path. V3 `/v3/files` does not take folders.
- Folders are **public IPFS only**.
- CIDv1 via `pinataOptions: { "cidVersion": 1 }`. Do not add `mode`/`mtime` (UnixFS 1.5 changes the CID).
- One folder POST ≤ 25 GB, aim ≤ 15 GB. Lander mode is tens of files.
- HTML will not render on `gateway.pinata.cloud`. Need a **dedicated gateway + custom domain**.
- Restricted gateway: use folder CID + path, not child CID.
- DNSLink is a later TXT `_dnslink.dualiscapax.ai` = `dnslink=/ipfs/<cid>`. It is not live.
- Do not point apex A records at Pinata while Pages is the origin. Use `ipfs.dualiscapax.ai` CNAME for branded IPFS.
- `PINATA_JWT` is Seat-paste. Never git. Chat cannot mint it. CI key: `pinFileToIPFS` + `pinList`, no `unpin`.

## Run

```
node scripts/pin-pinata.mjs
PINATA_JWT=… node scripts/pin-pinata.mjs --pin
```

`--full` includes the whole public tree except `.git`, `.github`, `workers`, env files.
Receipt: `data/pinata-last.json`.

## Seat clicks

1. Pinata key → GitHub Actions secret `PINATA_JWT`.
2. Actions → `pinata-pin` → Run.
3. Dedicated gateway. Optional custom domain `ipfs.dualiscapax.ai`.
4. Optional TXT `_dnslink.dualiscapax.ai`.
5. Leave `@` A records on GitHub Pages until a written Seat cutover (rung 4).

Checkout stays closed. Workers stay unbound. Unity ID stays on-device.
