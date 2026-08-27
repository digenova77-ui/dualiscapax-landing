# MESH — simple engine, full plate
2026-08-27 00:53 EDT
Design. Not a trained model sitting on headlines.

## Why this is the network
Bodies, organs, species, bonds already *are* a graph.
A conventional NN would bury that graph in weights and then need the same IDs back out.
Do not do that. Keep the graph explicit. Let "learning" be new HAS stamps and new splits.

## Six node types (do not grow this list)
Body · Organ · Species · Source · Bond · Cache
Clock is a property or a child Organ (`*.CLOCK`), not a seventh type.
Tenant is a Body with `grain=site`.

## Four signals (do not grow this list)
`HAS.stamp` · `OVERLAY.class` · `PULL` · `PREDICT`
STRONG passes a query. WEAK stops the query and demands a split. ABSENT returns N/A. HOLE returns recipe not guess.
That is the entire activation function.

## Forward pass (one question)
1. Parse ask → Organ ids + Body + window T.
2. Walk only STRONG bonds if comparing Bodies.
3. If CLOCK exists, condition on T. Else coarsen T or refuse.
4. PULL Cache if the ask needs X. Else answer from HAS + CLOCK.
5. Residual = cost organ minus service organ on the same Body when both exist.
No hidden layer. Depth = number of organs you named, not number of matrices.

## Self-attack (the network improves itself)
On every pass, emit:
- orphan page → IDENTIFY (cut ID)
- one word two animals → SPLIT
- Cache with no HAS → defect
- WEAK still used as ratio → defect
- headline with no organ → drop (BIAS)
Agents run this loop. That *is* training. Weights are stamps, not floats.

## If a numeric net is added later
It sits **on** Cache of one Organ, one Species, one grain.
Example: P(S.CRIME.BIKE.REPORT | beat, hour) from TPS open data only.
It must not eat Bond or rewrite Species.
Cross-city net = illegal unless overlay is STRONG and definitions match.
Until that net exists, PREDICT is count/exposure or CLOCK state.

## Simplicity test
Can you explain a miss by pointing at one missing Organ or one wrong class?
If you need a layer name to explain it, the engine got fat. Cut the engine, keep the plate.

## Build order
GRAPH schema → HAS on four Bodies → PULL recipes → CLOCK where posted → one-organ predictors → never a soup model.
