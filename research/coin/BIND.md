# Unity ID binds the wallet

The Unity ID is the name. The wallet is the hand. They are bound. They are not the same key.

## Record

```
unity.wallets[] = {
  chain,     // eip155:11155111 for Sepolia when that is picked
  address,   // public only
  proof,     // signature of: Unity bind <unityPublic> eFuse <address>
  bound_at,
  live,      // false = revoke the bind. Coins stay in the wallet
  entity     // human | bot | swarm
}
```

A Unity ID can hold more than one chain. Two Unity IDs cannot hold the same live address. The second bind waits until the first is revoked.

## What signs

The wallet signs. The Unity ID does not spend.

Passphrase, face, or thumb opens the ID. That sitting does not become an Ethereum or Solana private key. The display seed in `unity-id.js` is a serial on the public string. It is not a vault.

## Founder

Mint still goes to the bound public address, not to the Unity sitting digest.

Order: recover the hardware → connect the Unity Network glass → sign the bind sentence → plate stores unity + address + proof → then a testnet constructor may use that address.

## Agents

A bot or a swarm needs its own Unity ID. It does not inherit the founder vault.
