# PoL-1 — Proof of Logic Token Standard (draft)

Status: factory draft. Not deployed. Not an offering.
Legal: this standard is a *format*. DualisCapax Inc. is not the issuer by writing it.
A coin that implements PoL-1 is a separate vehicle. `awaiting_ticker` `awaiting_counsel`.

Goal: hold it like any ERC-20. Mint it only like Dualis.

## What a standard is

ERC-20 won because a wallet already knows `balanceOf` / `transfer`.
PoL-1 does not replace that. It **constrains mint** and **publishes receipts**.

If a contract can mint without a receipt root, it is not PoL-1. It is a printer with our sticker.

## Layers

```
ERC-20 + EIP-2612     hold / send / permit     ← wallets already speak this
PoL-1 minter          mint(to, weight, root, proof, receiptHash)
PoL-1 locker          lock / unlock (escrow → pure)
PoL-1 book            epoch root of receipts (Look + optional on-chain)
```

Transfer is boring on purpose. Desire is not a transfer trick.

## Mint interface (normative)

`mint(address to, uint8 weight, bytes32 epochRoot, bytes32[] proof, uint256 index, bytes32 receiptHash)`

MUST:

1. `to` already had a lock in ESCROW before `receiptHash` existed (or msg.sender is the locker).
2. Merkle verify(`receiptHash`, proof, index, epochRoot) == true.
3. `epochRoot` equals the last published root (on-chain copy or signed Look root).
4. `weight` ∈ {1, 3, 5, 8}.
5. `receiptHash` unused (replay = revert).
6. Recirculation split happens before `to` is credited, or recirculation is a separate enforced transfer in the same tx.
7. No `mint` from owner without the proof. No `setAPY`. No rebase.

MUST NOT:

- Mint on transfer.
- Mint on time elapsed.
- Mint because a Dualis page said so.
- Store student names, phrases, health records in receipt calldata.

## Receipt leaf (normative encoding)

`receiptHash = keccak256(abi.encode(path, oldUnit, newUnit, at, locker))`

`oldUnit` → `newUnit` is the cell that moved (e.g. http 404 → 200). If equal, invalid leaf.

## Escrow (normative states)

`NONE → ESCROW → PURE → SPENT` or `NONE → ESCROW → VOID`

- ESCROW: locker may walk; pot returns; no mint.
- PURE: both signed; lock stays until receipt posts or both VOID.
- Same desk for every address. No preferred class.

## Genesis

Implementer may premine. PoL-1 does not forbid genesis allocation.
PoL-1 REQUIRES an unspendable empty-center slice (burn or proven-unspendable) so authorship is not a silent faucet.
Ongoing supply after genesis MUST pass mint() above.

## DualisCapax relationship (informative, not code)

DualisCapax may publish epoch roots on Look.
DualisCapax ads MUST NOT name the token.
A PoL-1 coin MAY exist with zero Dualis pages.
A Dualis page MUST exist with zero PoL-1 coins.

## Conformance tests (factory next)

1. Merkle pass / swapped concatenate fail / replay fail.
2. Mint without lock reverts.
3. Mint with lock + good proof credits `weight` after recirculation.
4. Owner `mint` without proof reverts.
5. Transfer does not mint.

Until those five pass on a testnet, we are not a standard. We are a draft.

Look $0. Home not smashed. No widget.
