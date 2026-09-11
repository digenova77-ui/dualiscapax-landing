# Pinata / IPFS — how DualisCapax uses it

Document control: `ED-OPS-20260911-PINATA-V1`

## Role

Pinata is the **pinning service**. IPFS is the **address space**. GitHub is not the pin.

A pin means: these exact bytes will stay available at a CIDv1. The CID is the name. If the bytes change, the CID changes. That is the point.

## Current code

| Piece | Path | Does |
|---|---|---|
| Pin script | `scripts/pin-pinata.mjs` | Walks repo, optional `--pin`, talks to `https://api.pinata.cloud/pinning/pinFileToIPFS` |
| Actions | `.github/workflows/pinata-pin.yml` | `workflow_dispatch` only. Dry-run always. Real pin if `PINATA_JWT` secret exists |
| Local indexer | `01_CORE__ipfs_sovereign_filesystem.py` | SHA-256 leaves + mock CIDv1 listing. Writes a Merkle story. Does not upload |
| Receipt | `data/pinata-last.json` | Last dry-run or pin. Safe to commit the receipt, never the JWT |

## Modes

```bash
# list what would be pinned (lander only)
node scripts/pin-pinata.mjs

# pin lander if PINATA_JWT is in the environment
PINATA_JWT=… node scripts/pin-pinata.mjs --pin

# pin full public tree
PINATA_JWT=… node scripts/pin-pinata.mjs --pin --full
```

Lander set (script constants): root html/css plus dirs `js`, `css`, `data`, `hall`, `assets`, `brand`.

Skipped always: `.git`, `.github`, `node_modules`, `workers`, `artifacts`, `.tmp`, `*.env`, `*.pem`, `*.key`, `wrangler.toml`.

## Gateway

Public read:

```
https://gateway.pinata.cloud/ipfs/<cid>/
https://gateway.pinata.cloud/ipfs/<cid>/why.html
```

Do not treat the gateway URL as the system of record. The CID is.

## Secrets

- Actions secret name: `PINATA_JWT`
- Local: environment variable only
- Empty JWT is not a code hole. Workflow exits 0 and says so.

## After this environment

1. Keep the workflow and the script.
2. After a Cloudflare manual zip deploy, optionally pin the **same lander bytes** so IPFS matches the edge.
3. Commit `data/pinata-last.json` to GitHub as documentation of the pin.
4. Do not add a GitHub Pages origin field to new receipts. Origin is `cloudflare-manual` + CID.
