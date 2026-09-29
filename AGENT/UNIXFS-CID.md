# LAW.CID.ENCODING — one encoding per fact

Stamp: 2026-09-29T18:11-04:00
Book: AGENT knowledge (not mill purity score).
Pointer from: `BULLETIN/LAW.PURITY.1.md`, `AGENT/CURRENT-TRUTH.md`.

## Standing rule

A CID is the address of one encoding of bytes. Same HTML under two wraps, two chunkers, two CID versions, or two path prefixes is two facts. Purity 1.0 forbids publishing both as “the” spare.

Pinata `pinFileToIPFS` with `cidVersion: 1` and the current allowlist is the Dualis encoding. Do not retune chunker, raw-leaves, or wrap to chase a local Kubo CID.

Observed folder CID (set A, lander core5):
`bafybeian5fkku2cu47iusk3iyt3piwbpms7ri4grkneqiyxtqlzoxag2uy`

Retrieve as `/ipfs/<folderCid>/index.html` on a dedicated gateway. Child-file CIDs are not the pin.

## Chunkers (Kubo names; do not pass these to Pinata)

| Spec | Cut | Dualis |
|---|---|---|
| `size-N` | every N bytes | default `size-262144`. Deterministic. |
| `rabin[-min-avg-max]` | content-defined | dedup on large edits. Different CID. |
| `buzhash` | content-defined | same warning. |

Layout after the cut (balanced vs trickle) is not a chunker. It still changes the root CID.

Lander core5 is 13425 bytes. Every file is under 256 KiB. The chunker does not split those files. What *does* change the folder CID: wrap on/off, path prefix, cidVersion, extra allowlist files, UnixFS 1.5 mode/mtime (forbidden).

`--full` / `--repo` would hit the chunker and the quota. Do not turn them on to “test chunking.”

## Git SHA ≠ CID

Residual-ring hashes git. Pinata hashes UnixFS blocks. Do not treat them as equal.

In-repo `01_CORE__ipfs_sovereign_filesystem.py` mints mock `bafybeic…` strings. Those are not pins.

## Retrieval is not addressing

`403 ERR_ID:00023` on `gateway.pinata.cloud` is gateway policy. The CID remains valid. Dedicated host + grey CNAME `ipfs` is Rung 2. DNSLink TXT is Rung 3. Neither is a second encoding.
