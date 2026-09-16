# PoL-1 SECURITY — paper audit + backtest

There is no live coin. This is a threat model of the *standard*.
If an implementation fails a row below, it is not PoL-1.
DualisCapax must never hold the minter key.
Look $0. No Home widget. Teacher door still ahead of deploy.

## What we actually have

- Spec: `POL1_STANDARD.md` + `TOKEN_STANDARD.md`
- No bytecode. No testnet. No audit firm.
- Dualis Residual.sol (separate desk) has CEI / pay() history — do not copy its holes into PoL-1.

## Threat model (highest first)

| ID | Attack | Why it kills PoL | Required defense |
|---|---|---|---|
| T01 | `ownerMint` / admin key | Printer. Satoshi costume | No such function. Proxy admin cannot mint |
| T02 | Merkle swapped concatenate | False inclusion | Index bit chooses L/R; vectors must fail swap |
| T03 | Bitcoin-style odd-leaf clone mismatch | False yes or false no | Spec the duplicate rule; test 3-leaf trees |
| T04 | Truncated / extra proof | Verifier early-accept | Exact height; reject extra bytes |
| T05 | Receipt replay | Same hole pays twice | `receiptHash` mapping used=true |
| T06 | Lock after receipt | Farm a close then stake | Lock timestamp < receipt `at` |
| T07 | Root oracle lie | Dualis page publishes junk root | On-chain `lastRoot`; multi-sig / delay; Dualis != minter |
| T08 | Front-run mint | Watch mempool, steal weight | Mint only to locker address; not to msg.sender unless locker |
| T09 | Reentrancy on mint+transfer recirculation | Classic ERC-20 hook | CEI: effects before external transfer; no ERC-777 callbacks |
| T10 | Infinite approve + permit phishing | Wallet UX | Permit optional; typed EIP-712; deadline; never Dualis site as permit origin until isolated |
| T11 | Chain replay of permit | Same sig other chain | chainId in domain separator |
| T12 | Rebase / hidden tax | Breaks wallets + farm | Forbidden in standard |
| T13 | APY / time mint | Sitting prints | Forbidden |
| T14 | Phrase / PII in calldata | PHIPA + phrase leak | Receipt schema forbid; calldata lint in tests |
| T15 | Dualis wink = implied offer | Securities / endorsement | Ads never name token; minter key not in Dualis cloud |
| T16 | Upgradeable proxy with new mint | Standard dies next week | If proxy: mint logic frozen or same proofs required |
| T17 | Empty-center spendable | Founder faucet | Balance locked or burned; test transfer reverts |
| T18 | Weight not in {1,3,5,8} | Owner picks 1e27 | Enum revert |
| T19 | Equal oldUnit/newUnit leaf | Markdown as a "close" | Leaf invalid if units equal |
| T20 | Two-tree / 404 root | Publish a root of files that 404 live | Factory_TEN: no epoch root until cited paths 200 |

## Backtest (failures we refuse to replay)

- The DAO / reentrancy — T09. Pull over push. Checks-effects-interactions.
- Unlimited ERC-20 approve drains — T10. Permit is convenience, not default infinite.
- Inflation tokens / rebase wallets desync — T12.
- "Owner is a multisig so mint is fine" — T01. Multisig that can mint is still a printer.
- Celebrity undisclosed promo — T15. Not a contract bug. Still a kill.
- Bitcoin merkle odd-duplicate implementations that disagreed — T03.
- Second-preimage on unbalanced trees — T02/T04. Hash leaf domain-separated from node (`leaf:` vs `node:` prefixes if we leave Bitcoin-compat).
- Oracle updater key stolen — T07. Dualis Cloudflare token history is the warning: do not put `setRoot` on the same key that deploys Pages.

## What is NEW for the mill (do not re-learn the spec)

1. **Domain-separate Merkle hashes.** `H(0x00 || L || R)` vs `H(0x01 || leaf)` so a node cannot be passed as a leaf (second-preimage).
2. **Lock timestamp < receipt.at** is mandatory, not "or msg.sender is locker" alone. The OR in POL1_STANDARD line 1 is a hole — close it.
3. **Dualis must not be `setRoot` or proxy admin.** Separate vehicle key. If Dualis cloud is popped, coin still cannot print.
4. **No epoch root while cited paths 404.** T20. A 200-root of 404 files is a false close.
5. **CEI + no ERC-777.** Recirculation transfer last.
6. Teacher door / live 404s are still company-critical. This file does not jump the queue.

## Conformance additions (append to POL1_STANDARD tests)

6. 3-leaf odd tree: official duplicate rule, both pass and fail vectors.
7. Domain-separated leaf vs node.
8. Lock-after-receipt reverts.
9. `setRoot` from Dualis-like key reverts (wrong role).
10. Empty-center `transfer` reverts.
11. Equal units leaf reverts.
12. Reentrancy attacker as recirculation recipient reverts / no double mint.

Fail closed. Paper until those pass on a testnet we do not advertise.
