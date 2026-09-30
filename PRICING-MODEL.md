# PRICING-MODEL.md — Per-decision meter (PIPE E)

**Status:** RAIL A (draft, unsealed). Father draws.
**Date:** 2026-09-30
**Root inequality:** attribution ≠ authorization. A meter says what a decision cost. It never says who may act.

---

## 1. What this is

A per-decision cost meter. It records what a decision consumed.
It does not set a price. It does not bill anyone. It does not
open a till.

```text
PIPE K  = what the decision claimed   (knowledge)
PIPE E  = what the decision cost     (efficiency)
```

A receipt with no E number is incomplete (RECEIPT-SPINE §3).
This file is the algorithm that fills that number.

---

## 2. The three inputs (measured, not estimated)

```text
watts   = energy the decision consumed
calls   = model/API calls the decision made
minutes = wall-clock time the decision took
```

Each is a measurement. None is a guess.

---

## 3. The algorithm (deterministic)

```text
E(d) = w·W(d) + c·C(d) + m·M(d)

W(d) = watts consumed by decision d
C(d) = number of calls decision d made
M(d) = minutes decision d took

w, c, m = weights (Father sets; default 1, 1, 1)
```

Default weights are unity. Father may reweight.
Reweighting is a seal act — PIPE D only.

---

## 4. Worked example

```text
decision:  mark SANDBOX-TEST.md
W = 0.4 Wh
C = 3 calls
M = 2 minutes

E = 1·0.4 + 1·3 + 1·2 = 5.4
```

The number is 5.4. It is not a dollar. It is a cost.

---

## 5. What E is NOT

```text
NOT a price
NOT a bill
NOT a till
NOT a coin
NOT a residual
NOT a royalty
NOT a security
```

E is a measurement. A price is a decision Father makes
separately, with counsel, after the meter is real.

---

## 6. Dualis-cut

```text
KEEP    three inputs, deterministic formula, receipt field
        default weights unity, Father reweights
HOLE    live watt/call/minute instrumentation
        weight table, price layer, billing rail
REFUSE  meter-as-till, E-as-coin, per-decision-paywall,
        meter required to look (STRESS 28)
```

---

## 7. Next step (Father's verb)

Desk marks this file. Twain² runs the loop.
DCLM collapses the claim.
Father draws if the meter is to become real.

```text
Look   = algorithm defined
Use    = Father.draw
Stake  = off
street = unchanged
```
