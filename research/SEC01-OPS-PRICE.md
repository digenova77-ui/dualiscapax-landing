# SEC-01 operations + price (baked)

Document: ED-OPS-20260911-SEC01-V1  
Checkout: `open: false`. V8 list **held**. This file is how a desk runs a game and how a year is billed.

Law floor: NO_FORCE. Simulation ≠ treatment. No named-minor PII in the repo.

## 1. Game-day SOP (one ice slot)

```
T-7d   TeamSnap event exists. Guardian / 18+ consent token on Dualis seat.
T-0    Game. LiveBarn records if the venue is wired. Watch optional (HR).
T+2h   If CV wanted: order LiveBarn Player Analysis USD $14.95 (their meter).
T+3h   Shift list exists — PA page, Hudl tags, or watch export.
T+3h   Paste / XML → Dualis measured_tape[]  OR run literature prior.
T+3h   Engine prints: PCr after bench, seconds-to-80%, glycogen leak, F|D.
T+3h   Receipt hash. quinte_tape_present true only if tape fields were real.
Season Residual line opens only if ice-waste $ is in a signed book.
```

Roles: parent/guardian pays PA if they want CV. Coach pastes or imports. Dualis never hosts the clip. TeamSnap keeps the family graph.

## 2. Price — V8 list held, ticks added

CAD. Closed SKUs say CLOSED.

| SKU | List (V8) | Included GameTicks / 12 mo | Then |
|---|---|---|---|
| L0 Look | $0 | 0 | read |
| L1 Measure | $0 | 1 synthetic shift | not a season |
| Leaf SEC01 | **$49** | **8** (one seat) | Fuel |
| Branch SEC01 | **$299** | **40** (one bench) | Fuel |
| Trunk SEC01 | **$499** | **160** (20 seats × 8) | Fuel |
| Atlas | $1,499 | 0 hockey ticks | index only |
| Org residual | $0 + 19% proven Y1 | ticks still consume Fuel if over cap | no SaaS |

**GameTick** = one `run_period()` for one de-identified seat.  
**1 GameTick = 2 Fuel.** Extra ticks buy Fuel packs ($5 / $20 / $50 / $120 / $350).  
A 20-game AAA season for one player ≈ 20 ticks = 40 Fuel ≈ one $20 Practice pack if they blow past the 8 included.

Not included in Dualis list (buyer already pays elsewhere):

| Them | Meter |
|---|---|
| TeamSnap | USD $0–$26 / mo / team (their list) |
| LiveBarn | family subscription (their list) |
| Sportlogiq via LiveBarn PA | **USD $14.95 / game / player** |
| Hudl | club video seat (their list) |
| Watch | already owned |

Do not wrap $14.95 into Leaf $49. Do not say "Hudl included."

## 3. Season bill — worked examples (model, not a quote)

### A. One U16 seat, guardian, paste-only (no PA)

| Line | CAD |
|---|---|
| Dualis Leaf | 49 |
| Fuel if 20 games (12 ticks over cap × 2 Fuel) | ~20 |
| TeamSnap / LiveBarn / PA | $0 Dualis (theirs) |
| **Dualis year** | **~$69** |
| Residual | $0 (no measured waste book) |

### B. One seat + Sportlogiq cuts on 10 home games

| Line | |
|---|---|
| Dualis Leaf + overage Fuel | ~$69 CAD |
| LiveBarn PA 10 × USD $14.95 | **their bill ~USD $150** |
| Dualis does not invoice the $150 |

### C. Club bench (18 skaters, 20-game season, Trunk)

| Line | CAD |
|---|---|
| Dualis Trunk | 499 |
| Ticks used 18 × 20 = 360; included 160; overage 200 ticks = 400 Fuel | buy $350 Retain + $50 Practice ≈ 400 |
| **Dualis year cap** | **~$899** |
| Residual | 19% of *signed* avoided ice-waste only |

If they stay on priors and skip 10 games, they stay inside 160 and pay $499.

## 4. What operations will not do

- Scrape LiveBarn Hub or re-host spotlight video
- Badge Sportlogiq / Hudl / TeamSnap without a license
- Charge residual on `H = 138` or on a prior
- Sell a rest card to a named minor
- Open Stripe before `open: true` + grant scripts

## 5. Hatch copy (ops + price in one breath)

> TeamSnap knows who showed up. LiveBarn is the tape. Sportlogiq can cut the shift for USD $14.95. Hudl is the clip. Dualis names the leftover — CAD $49 a seat, eight games in. Nothing here is a prescription. CLOSED — request grant.
