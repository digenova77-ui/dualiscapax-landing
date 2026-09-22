# DCLMVault — holes in the attached spec

Stamp: 2026-09-21
Source: user-attached unified spec. Not in git before this pack.
Status: PAPER. Do not deploy mainnet. Do not fund. Do not call `routeUsdc`.

This file is the law for the copy under `research/contracts/dclm/DCLMVault.sol`.
The attached original is not production.

## What the attachment got right

- Twain split encoded as `abi.encode(int64 alpha, int64 delta)` journal (64 bytes).
- Packed `slot0`: pause bit in the low byte; alpha at bit 8; delta at bit 72.
- `emergencyPause` gated on `irisAdmin`.
- RISC Zero verifier interface is the intended unpause key (proof-as-key), *if* the verifier is real.
- Yul snapshot claimed −8.65% only on `unpauseWithStarkProof`.

## Holes we patched in our copy

1. **Constructor started UNPAUSED.** Attachment never set the pause bit. Our copy `sstore`s `0x01` in the constructor.
2. **`routeUsdc` had zero access control.** Anyone could drain USDC while unpaused. Our copy requires `irisAdmin` and still reverts when paused.
3. **No `RouteUsdc` event.** Added.
4. **Mock verifier defaults to `true`.** Symbolic suite in the attachment is a toy. Our test file keeps the mock but the README forbids it on any funded vault.
5. **Deploy defaults are Sepolia-shaped.** `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` is not a Dualis production treasury. Script stays env-driven and paper.
6. **No SKU, CAD peg, cap, or recipient allowlist.** Vault is a router, not a checkout. SKU grant lives in `workers/crypto-gate` and stays 403 until Bind-continue.
7. **CI auto-commit of a generated spec is not landed.** Supply-chain smell. Seat writes docs.

## Holes we document but do not paper over

- `unpauseWithStarkProof` remains public (proof-as-key). That is only safe with a real RISC Zero image id and a non-mock verifier. A `true`-default mock is a skeleton key.
- `unpause` overwrites all of `slot0` (clears pause by omission). Intended. Alpha/delta keep only the low 64 bits.
- DualisResidual.sol is a *different* machine (ETH native savings-split). Do not merge the two contracts.
- Pinata is archive, not settlement.
- `sovereign_anchors.py` is epoch attestation, not a till.

## Seat before any mainnet create

1. Real RISC Zero image id in `STARK_IMAGE_ID`.
2. Real verifier, never MockRiscZeroVerifier.
3. USDC token address for the intended chain.
4. `irisAdmin` is a hardware-backed Dualis key, not the deployer EOA by accident.
5. Vault funded only after Bind-continue and after `workers/crypto-gate` `CRYPTO_OPEN` is an explicit Seat YES.
6. Deactivate leftover Stripe Payment Links in Dashboard — git cannot expire them.
