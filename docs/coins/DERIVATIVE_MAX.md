# Derivative max: the three-token design taken to its limit (design proposal, 2026-10-17)

Status: ideas and models. Sims are **seeded models with made-up parameters, not data**. Nothing is minted.
Code: `tools/coins/tier_sim.py`, `tools/coins/early_sim.py`, `tools/coins/transition_sim.py`, ledger + gauntlet in `tools/coins/`.

## (a) Early-adopter rewards: access and memory space, never money (David, 2026-10-17)
Early rewards are **not monetary**. They are (1) **memory-space gains** (more bot swarm capacity under your control) and (2) **access-level perks** gated by Unity ID. Every perk is non-sellable and bound to the Unity ID plus its tier. No reward is paid in Merit, USDC or e-fuse, and Merit can't buy a tier.

**Tier score** = early points (fixed, capped, decaying by registration order) + work points (attested work receipts, capped per period so a tier can't be ground out or bought in one burst). Tiers are **thresholds, not quotas**, so a latecomer's progress never depends on an early member losing a seat.

| Lever | Token tie | What you get |
|---|---|---|
| E-fuse ignition receipt | e-fuse | Your registration order is stamped on your fuse receipt and seeds your early points |
| Founding wall seat | UniFi³ | Name/record on the wall (slot 0 is Giovanni); honour and governance voice; no payout |
| Swarm memory capacity | UniFi³ + human side | Tier raises how many bot memory spaces you may control (`set_controller` limit per tier) |
| First-deriver mark | Merit/harvest receipt | The first identity to open a new derivative line gets a permanent mark and tier points (the 9% harvest stays normal pay for the work, not a bonus) |

**Concrete perks** (all Unity-ID-gated, non-transferable):
- Priority or early ticket windows for concerts, festivals and sports. The ticket is issued *to the Unity ID* and checked at the door by a passkey tap.
- Members-only live events, AMAs, builder summits, studio sessions.
- Amusement parks and venues: fast-lane windows, off-peak members' days, behind-the-scenes tours.
- Restaurant and venue reservations held for tiers.
- Early access to new Iris features, beta apps, 3D world zones on .ai.
- Extra swarm memory slots, longer bot memory retention, priority compute windows.
- Guest passes: a tier-3 holder can bring one guest per event, and the guest must also be a fused human (it grows the network and can't be resold).
- Recognition: wall badges, tier rings on the Iris orb.

**Anti-scalping rules:**
1. A ticket is bound to the holder's Unity ID, with a passkey check at entry. The name or ID on the ticket can't change.
2. No transfer, no resale. A cancellation returns the slot to the pool (to the next in line by tier, then lottery), never to a buyer.
3. One per ID per event (plus the guest rule). Bots can't hold human-event perks, and bot swarm perks are capacity, not tickets.
4. Perk redemption writes a receipt, and a second redemption of the same perk nonce is refused (same replay guard as the ledger).

**Anti-sybil rules:**
1. Tiers need a human fuse with an attested person hash (one per person).
2. Work points need attested receipts from a second party (proof-of-repair). Self-dealing with your own bots earns nothing.
3. A per-period work cap stops farms from sprinting.
4. Early points are a small fixed share of the top threshold, so registering early alone never reaches the top tier.

**Fairness model** (tier_sim.py, a seeded model: 4,000 joiners over 80 periods, 50% chance of work each period, thresholds 50/120/200):
| Early max points | Holders at top tier | Late-joining half's share of top tier | Median periods for a latecomer to reach top tier |
|---|---|---|---|
| 0 (no early perk) | 1,418 | 1.9% | 34 |
| 200 | 1,698 | 2.5% | 33 |
| 600 | 1,967 | 4.9% | 31 |
Latecomers reach the top tier through work in about 31–34 periods whatever the early setting, because tiers are thresholds and early points don't crowd them out. The late half's small share of the top tier at period 80 is a time effect: many joined only near the end. In this model a bigger early pool didn't hurt latecomers. Earlier money-based sim, kept for comparison (early_sim.py): a *monetary* decaying Merit bonus cut the latecomer half's Merit share from 25.7% to about 21% and raised Gini from 0.46 to 0.51. That's why money rewards were dropped.

## (b) New mechanisms, each with a falsifiable test
1. **Questioning-margin gate**: tapping and stage advances require repair rate > damage rate (margin > 1). *Test:* a stressed sim must show zero taps while margin ≤ 1. It fails if any tap clears.
2. **Receipt-weighted Merit**: Merit standing decays unless renewed by attested work receipts (use-it-or-lose-it), so dormant whales fade. *Test:* after 12 idle periods, a dormant holder's control share must fall below an active peer's at equal starting Merit.
3. **Forfeit-to-forest**: cross-side forfeits go to the forest, not the side pool. *Test:* the forest's health ratio goes up and the side invariant still holds (already modelled as the side pool, so this is a switch).
4. **Proof-of-repair harvest**: the 9% harvest is paid only after a second identity verifies the work. *Test:* in the fuzz, single-party self-dealing (A pays A's own bot) earns zero harvest.
5. **Milestone hysteresis**: the stage steps back when health breaks. *Test:* transition_sim bank-run shows stepbacks ≥ 1. It's covered by the gauntlet and passes.
6. **Whale ceiling on control**: no single human's control share counts above X% of swarm control. The excess still earns but carries no voice. *Test:* with one holder at 60% of Merit, effective control must equal X.

## (c) "No crypto needed" mode vs crypto mode
In this mode the law core, hash-chained receipts and the three rings (Philosophy: why; Physics: measured; Law: allowed) are the only judges. All three tokens are ledger entries in `ledger.py`, which already runs without any chain. USDC or crypto is only an optional skin at the gateway.
| | No-crypto (ledger-native) | Crypto mode (USDC/UniFi³ on a chain) |
|---|---|---|
| What already works | Everything in the gauntlet: 55/55 tests, determinism, replay safety | Nothing is on chain yet |
| Trust | Law core plus attestors. Public checkpoints of the head hash give tamper evidence. | Public consensus, but you inherit chain risk (Circle freeze, bridge hacks, MEV) |
| Legal surface | Smaller: no tradable token. Fiat in and out still needs an MSB/payment processor. | Larger: securities review, MSB, Travel Rule, exchange listings |
| Exit / liquidity | Only via gateway cash-out (swap_burn → fiat or USDC) | Open market; bank-run and speculation risk |
| Speed / cost | Instant, no gas | Gas, confirmations |
| Failure mode | Operator and attestor compromise (needs k-of-n attestors and public anchoring) | Smart-contract bugs, depegs, freezes |
**Recommendation:** run no-crypto as the core, with crypto as a skin. It's what is built and tested, it carries the least legal exposure, and USDC/UniFi³ can be bolted on at the gateway once milestones and a lawyer clear it.

## USDC → UniFi³ transition (transition_sim.py, a model)
UniFi³'s share of the gateway steps 0 → 25 → 50 → 75 → 100%. Each step needs all of its milestones (verified IDs, steady volume, health) held for 3 periods, plus a USDC cover of at least 20% of UniFi³ claims. It steps back one stage when health breaks.
- **steady:** reached 75% by period 38 and **never reached 100%**. Once UniFi³ carries most of the volume, the USDC reserve grows too slowly for the final health milestone. The final wind-down to 0% USDC needs a different health measure (e.g. based on the forest or e-fuse) or an explicit reserve top-up.
- **stalled:** registrations stop, so it stays at 25%. Correct.
- **bank-run:** 60% of UniFi³ claims try to redeem at period 100, leaving **5.18M unpaid**. The model steps back to 50% USDC. A 20% cover does **not** prevent a run, and the cover rule only gates advances.
- **vol-crash:** volume collapses and the model **does not step back**, because health ignores volume. That's a liquidity gap and the health metric needs a volume term.
- **Conflict to resolve:** UniFi³ is soulbound, one per identity, in the ledger. Making it a gateway coin requires a divisible, transferable UniFi³ unit separate from the identity seat (e.g. "UniFi³ seat" vs "UniFi³ units"). This is David's call.
