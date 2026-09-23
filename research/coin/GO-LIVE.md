# eFuse go-live

This is a pullable plate. It is not a launch.

## Already true

- Gift addresses for Bitcoin, Ethereum, and Solana are published. This page does not see those transfers.
- DualisCapax Inc is the officer company. It is not the till.
- `issued` is no.
- `research/contracts/DualisResidual.sol` exists and is not the token.
- Wallet suite: `research/coin/wallet.test.mjs`. Throwaway keys only.

## Must freeze before any deploy

1. Genesis number. Not set.
2. Founder address that receives genesis. Not set. Not a gift address unless you sign from it.
3. One testnet. Pick Sepolia or say why not.
4. Logo `logo.png` 256x256 for a later wallet add. Not drawn.
5. Wallet beta in `research/coin/WALLET.md` is green. Seed never seen here.

## Sequence

1. You create the vault. Hardware first. Recover the same address from paper on a second device.
2. Paste only the public address. Sign `eFuse founder vault`.
3. Wallet tests pass. No key file under `research/coin/`.
4. Deploy `EFuseToken.sol` to the chosen testnet only. Constructor argument is that address. Label TESTNET.
5. Run a transfer from founder to a second test address. Watcher records the hash.
6. Two agrees: supply matches genesis, transfer hash is seen twice.
7. Only then may a page say "a testnet unit exists."
8. Mainnet is a later day. Same bytecode. Same two checks. Trust Wallet listing is after that.
9. Flip `issued` only on mainnet after the same two checks.

## Wallet

A person can add a custom token in Trust Wallet once a contract address exists. That is not a listing.

Template: `research/coin/wallet/info.json`

Do not open a Trust Wallet assets PR until mainnet exists.

Unity ID binds to the public address later. It is not the key.

## What stays closed

- No company remainder from this contract
- No payable vault
- No slogan vault address as settlement
- No seed in this chat, this repo, or the hall
- No mainnet this week
- No "listed"
- No own L1 this week
- No alliance of other chains as a live bind
