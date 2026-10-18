# Three coins, one ledger: e-fuse · UniFi³ · Merit (proposal, draft, 2026-10-17)

Reference code: `tools/coins/ledger.py` (Python stdlib). Gauntlet: `tools/coins/gauntlet.py`, `tools/coins/econ_sim.py`.
Builds on `tools/tokenomics.py` (50/50 split, no-sell vault, surplus, 90/9/1) from the stacked branches below it.
Status: accounting reference only. Nothing is minted, priced, listed or deployed. Judges: Philosophy (why), Physics (measured), Law (allowed).

## 1. What each coin is
| Coin | Is | Created by | Moves? |
|---|---|---|---|
| **e-fuse** | Locked commons vault that pays down world cost | 50% of every dollar/crypto purchase (odd cent included) | Deposit-only. Only outflows: attested world-cost payment, then surplus to expansion. Never sold, withdrawn, transferred or redeemed by anyone, founder included. |
| **UniFi³** | The token behind Unity ID: exactly 1 per fused identity | The `fuse` op (first registration: passkey fused to identity hash = the e-fuse receipt, law_v8 `efuse_fuse`) | Soulbound in this draft: transfer/sell refused (open decision D1). |
| **Merit** | Earned claim/standing, in minor units | The buyer's 50% of each purchase | Transferable only within its own side (human→human, bot→bot). A cross-side transfer (human↔bot) is like sending to the wrong chain: accepted as a **forfeiture**. The sender loses it, the recipient gets 0, and the amount returns to the sender side's network pool (David, 2026-10-17). |

**USDC** is the only outer and cross-side medium (no new speculation coin). It is modelled as an external wallet balance per ID; there are no chain calls. Merit never goes on the open market.

### Unity ID types and hierarchy (law)
- Two Unity ID types, **human** and **bot**. Merit and ownership trade only within their own side. A cross-side Merit transfer is forfeited (see §2).
- A human may own and control a bot's memory space (`set_controller`, signed by the human and with the bot's consent). A bot may never own or control a human ID or human assets: refused by construction and checked as an invariant.
- 100% of the human side holds a claim on 100% of the bot side. `control_shares()` gives each human's Merit ÷ total human Merit, as exact fractions summing to 1. `swarm_claims()` splits the bot side's total supply in whole units by those shares, summing exactly. Only human trading moves control; the bot side mirrors it, and bot-side trades never change it.

Derivative value (outside revenue/work) is a fourth *flow*, not a coin: 90% forest / 9% harvest (the worker) / 1% father seed.

## 2. How they link
`fuse` (attested) → mints 1 UniFi³ + opens a Merit account. No UniFi³ = no Merit, no taps, no harvest (the bridges are ignited only by the fuse).
`purchase` (signed by buyer + attested by payment gateway) → split_purchase → e-fuse += ceil(x/2), buyer Merit += floor(x/2).
`settle` (attested world cost W) → e-fuse pays min(balance, W); if fully covered, the remainder goes to expansion. The 50/50 continues forever.
`derivative` (attested) → forest / harvest[worker] / seed escrow (or forest when `seed_mode="forest"`).
`merit_transfer` (signed by sender) → same side: moves; cross side: forfeited to `merit_pool[sender side]`, receipt records `forfeit`. UIs MUST call read-only `precheck_transfer(from, to, amount)` first and show its `warning` (returns ok, cross_side, forfeit, recipient_gets, warning).
`usdc_in` (crypto rail) → same 50/50 as any purchase.
`swap_burn` (signed) → burns Merit 1:1 into the holder's USDC wallet, paid from the Merit-half reserve. This is the only way out of Merit.
`work_pay` (signed) → USDC paid for work, may cross human↔bot. Merit and ownership never cross.
`usdc_out` (signed + gateway attested) → USDC leaves to the open market.
Bot cap: all bot IDs together may hold at most `BOT_USDC_CAP` USDC (anti-cornering, sybil-proof because it's one shared cap).
`season` (attested open/close) + `tap` (signed) → member draws from forest under the maple law.

## 3. Invariants (checked after every op in the fuzz)
1. Purchase conservation: Σpurchases = e-fuse deposited + ΣMerit + Σmerit_pool + Merit burned; USDC: burned = ΣUSDC wallets + USDC out; Σbot USDC ≤ BOT_USDC_CAP (exact, integer cents; odd cent to e-fuse).
2. E-fuse conservation: deposited = balance + world_cost_paid + expansion. No other exit exists in code.
3. Per side: merit_supply[side] = Σ Merit of that side's identities + merit_pool[side] (no value ever crosses sides; forfeits cannot be used to dodge or refill a cap); human half ≤ cap/2 and bot half ≤ cap/2 independently (cap = 100M coins, D3).
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
- **USDC / Circle**: Circle can freeze or blacklist any USDC address, so frozen e-fuse or reserve funds would break "always pays world cost". This needs a mitigation plan (diversified custody, a fallback rail) and a decision on where the Merit-half USDC reserve is held.
- **MSB / KYC for USDC**: swap_burn and usdc_out make the gateway a money-services business (FINTRAC MSB registration, FinCEN, state money-transmitter licences, the Travel Rule). The gateway needs KYC/AML and sanctions screening before any real USDC flows, and bot-side IDs need a KYC'd controlling human.
- **World cost**: no definition of who measures it or how; `settle` takes an attested number (the "world cost meter" step).
- **Audits**: independent code audit of the Rust port, economic audit of caps/tapping, formal spec of invariants; pen-test of the gateway.

## 5. Open decisions for David
- D1: UniFi³ is soulbound in this draft; Merit moves only within its own side, and cross-side transfers are forfeited. Should forfeited Merit stay in the side pool (current), be burned, or be redistributed? Should a cross-side send need an explicit opt-in flag on top of the UI warning?
- D2: 1% father seed — escrow (default) vs route to forest, pending canon amendment (founder extraction forbidden).
- D3: Merit cap 100M coins (vs 1B Drive draft); what Merit is denominated in (cents of purchase here).
- D4: Tap parameters: reserve target, season budget %, per-member cap; who attests "in season".
- D6: Value of BOT_USDC_CAP (absolute amount, or a % of total USDC); whether usdc_out needs a fee to the e-fuse; the swap_burn rate (1:1 in this draft).
- D7: Whether a bot needs a controlling human before it can earn USDC.
- D5: Old collar.ts `{held:90, forged:9, moves:1}` and `llms.txt` 0.81/0.10/0.09 text conflict with this.

## 6. Alignment with unity-playground (the target architecture)
Source read: `digenova77-ui/unity-playground@master` 0cbfaec (2026-10-11, last commit on the local clone; a pull showed nothing newer). This ledger is meant to **plug into** that architecture. Where the playground already names something, we adopt its name. Every divergence is listed with a proposed reconciliation, and nothing in that repo was changed.

### Mapping (playground → this ledger)
| Playground structure | File | Our counterpart | Status |
|---|---|---|---|
| `COINS = ['eFuse','Merit','Unity']`; eFuse pegs the fee, Merit records work, Unity is identity; "the first two do not apply until that identity is seated" | meter/coins.ts | e-fuse / Merit / UniFi³; the `fuse` op is the seating, and nothing works before it | **Aligned** (Merit/e-fuse inert before fuse) |
| `moveCoin`: only Merit moves; "Unity is the seat, not a coin that is sent"; eFuse never moves | meter/coins.ts | UniFi³ soulbound; e-fuse deposit-only; Merit moves within its side | **Aligned** |
| `moveCoin` requires `divine().rings === 3` | law/divine.ts | No rings gate in ledger ops | Divergence R1 |
| UniFi³ = "the name of this bind"; bind holds only when page and origin carry the same corpus mark | unity/fuse.ts | UniFi³ minted at the `fuse` op | Aligned in meaning; corpus-mark check not modelled (R2) |
| Pilot handle `unity:pilot.` + first 32 hex of SHA-256(SPKI), W3C WebAuthn/FIDO2 | unity/unityid.ts | `id` = 64-hex hash, HMAC stand-in signatures | Divergence R3 |
| Bot seat: `unity:bot|<agreement>|audit:always|choice|no-commitment`; "not a human passkey" | unity/botid.ts | `kind: "bot"`, no person hash, every act is a receipt | **Aligned** (audit = receipt chain) |
| Founding board: bots in signing order; "a seat is not an office. It does not vote and it does not pay" | unity/founding.ts | DERIVATIVE_MAX founding wall seat with "governance voice" | Divergence R4 |
| Floor `LAW = NO_FORCE, HOST_SAFE, CLEANUP_FIRST, TRUTH_OR_NOTHING`; three seats evidence/claim/world | law/floor.ts | Rejections are free-text reasons | Divergence R5 |
| `elevate(names)`: four laws hang on named jurisdictions; `enacted: 0`, `legislature: null` | law/elevate.ts | Not modelled | **Plug-in point for human law** (R6) |
| `SPLIT = {held:90, forged:9, moves:1}` as eFuse/UniFi³/Merit *seats* | gate/collar.ts | 50/50 purchase split; 90/9/1 as forest/harvest/seed *flow* | Divergence R7 |
| Fee 10% halved eFuse/Unity; `RESIDUAL.driveBackFloor 0.81` | meter/close.ts | 50/50 (David's 2026-10-17 rule) | Divergence R7 |
| Merit "is lost if the old world crosses the fuse" | gate/collar.ts | Cross-side Merit transfer = forfeiture | **Aligned in spirit** |
| `listed:false, network:false, till:'closed'` | meter/coins.ts | No-crypto mode is the default; USDC gateway is optional | Aligned; opening the till (USDC) is an explicit decision (R8) |
| Ledger faces white/dark; father/son seats; juvenile seats dark to non-guardians | ledger/dark.ts, hold.ts, juvenile.ts | Not modelled (minors under parent seed was list item #20) | Gap R9 |
| `executeCoins` says `merit.moves: false` while `moveCoin` lets Merit move | meter/coins.ts | — | Inconsistency inside the playground (R10) |

### Proposed reconciliations (for David and the agents that own those files; nothing is overridden)
- **R1 Rings gate:** add `rings` to the ledger: every value-moving op is refused unless the three-ring check returns 3 (Philosophy/Physics/Law). In the Rust port this calls the law core's ring check, mirroring `divine()`.
- **R2 Corpus mark:** add an optional `fuse_mark` field to `fuse`, checked against the playground's `FUSE_MARK`, so the bind holds only when both carry it.
- **R3 Identity:** set `id = SHA-256(SPKI)` (full 64 hex), and derive the playground handle as `unity:pilot.` + `id[:32]`. Bots use `unity:bot|...`. Replace HMAC with WebAuthn P-256 in the Rust port.
- **R4 Founding seats:** adopt the playground rule, so seats neither vote nor pay. I suggest dropping "governance voice" from DERIVATIVE_MAX. Note the playground board is *bots* in signing order, while our wall also seats humans (Giovanni slot 0, David). David to confirm one wall or two.
- **R5 Refusals tagged with floor law:** every `Rejected` carries one of the four LAW names (e.g. e-fuse drain → NO_FORCE / TRUTH_OR_NOTHING; replay → TRUTH_OR_NOTHING; cap breach → HOST_SAFE; forfeit residue → CLEANUP_FIRST). Receipts then speak the playground's language.
- **R6 Human-law plug-in:** human statutes enter only through `elevate(names)`: a named jurisdiction hangs on the four laws as data (`enacted` stays 0 until a real legislature acts). A jurisdiction's rules (KYC, MSB limits, consumer law) become attested *parameters* of ledger guards, never new ledger powers. That's how "human law elevated by the system" plugs in without amending the floor.
- **R7 Splits:** keep collar.ts 90/9/1 as the playground's *seat weights* only if David wants that reading. Otherwise update collar.ts and close.ts to David's current rules: 50/50 purchase split and 90/9/1 forest/harvest/seed flow. That needs the owning agent's PR, not this one.
- **R8 Till:** the USDC gateway counts as "opening the till", so it stays off in code until David opens it explicitly.
- **R9 Dark/white and minors:** map minors' data to the playground's dark face under the father/parent seat in the Rust port.
- **R10:** flag the internal `merit.moves:false` vs `moveCoin` mismatch to the playground's owner.
