# DCLMVault — attached spec vs landed copy

Stamp: 2026-09-21
Source: user attachment DCLM Unified Single-File Specification
Law: PAPER. No mainnet deploy. No funded vault. CRYPTO_OPEN false.

## What the attachment specified

Yul-packed slot0, Iris `emergencyPause`, RISC Zero `unpauseWithStarkProof`, public `routeUsdc`.
Gas note: UnpauseWithStarkProof Yul delta −8.65%. That is a snapshot, not a production receipt.

## Holes in the attachment we will not ship as-is

1. `routeUsdc(address,uint256)` had **no access control**. Anyone could drain USDC while unpaused.
2. Constructor left the vault **unpaused** (pause bit never set).
3. `unpauseWithStarkProof` had **no irisAdmin check**. A passing seal is the only key. Fine with a real RISC Zero verifier; fatal with the mock that defaults `true`.
4. `MockRiscZeroVerifier` in the Halmos suite returns `true` unless flipped. Symbolic tests do not prove a STARK guest.
5. Deploy script default USDC `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` is Sepolia. Stay there.
6. No SKU, no CAD peg, no Pinata receipt, no idempotent grant fold.
7. Unpause `sstore` overwrites the whole slot (clears pause by omission). Intended, but document it.

## What we landed instead

`research/contracts/dclm/DCLMVault.sol`:
- starts paused
- `routeUsdc` only `irisAdmin`
- zero-recipient rejected
- `RouteUsdc` event
- Yul slot0 packing kept (pause bit 0; alpha << 8; delta << 72)
- unpause still proof-gated (Bind-continue analog)

## Coexistence

- `research/contracts/DualisResidual.sol` is the savings-split (walk / sign / open / pay). Not a checkout.
- `src/engine/crypto/sovereign_anchors.py` is epoch attestation. Not a till.
- `workers/stripe-fulfill/CLIENT-GATEWAY.md` is the earlier crypto **design**: receive-only USDC/BTC/ETH/SOL, 1:1 CAD, memo=sku, grant after confirm. Addresses stay with Seat.
- `workers/crypto-gate` is the public `/pay` language swap. It never calls `routeUsdc`.
