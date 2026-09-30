# eFuse plate

Issued: no.
Chain: none.
Contract: none.
Listing: none.
Gateway sees a transfer: no.

This file is the till. If a sentence is not here, it is not true.

## Instrument

- Name: eFuse
- Symbol: EFUSE
- Decimals: 18
- Kind: transferable unit a wallet can hold
- Supply: fixed at genesis. No later mint.
- Genesis holder: the founder address, 100% of supply
- Founder floor: 10% of supply. Sales stop at the floor. That stop is a policy, not an on-chain lock until the coin is issued and the lock is tested
- DualisCapax Inc is not the till. The company does not skim a remainder
- No shared pot ships. The token contract must not hold other people's money as a vault
- A gift to a published address is not a purchase and does not mint

## Not this contract

`research/contracts/DualisResidual.sol` is a signed residual escrow. It pays a client share and a Dualis address. That is not eFuse. Do not deploy it as the coin.

## Not this page

`efuse.html` still says "Not a coin." That sentence is the old rail. The rail can stay as a peg story. It is not the token.

## Rails

A wallet-visible unit needs a chain that already has wallets.

- Soon: one testnet ERC-20 (Ethereum Sepolia or an equivalent EVM testnet)
- Later: the same bytecode on one mainnet, if two checks agree
- Own L1 / own DAO settlement: not this week

Ethereum is a rail. It is not the owner. The DAO, when it exists, can own the contract. The DAO does not exist as a live settlement layer today.

## Two checks before issued becomes yes

1. Supply on chain equals the genesis number in this plate.
2. One transfer is seen by a watcher we run, not by a screenshot.

Until both agree twice, `issued` stays no.
