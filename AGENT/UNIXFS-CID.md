# UNIXFS-CID — one encoding per fact

Stamp: 2026-09-29T18:10-04:00
Kind: knowledge book. Law pointer: `BULLETIN/LAW.PURITY.1.md` § Encoding.
A CID addresses one encoding of bytes, not the idea of the file.

## Standing rule

Pinata folder pin defaults are frozen for Dualis spare copies:

- `cidVersion = 1` → `bafy…` UnixFS directory
- Pinata `pinFileToIPFS` wrap as used on the successful core5 pin
- Do not pass `--chunker=rabin` or `buzhash`
- Do not change `size-N` to chase a local Kubo CID
- Do not add UnixFS 1.5 `mode` / `mtime`
- Request `/ipfs/<folderCid>/index.html`, never a child-file CID on a restricted gateway

A second encoding of the same HTML (different wrap, prefix, cidVersion, chunker, raw-leaves, or extra allowlist file) is a **second copy**. Purity 1.0 forbids publishing both as “the” site.

## Chunkers (so bots stop retuning them)

| Name | Cut | CID-stable |
|---|---|---|
| `size-N` (Kubo default `size-262144`) | every N bytes | yes, if N and leaves/layout stay fixed |
| `rabin` / `rabin-min-avg-max` | content-defined | no across tools |
| `buzhash` | content-defined, 512 KiB cap | no across tools |

Only `size-N` is allowed if a future object is large enough to split. Write `N` on the pin receipt. Never change N for that object.

## Dualis lander (OBSERVED)

- Pin size 13425 B. Default chunk 262144 B. **Chunker did not run.**
- Folder CID: `bafybeian5fkku2cu47iusk3iyt3piwbpms7ri4grkneqiyxtqlzoxag2uy`
- Git SHA ≠ CID. Kubo `ipfs add` ≠ Pinata folder CID unless every knob matches.
- `main` re-pin 2026-09-29: Pinata `400 More than one file` = wrap/allowlist, not a chunker bug.
- `403 ERR_ID:00023` on `gateway.pinata.cloud` = gateway policy, not a bad CID.

## Not this card

Live apex. IPNS keys. `--full` / `--repo`. A second lander CID.
