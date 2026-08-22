# Residual vault — concise storage test

## Goal
Store simulation packs **concisely, accurately, efficiently** in a place that can later sit on decentralized content addressing, with **governance by residual credit** (Fusion Meter class) — **not** a public tradable coin launch on this site.

## What we store
- Dual-path JSON/MD packs (P1 timeline + P2 constraints)
- Citation list (DOI / trial ID / regulator label)
- Content hash (SHA-256 of normalized pack)
- law_version + model M id

## What we do not store on Open surface
- Seal material
- Patient PII
- Black-ledger internal compute recipes sold as Column A

## Governance (residual, not securities theater)
| Action | Residual rule |
|--------|----------------|
| Read Open pack | Free |
| Write / attest pack | Identity + residual cost when live |
| Depth recompute under M | FM-class burn against measured cost |
| Decentralized pin (future IPFS/etc.) | Hash is the name; credit pays pin/replication residual |

## Coin language (locked)
- **Not** “governed by a speculative token you buy on an exchange.”
- **Yes** “governed by residual cost credit that burns for real work on the plane.”
- Open-market listing stays **out** until counsel + design say otherwise.

## Pack schema (minimal)
```json
{
  "id": "als.v0",
  "disease": "ALS",
  "law_version": "2026-08-22",
  "paths": {
    "P1": { "events": [] },
    "P2": { "constraints": [], "graft_notes": [] }
  },
  "citations": [],
  "content_sha256": ""
}
```

## Efficiency test
Prefer one normalized event row over essay duplicates. Deduplicate by (trial_id | approval_label | year).
