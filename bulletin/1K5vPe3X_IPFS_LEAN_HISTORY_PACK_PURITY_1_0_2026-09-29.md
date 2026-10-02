# IPFS lean history pack — purity 1.0

Stamp: 2026-09-29T17:57-04:00
Kind: REQUEST + MANIFEST
Status: PACK PREPARED · PIN HOLE
Epistemic: CID = HOLE until Seat-held PINATA_JWT pins this allowlist

## What “merge history to IPFS” means here

Not the dirty Git attic. Not `--full`. Not 06_ENCYC. Not 60 Drive zips.
A lean UnixFS folder of **current cards + a parked-history index**, content-addressed.

## Purity score 1.0 gates (all must PASS or do not pin)

1. No secrets: no JWT, sk_, whsec, /workspace paths, phone-PIN, seed phrases.
2. No RETIRED items as live: 7-of-11 anchors.
3. No modeled dollars as observed ($2.8M / 18.4% / $1.5M / $494.5k stay out or tagged MODELED).
4. One Iris. No second homepage. No second company.
5. Coins DECLARED. Company 0.00% float. Till not advertised open.
6. Epistemic tags on every operational sentence.
7. Allowlist only. Encyclopedia stays a hash index, not file bodies.
8. GitHub is command desk. This pin is history/archive, not apex DNS cutover.
9. DNSLink `_dnslink.dualiscapax.ai` stays NOT LIVE unless Seat writes it later.
10. Fail closed if JWT missing. Do not invent a CID.

If any gate fails, score < 1.0. Do not pin.

## Allowlist (lean)

- AGENT/WHO-IRIS.md
- AGENT/CURRENT-TRUTH.md
- AGENT/README.md
- AGENT/CLEANUP-MAP.md
- AGENT/PINATA.md
- AGENT/DCLM-FLOOR-0.md
- README.md (front door only, after cleanup stamp)

## Parked history (index only, not bodies)

List prefix + “PARK / not current”:
06_ENCYC_* · 01_CORE__* · 02_ENG_SPEC__* · 03_LEGAL__* · 05_WEB__*

Do not upload those bodies in this pack.

## Pin path that already exists

- Script: scripts/pin-pinata.mjs
- Workflow: .github/workflows/pinata-pin.yml (workflow_dispatch only)
- Docs: AGENT/PINATA.md · AGENT/PINATA-OPS.md
- Secret: Seat-paste. Chat cannot mint.
- Name hole: workflow reads `secrets.PINATAJWT` while docs say `PINATA_JWT`. Seat must align the name before a real pin.
- Last receipt `data/pinata-last.json`: missing = no proven CID in repo.
- Do not run `--full` for purity 1.0.

## This session

Capability: Drive write + GitHub write. No Pinata JWT here.
Therefore: pack specified, CID not minted. TRUTH_OR_NOTHING.

Next Seat click:
1. Align secret name.
2. Actions → pinata-pin → Run with full=false.
3. Better: add `--allowlist` of the seven files above before pinning.
4. Write CID into data/pinata-last.json and this board file.
5. Optional later: ipfs.dualiscapax.ai CNAME. Not apex.
