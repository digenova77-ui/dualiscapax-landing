# DualisCapax operating environment — 2026-09-11

Document control: `ED-OPS-20260911-ENV-SPLIT-V1`  
Seat: David J. Di Genova · DualisCapax Inc.  
Repo of record: `digenova77-ui/dualiscapax-landing`

This file is the gameplan. It supersedes “push to GitHub Pages and it is live.”

## Split

| Surface | Job | Deploy path |
|---|---|---|
| GitHub | Information repository. Documentation. Swarm ledgers. Invariant tests. Pinata receipts. | Never a production deploy surface again. |
| GitHub Actions swarms | Keep functioning. Epoch flush, bot fleet, residual-ring, encyclopedia-verify, secret-scan, pinata-pin (manual). | Run in place. Do not use them to publish apex. |
| Pinata / IPFS | Content-addressed spare copy of the public tree. CIDs are truth of bytes. | Keep. Manual or `workflow_dispatch` pin. JWT stays in Actions secrets / local env. Never in git. |
| Cloudflare | Live edge. Pages (static) + Workers (iris / stripe / gate) already exist. | Manual only. Hierarchical-flat zip for Pages. Wrangler from a seated machine for Workers. No Actions auto-deploy. |

github.io may still exist as a fossil mirror. It is not the publish path. Do not add a second lander. Do not whim-push apex. Do not mint.

## What stays on GitHub

- All documentation from this date forward.
- Swarm runners and their ledger commits (`src/engine/ledgers/`).
- Numbered flat archive (`01_CORE__…`, `05_WEB__…`, `06_ENCYC_*`).
- Mapping + pack receipts under `data/`.
- Pinata last-pin receipt (`data/pinata-last.json`) after a real pin.

## What does not go through GitHub

- GitHub Pages publish (workflow `deploy.yml` retired).
- Cloudflare Workers publish from Actions (`workers-live.yml` is dispatch-disabled / retired as a deploy rail).
- Secrets, JWTs, Stripe live keys, Cloudflare API tokens in files.

## Hierarchical flat zip

The information repo already speaks two shapes of the same bytes:

1. **Flat names** in git: `05_WEB__research__access.html`
2. **Hierarchy** at the edge: `research/access.html`

`scripts/pack_hierarchical_flat_zip.py` builds both zip kinds:

- `dist/cloudflare/lander-<stamp>.zip` — Cloudflare Pages Direct Upload. `index.html` at zip root. Nested folders.
- `dist/cloudflare/archive-flat-<stamp>.zip` — single-level zip of `__` names plus `00_MASTER_FLAT_MAPPING.json`. Portable information pack.

Upload the lander zip in Cloudflare Dashboard → Pages → project → Create deployment → Upload assets. Do not point Pages at this GitHub repo.

## Pinata / IPFS (how it is used today)

Existing rail: `scripts/pin-pinata.mjs` + `.github/workflows/pinata-pin.yml`.

- Default pin is the **lander root** (`index.html`, `why.html`, `hub.html`, `js/`, `css/`, `assets/`, …).
- `--full` pins the public tree (skips `.git`, `.github`, `workers`, secrets).
- Files sit at CID root (no `dualiscapax/` wrap prefix).
- Gateway used in code: `https://gateway.pinata.cloud/ipfs/<cid>`.
- `01_CORE__ipfs_sovereign_filesystem.py` is the local Merkle / CID indexer. It does not replace Pinata pin.

Keep that rail. Change only the story: Pinata is the spare, Cloudflare is live, GitHub is the library. Not “Pages is live, Pinata is spare.”

## Agent law that still binds

From `AGENT_CHECKPOINT.md` and skill pickup:

- No second lander. No mint. No `COUNSEL_SEALED` flip.
- DualisCapax collects gateway price. Protocol is the truth of merit.
- Concurrent agents ok on different paths. Serialize SPINE commit and sealed packs.
- This environment file is snapshot.next for publish rails only. Sealed axioms stay sealed.
