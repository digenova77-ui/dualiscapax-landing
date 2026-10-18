# Three coins, one ledger: e-fuse · UniFi³ · Merit (proposal, draft, 2026-10-17)

Reference code: `tools/coins/ledger.py` (Python stdlib). Gauntlet: `tools/coins/gauntlet.py`, `tools/coins/econ_sim.py`.
Builds on `tools/tokenomics.py` (50/50 split, no-sell vault, surplus, 90/9/1) from the stacked branches below it.
Status: accounting reference only. Nothing is minted, priced, listed or deployed. Judges: Philosophy (why), Physics (measured), Law (allowed).

## 1. What each coin is
| Coin | Is | Created by | Moves? |
|---|---|---|---|
| **e-fuse** | Locked commons vault that pays down world cost | 50% of every dollar/crypto purchase (odd cent included) | Deposit-only. Only outflows: attested world-cost payment, then surplus to expansion. Never sold, withdrawn, transferred or redeemed by anyone, founder included. |
| **UniFi³** | The token behind Unity ID: exactly 1 per fused identity | The `fuse` op (first registration: passkey fused to identity hash = the e-fuse receipt, law_v8 `efuse_fuse`) | Soulbound in this draft: transfer/sell refused (open decision D1). |
| **Merit** | Earned claim/standing, in minor units | The buyer's 50% of each purchase | Non-transferable in this draft (standing comes from origin; canon: "a buyer gets no standing"). Open decision D1. |

Derivative value (outside revenue/work) is a fourth *flow*, not a coin: 90% forest / 9% harvest (the worker) / 1% father seed.

## 2. How they link
`fuse` (attested) → mints 1 UniFi³ + opens a Merit account. No UniFi³ = no Merit, no taps, no harvest (the bridges are ignited only by the fuse).
`purchase` (signed by buyer + attested by payment gateway) → split_purchase → e-fuse += ceil(x/2), buyer Merit += floor(x/2).
`settle` (attested world cost W) → e-fuse pays min(balance, W); if fully covered, the remainder goes to expansion. The 50/50 continues forever.
`derivative` (attested) → forest / harvest[worker] / seed escrow (or forest when `seed_mode="forest"`).
`season` (attested open/close) + `tap` (signed) → member draws from forest under the maple law.

## 3. Invariants (checked after every op in the fuzz)
1. Purchase conservation: Σpurchases = e-fuse deposited + ΣMerit (exact, integer cents; odd cent to e-fuse).
2. E-fuse conservation: deposited = balance + world_cost_paid + expansion. No other exit exists in code.
3. Merit supply = ΣMerit; human half ≤ cap/2 and bot half ≤ cap/2 independently (cap = 100M coins, D3).
4. Derivative conservation: in = forest + harvest + seed escrow + tapped; harvest ledger sums.
5. UniFi³ is exactly 1:1 with fused identities.
6. No negative balances; amounts are ints in [1, 10^15]; floats/bools/strings refused.
7. Single-use 64-hex nonces, TTL ≤ 60 s, ≤ 5 s future skew; payment_ref / source_ref credit once.
8. Every accepted op appends a receipt `{seq, prev, at, op, effects, hash}`; hash = sha256(canonical JSON). Rejected ops change nothing (validate-then-mutate).
9. Determinism: same op stream → byte-identical snapshot and state hash; snapshot + replay = uninterrupted run.
10. Tapping: only in season, only if forest ≥ reserve target (health ≥ 100%), within season budget (10% of surplus over reserve at open), per-member cap, and never below reserve.
11. Sybil: one human identity per attested person hash; bots carry no person hash; bots can only fill the bot half.

## 4. Real-world deployability gaps (flag, not decided)
- **Chain**: (a) own law-core chain (Rust, already has hash-chained receipts + passkey handoff) with periodic anchoring to a public chain; (b) EVM (Base/Ethereum L2) contracts; (c) Solana. Recommend (a)+anchor for e-fuse/UniFi³/Merit since none of them need to trade; a bridge only matters if a coin becomes transferable (D1).
- **Signatures**: reference uses HMAC as a passkey stand-in. Production needs WebAuthn P-256 verification (law_v8 path) — port this ledger to Rust as a `law_v9` proposal.
- **Attestor**: one attestor key here (gateway / world cost / season / personhood). Production needs multi-party (k-of-n) attestation, key rotation, and HSM custody. Single key = single point of failure.
- **Custody**: who holds the e-fuse's real dollars (bank trust, escrow, foundation)? "Never withdrawable" must be enforced legally, not only in code.
- **Fiat/crypto gateway**: Stripe worker exists (`workers/stripe-fulfill/`) with no split logic; needs payment_ref = provider charge id, refunds/chargebacks policy (a chargeback after Merit is issued is currently unhandled), crypto confirmations depth.
- **Legal (lawyer needed)**: whether Merit/UniFi³ are securities (Howey; Canada CSA/OSC), money-transmitter/MSB registration (FINTRAC, FinCEN), KYC/AML for the gateway, proof-of-personhood privacy (PIPEDA/GDPR), tax treatment of Merit, charitable/trust structure for the e-fuse.
- **World cost**: no definition of who measures it or how; `settle` takes an attested number (the "world cost meter" step).
- **Audits**: independent code audit of the Rust port, economic audit of caps/tapping, formal spec of invariants; pen-test of the gateway.

## 5. Open decisions for David
- D1: Transferability. Canon (efuse-unity) says Unity non-transferable and Merit transferable; this draft makes both non-transferable. Which is it?
- D2: 1% father seed — escrow (default) vs route to forest, pending canon amendment (founder extraction forbidden).
- D3: Merit cap 100M coins (vs 1B Drive draft); what Merit is denominated in (cents of purchase here).
- D4: Tap parameters: reserve target, season budget %, per-member cap; who attests "in season".
- D5: Old collar.ts `{held:90, forged:9, moves:1}` and `llms.txt` 0.81/0.10/0.09 text conflict with this.
