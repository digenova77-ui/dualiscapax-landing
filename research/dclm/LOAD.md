# DCLM load — categorize, then tweak
2026-08-26 21:45 EDT

A first-time dataset is not a new model.
On load, classify, then attach a tweak. Base stays still.

## Classify (automatic on ingest)

1. Industry
2. Sector
3. Specialization

That triple selects the pack. Unknown triple → WAIT + proposed dictionary that must still drop to dclm.base. Do not score.

## Build the tweak from

- What this instance has actually done (fields, n, k, complexity, missing edges)
- What peers in this pack already showed
- Competitor instances only if they sit in the same pack
- Real-time loop: new facts update the tweak, never the base

## Loop

New row / new event → recompute n, k, complexity, wait, friction, affinity, acuity.
Drop tweak at any time → dclm.base.
If the loop invents meters that cannot drop, stop. Graft.

## Honest bound

Classification and pack attach are live as law.
The loop runs when a feed exists. No feed → WAIT, not a fake dashboard.
No competitor is used across packs.
