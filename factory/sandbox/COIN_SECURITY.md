# COIN SECURITY (paper)

No live contract. This is the backtest against PoL-20 / TOKEN_STANDARD.
Not an audit stamp. Dualis ≠ issuer. Look $0.

## Crown jewels

1. **Root publisher key** — who can set `lastRoot()`. If DualisCapax Inc. holds this, the legal split is a sticker.
2. **Minter** — must be `mintWithProof` only.
3. **Empty center** — U0 slice must not move even with the owner key.
4. **Phrase / Unity** — desk login. Never a coin signer.

NEW for the mill: treat (1) like Cloudflare token. Dualis pages publish a *hash they read*, they do not *sign the root* if we want the split to survive a regulator.

## Backtest (attack → gate → result)

| # | Attack | Gate | Paper result |
|---|---|---|---|
| A1 | `ownerMint` after a hard week | PoL mint | FAIL spec if function exists |
| A2 | APY / rebase while holding | leftover home + sitting≠0 | FAIL spec if present |
| A3 | Replay same `unitMoved` | unused unit | PASS if mapping used[unit]=true |
| A4 | Merkle odd-leaf clone mismatch | verify | FAIL unless both sides duplicate last |
| A5 | Sibling order swapped | verify | PASS (must revert) |
| A6 | Peer supplies the leaf hash | verify | FAIL if minter does not hash receipt itself |
| A7 | Stale root (old epoch) | lastRoot() | PASS if epoch bound |
| A8 | Approve front-run | ERC-20 | Use increase/decrease or permit with nonce |
| A9 | Permit phishing | EIP-2612 | Domain separator + deadline; never sign on Dualis Home |
| A10 | Reentrancy on mint | CEI | Credits after verify; no external call before used[unit]=true |
| A11 | Transfer hook that breaks wallets | ERC-20 purity | FAIL spec if Dualis-only hook |
| A12 | Dualis wink ad | SOCIAL_LAW | Not a contract bug; still a farm |
| A13 | Root key on Dualis operator laptop | legal + sec | NEW hole: `awaiting_root_custody` |
| A14 | Publish root on a 404 Look path | two-tree | Same organ as unity-bind; do not |
| A15 | Same ticket two weights | amount allowlist | PASS if only 1/3/5/8 |
| A16 | Empty-center spend | unspendable | PASS if transfer from that address reverts |
| A17 | Pause that is a hidden mint | admin | Any pause+mint path = printer |
| A18 | Factory bot as independent endorser | implied endorsement | Disclose house voice |

## What is new for the farm (if they already have the spec)

- Root publisher ≠ DualisCapax signing key.
- Do not put `permit` on dualiscapax.ai.
- Test vectors required before anyone calls this a standard: A3, A4, A5, A6, A10, A16.
- Teacher door / swallow still more critical for the company. Coin security work is offline vectors, not a mainnet.

## Status

Paper backtest only. 0 passing on-chain tests. Do not stamp SECURE.
