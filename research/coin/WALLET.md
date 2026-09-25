# Founder vault

Do not mint until this file is true.

## What this wallet is

The address that receives 100% of genesis.

It is bound to a Unity ID. The ID is the name. The wallet is the hand. They are not the same key. The website must never derive the chain key from a passphrase.

It is not the published gift address unless you prove you control that address and you still want it as the vault. A gift address is a public drop box. A founder vault holds the whole supply. Those are different jobs.

## How it is created

You create it. We do not.

1. On a device that is not a browser tab, make a new wallet. Hardware first. Paper backup of the seed stays offline. Nobody pastes the seed into Grok, GitHub, email, or the hall.
2. Open the Unity Network glass. Write the Unity public sitting. Connect the device. Sign `Unity bind <sitting> eFuse <address>`.
3. The plate stores the Unity public, the address, and the proof. That is the only thing the factory is allowed to see.

## How it is tested before mint

Throwaway keys only. The test file makes them, uses them, and drops them. They are not the founder vault.

The suite must pass:

- genesis lands on one address
- total supply does not rise after that
- a transfer from that address lands
- a transfer to the token contract is refused
- sending ETH to the token is refused
- no private key file exists under `research/coin/`
- a bind record has no seed field

Only after that suite is green, and after the Unity bind proof is on the plate, may a testnet mint send 100% to that address.

## What mint means

Testnet: the constructor argument `founder` is the bound public address. That is the one mint. There is no second mint function.

Mainnet: later. Same bytecode. Same two checks. `issued` stays no until then.

## Gift addresses already published

- Bitcoin `bc1qy3wp4eky5ru08jyvp64ma6t8e0dvgpr0pvtrma`
- Ethereum `0x0adC5f2Dcb239DAAF3eeB3cc34b3F1BFF5AFBBc4`
- Solana `Cus1pLggfxDJC8FJSQv1tRtzDanuzSxjWvSsKA12byDw`

Those are receive-only gifts. They can bind to a Unity ID as a drop box. They are not the vault until you say so and sign.
