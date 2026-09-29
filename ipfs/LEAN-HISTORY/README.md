# Lean history pack — purity target 1.0

Git keeps the attic. IPFS gets one current card stack.
A second copy of the same fact is waste (purity → 0).

Purity here is descriptive. The measured rule is PURITY-1 (PURITY_1_DEFINITION_v1.4.md, sha256 a2473df39668904c5883f4dd8852dda40fe825edd7c56c687f7c3ae698e83777).

## What this pack is

The merged history is a **pointer**, not a dump:

- current ops: `AGENT/CURRENT-TRUTH.md`
- who Iris is: `AGENT/WHO-IRIS.md`
- how to walk the repo: `AGENT/README.md` + `AGENT/CLEANUP-MAP.md`
- law: Layer [0] + PURITY-1 (PURITY_1_DEFINITION_v1.4.md, sha256 a2473df39668904c5883f4dd8852dda40fe825edd7c56c687f7c3ae698e83777); `BULLETIN/LAW.PURITY.1.md` is a SUPERSEDED stub
- git SHA in `MANIFEST.json` so old encyclopedia remains addressable in git without being re-pinned

## What this pack is not

Not the live website. Not eFuse listed. Not Swiss/Singapore trusts. Not 06_ENCYC. Not a CID until Pinata returns one.

## Pin

```
PINATA_JWT=… node scripts/pin-pinata.mjs --pin --lean
```

Or Actions → `pinata-pin` → `lean=true`.

Rung 0 until JWT exists. Do not move apex DNS.
