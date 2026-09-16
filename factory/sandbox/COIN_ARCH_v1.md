# COIN_ARCH_v1

Factory target. Not live. Dualis stays the desk. The coin stays the vehicle.
Look $0. No buy/stake/mint widget on Home. `awaiting_ticker` `awaiting_counsel`.

Goal: internally as strict as proof-of-logic. At the edge, a normal wallet.

## Do not build a new chain

A new L1 is a toy while 404s are open. Wallet compatibility dies if every holder needs a custom app.

Settlement lives on a counsel-named rail that already has wallets (honest default: EVM L2 with ERC-20).
Proof of logic lives *above* that rail as the only minter.

## Three layers

```
wallet (seed, address, send/receive)
    ↓ standard token
covenant (who may mint / lock / recirculate)
    ↓ receipts
proof of logic (five gates + residual ledger)
```

Holder UX is layer 1 only. They do not run a factory node.

## Layer 1 — looks like money they already have

- ERC-20 (or counsel-named equivalent) so MetaMask, Rabby, Rainbow, Coinbase Wallet, Ledger, Trezor can hold it without a Dualis APK.
- EIP-2612 permit: approve by signature, not a second gas puzzle if we can help it.
- One address per holder. No Dualis-only address format.
- Dualis eight-word vault stays **desk login**. Coin seed stays BIP-39 in the wallet they already use. Do not smash two phrases into one magic sentence until a derivation spec is tested.
- Light client of the cost book = THE_PLAN + published Merkle root of receipts. Wallet only needs the token + a link to Look.

## Layer 2 — covenant (the sophistication they do not have to see)

Minter is not `owner.mint(any)`.
Minter is a contract that accepts a **receipt root + proof** and mints the posted weight (8/5/3/1) to the locker.

- Genesis: 100% to the author address, minus an unspendable empty-center slice (U0 unused analog).
- No APY function. No rebase. No silent inflation.
- Recirculation address is a playground pot, not a private skim.
- ESCROW / PURE as timelock + two-party zero, not a speech.
- Pause / revoke of the operator fixture freezes *new* mints, not holders' existing units.

## Layer 3 — proof of logic (factory engineering)

Bots build toward:

1. Residual ledger as append-only receipts (`404→200`, Fuel-no-200→0, verified hours/watts).
2. Merkle tree of those receipts each epoch.
3. Published root on Look (and later on-chain).
4. Merkle proof a locker can carry to the minter.
5. AND=1 checker — if Home smash / phrase / PII, root is rejected.

This is the software engineering. It stays in `factory/sandbox/` until AND=1 and counsel names the rail.

## Wallet compatibility order (do in this order)

1. Paper spec + receipt format (this file + STAKING_LOGIC).
2. Test vectors: leaf → proof → root (no chain).
3. Counsel names rail + ticker.
4. Standard token + permit on a testnet.
5. One hardware wallet send/receive documented.
6. Then mainnet. Never Dualis Home as the first wallet.

## Desire (philosophy, not a funnel)

People should want the unit because leftover cost in the real world went down and the desk did not farm them.
Not because an APY number blinked.
Not because Dualis looked like a casino.

Affinity +1 is the product: after the split is already fair, one more close still happens.
Drive desire by publishing the residual ledger moving — 404s falling, verified saves with receipts — and by keeping Look free so anyone can check.

If desire needs a lie, the coin is wrong.
