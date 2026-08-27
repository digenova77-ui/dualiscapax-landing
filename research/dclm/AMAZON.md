# DCLM Amazon — control split and department weights
2026-08-26 21:51 EDT

Parent: `tweak.commerce.marketplace.amazon`
Not one Amazon number. Department tweaks under one parent.
Drop parent or any child → `dclm.base`.
No live Amazon feed tonight. Scores WAIT.

## Control split (required on every Amazon meter)

| pole | meaning | residual lives |
|------|---------|----------------|
| A | Amazon-controlled | FC they operate, inventory they title, 1P retail, their software path, their policy hold |
| B | Chain they do not directly control | 3P seller ops, vendor factory, outside carrier after handoff, customer last-mile they do not run |

A dashboard that mixes A and B into one "Amazon loss" is graft.
Amazon can be *exposed* to B without *booking* B. Those are two meters.

## Department tweaks (rows exist even at weight ~0)

Nothing is ignored as a row. A row may carry weight ≈0 until the loop has measured it.
Ignored in the English sense is forbidden. Unweighted-until-measured is required.

| id | grain |
|----|-------|
| tweak.commerce.marketplace.amazon.retail_1p | titled inventory |
| tweak.commerce.marketplace.amazon.marketplace_3p | seller + Amazon take-rate / policy |
| tweak.commerce.marketplace.amazon.fulfillment | FC labor, stow, pick, pack |
| tweak.commerce.marketplace.amazon.transport | linehaul they book vs carrier they don't |
| tweak.commerce.marketplace.amazon.last_mile | owned vs contracted |
| tweak.commerce.marketplace.amazon.returns | |
| tweak.commerce.marketplace.amazon.ads | |
| tweak.commerce.marketplace.amazon.devices | |
| tweak.commerce.marketplace.amazon.aws | only if that instance is in scope |
| tweak.commerce.marketplace.amazon.policy_trust | holds, suspensions |
| tweak.commerce.marketplace.amazon.corporate | overhead not allocated yet |

## Weights

Start as empty slots, not as a story about what Amazon "really" cares about.
Update from: instance data if a seller/account scope exists, public residual if P1, simulation labeled M, real-world validation when a meter is implemented and read back.
Critical vulnerability = a meter whose residual moves the parent a lot **after** weights exist. Not a press take.

## Isolation

Hockey, school_board, oncology stay out.
A Dualis seller-scope instance may use marketplace_3p + policy_trust. It may not invent FC labor numbers Amazon has not published to that instance.
