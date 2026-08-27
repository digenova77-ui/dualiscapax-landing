# DCLM tweak index
2026-08-26 21:48 EDT

Tweaks are indexed, not invented as new bases.
The list may run to thousands. The base does not.

## ID

`tweak.<industry>.<sector>.<specialization>`

Optional instance suffix (not published when it names a minor or a vaulted feed):
`tweak.<industry>.<sector>.<specialization>#<instance>`

Unknown triple → do not mint an ID that scores. Mint `tweak._pending.<slug>` at WAIT until classify lands.

## Record (every row)

| field | required |
|-------|----------|
| id | yes |
| parent pack | yes |
| residual_unit | yes |
| friction_unit | yes |
| affinity_unit | yes |
| acuity_unit | yes |
| wait_until | yes |
| drops_to_base | must be true |
| status | seed \| lifting \| live \| wait |
| instance_count | integer |

A row missing units or `drops_to_base=false` is not in the index.

## Seed (declared tonight)

| id | status |
|----|--------|
| tweak.health.oncology.solid | live leaves |
| tweak.health.oncology.ovarian_hrd | lifting |
| tweak.health.neurological.als | live prototype |
| tweak.education.k12.board_process | wait (no named feed) |
| tweak.commerce.marketplace.amazon_seller | seed |
| tweak.property.real_estate.parcel | seed |
| tweak.sport.ice_hockey.AAA | wait (no schedule drop) |
| tweak.civic.process.argument | seed |
| tweak.congregation.process.ops | seed |
| tweak.knowledge.library.ops | seed |
| tweak.industry.engineering.firm | seed |

## Growth rule

A new situation does not add a base.
It adds a row, or it sits at `tweak._pending.*` until industry/sector/specialization is named.
Peer smash only among rows that share the same id prefix through `<sector>`.
Cross-sector only if a shared meter ID exists in both rows and both datasets contain it.

Machine face later: `research/dclm/index/tweaks.jsonl` one record per line.
Do not flatten ten thousand rows onto the public homepage.
