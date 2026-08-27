# GRAPH — schema for a blankable plate
2026-08-27 00:44 EDT
Property graph. Not a warehouse. Values hang off handles and can be deleted without losing the map.

## Why a graph
Layer 1+2 *are* a graph: bodies, organs, species, overlay class.
A table of X cannot answer "does this organ grow here" after you blank X.
A graph can.

## Node labels
`(:Body)` one organism. Props: `geo_id`, `grain` (CSD|CMA|site|vendor_metro), `name`, `statute`, `amalg_yr`.
`(:Family)` playground family. Props: `fam` (P|W|S|M|K|H|E|F|G|R|T|$).
`(:Organ)` the ID. Props: `id` (e.g. S.POLICE.MUNI), `unit`, `geo_flex` (bool).
`(:Species)` the animal, not the word. Props: `sp` (municipal_police | opp | subway | city_bus | ahl | ohl).
`(:Source)` where a pull goes. Props: `url`, `kind` (statcan|civic_pdf|cmhc|tenant|vendor).
`(:Cache)` ephemeral value. Props: `x`, `year`, `fetched`, `src_hash`. May be deleted in bulk.
`(:Tenant)` operator inside a Body. Props: `legal_name`. Isolation: no edge between tenants.

No node for "the number 132485". That is a Cache or nothing.

## Edge types
`(:Body)-[:IN_GRAIN]->(:Body)` CSD in CMA. Never treat as same node.
`(:Body)-[:HAS {stamp}]->(:Organ)` stamp in {SEALED,N/A,HOLE,WAIT,UNLEARNABLE}.
`(:Organ)-[:IS_A]->(:Species)`
`(:Organ)-[:IN_FAMILY]->(:Family)`
`(:Organ)-[:SPLIT_OF]->(:Organ)` bus split of transit_rides.
`(:Organ)-[:REFUSES_PAIR]->(:Organ)` TTI vs TomTom. Δ gate lives here.
`(:Body)-[:OVERLAY {class, vs}]->(:Organ)` class in {STRONG,WEAK,ABSENT}; `vs` is the other body's geo_id.
Better: `(:Body)-[:OVERLAY {class}]->(:Body)` **on** an organ via a three-way or a thin `(:Bond)` node:
`(:Bond {class, organ_id})-[:OF]->(:Organ)`, `(:Bond)-[:LEFT]->(:Body)`, `(:Bond)-[:RIGHT]->(:Body)`.
Bond is the relation layer. Delete every Cache; Bond remains.
`(:Organ)-[:PULLS]->(:Source)` the recipe.
`(:Cache)-[:FOR {year, grain}]->(:Organ)`
`(:Cache)-[:ON]->(:Body)`
`(:Tenant)-[:OPERATES]->(:Organ)`
`(:Tenant)-[:SITS_IN]->(:Body)`

## Constraints
Unique (`Body.geo_id` + `Body.grain`).
Unique (`Organ.id`).
Unique (`Bond`) on (left, right, organ_id).
HAS.stamp = N/A ⇒ no Cache allowed on that pair.
HAS.stamp = ABSENT overlay ⇒ no Δ edge.
Two Cache on same (Body, Organ, year, grain, src) = Δ.BOOK, not a merge.

## Queries that must work with Cache deleted
- Organs on Kingston with stamp ≠ N/A.
- STRONG bonds Kingston—Toronto.
- WEAK words still unsplit.
- ABSENT ceiling organs on any atom.
- Pull recipe for W.WTP_MLD on a named CSD.
- Tenant organs that must not join civic peak.

## Queries that need a Cache (test-time)
- Δ.TIME P.N Belleville 2016 vs 2021 — only if two Cache exist and gate passes.
- Δpp rent Kingston vs Toronto — only if overlay STRONG and both Cache sealed.

## Storage rule
Persist Body, Family, Organ, Species, Source, Bond, HAS.
Cache is a run. TTL or wipe-on-demand.
Index-complete = every Organ has HAS to every Body we care about, and every non-N/A HAS has a PULLS recipe.
Not = every Cache filled.

## Physical
Labeled property graph (Neo4j / Memgraph / PG). RDF optional later; do not start there — overlay class as an edge property is the natural shape.
One graph per Canadian frame until a second country writes its own Body set.

## Anti-patterns
A node named "132485".
An edge CITY_EQUALS_CMA.
Averaging three congestion Cache into one node.
Sharing a Tenant across Bodies.
Storing a password on a Source node.
