# TOKEN STANDARD (draft)

Become a standard others can implement. Do not deploy tonight.
DualisCapax Inc. is not the issuer. The coin vehicle is. Counsel unnamed. Ticker unnamed.

Name working: **PoL-20** — an ERC-20-class token whose `mint` cannot fire without a proof-of-logic receipt.
Wallets already know ERC-20. That is the sophistication: no new chain, a harder gate.

## Must implement (ERC-20 class)

`name` `symbol` `decimals` `totalSupply` `balanceOf` `transfer` `approve` `transferFrom` `allowance`

Optional later: EIP-2612 permit so a phone can approve without a second gas puzzle.

## Must NOT implement

- `ownerMint(to, amount)` with no proof
- rebase / elastic supply
- holding APY
- transfer tax that funds a private wallet
- a Dualis-only transfer hook that breaks MetaMask

## Extra interface (the standard)

```
function mintWithProof(
  address to,
  uint256 amount,
  bytes32 receiptRoot,
  bytes32 leaf,
  bytes32[] siblings,
  uint256 index,
  bytes32 unitMoved  // hashed citation of the cell that changed
) external;

function lastRoot() external view returns (bytes32);
function emptyCenter() external view returns (address); // unspendable slice
```

`mintWithProof` succeeds only if:
1. `leaf` hashes the receipt the caller supplies (or a committed hash)
2. Merkle verify(leaf, siblings, index) == `receiptRoot`
3. `receiptRoot` == `lastRoot()` published for that epoch
4. `amount` is one of the posted weights (8/5/3/1 scaled), not an arbitrary owner number
5. `unitMoved` is nonzero and unused (same hole twice → revert)
6. leftover-home flag on the receipt is set

Fail closed. No “close enough.”

## Genesis

One constructor allocation to the vehicle owner. Optional `emptyCenter` balance that cannot move (U0 / unused founder).
Further supply only via `mintWithProof`.

## Legal

This file is a factory spec. Not an offering. Not an EIP number. Dualis Look does not list a contract address until counsel names rail + ticker.

Next factory work: test vectors for `mintWithProof` offline. Not a Home widget. Teacher door still ahead of deploy.
