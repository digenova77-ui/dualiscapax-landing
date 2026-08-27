# NAMING — municipal organs
2026-08-27 00:47 EDT
IDs already frozen in PLAYGROUND.md. This file is the grammar so a new organ gets one name, not three.

## Shape
`FAMILY.TOKEN` optional `.SPECIES` optional `.BOOK`
Family is one letter from the frozen catalog: G P $ W SW E M S H K F R T N L
TOKEN is the organ, not the department title.
"Infrastructure Services" is not an ID. Split it to W / SW / M.ROAD / M.TRANSIT.

## Species is the animal
The civic word is cheap. The species is the ID.
`S.POLICE` is a word. Cut:
`S.POLICE.MUNI` Kingston Police, Belleville Police, TPS
`S.POLICE.OPP` Quinte West contract
`S.POLICE.RCMP` if it ever sits as the municipal force (rare in ON cities)
Same for fire career vs volunteer-majority, transit bus vs subway vs streetcar, landfill in-CSD vs owned-out, airport in vs out vs military.
If two bodies share only the word, the ID was too short. Split. Then overlay.

## Book is the ledger, not a second organ
`H.TCHC_SOGR.CORP` and `H.TCHC_SOGR.CITY` are one organ, two books.
`P.N.CENSUS` and `P.N.EST` same.
`$.NBV` vs `$.AM` are different *measures* of asset — keep as sibling IDs already in the catalog, not as species.
Tenant: `E.PEAK_MVA.TENANT` beside `E.PEAK_MVA`. Never overwrite.

## Grammar rules
1. One concept, one ID. Synonyms (`SW.GARBAGE` vs `SW.T`) are a defect. Use the frozen token.
2. Units live on the organ (`W.WTP_MLD`, `M.ROAD_KM`), not in a parallel name.
3. Geography is not in the ID. `M.AIR_IN` + Body.geo = Billy Bishop. Pearson is `M.AIR_OUT` on Toronto, `M.AIR_IN` on Mississauga.
4. Operator in the ID only when operator *is* the species (OPP vs muni). "Utilities Kingston" is a Source / Tenant, not `W.UK`.
5. Do not encode year. Year is Cache.
6. Do not encode rank or "better". Residual is a query.
7. New family letter only if the frozen list cannot hold it. Prefer a TOKEN under an existing letter.
8. ALL CAPS tokens. Dot separators. No spaces. No city names in the token.

## Cut test (when a file arrives)
Can this column hit an existing Organ.id?
- Yes → pull, stamp Cache.
- Hits the word but not the animal → cut `.SPECIES`, write Bond WEAK until both sides have the new ID.
- Hits nothing → propose `FAMILY.TOKEN`, add to PLAYGROUND, then pull. Do not measure an orphan.

## Department → organ (refuse the blend)
City budget line → organs it actually is:
Transportation → `M.BUS` `M.SUBWAY` `M.ROAD_KM` `M.SIGNAL_N` (split)
Housing Secretariat → `H.TARGET` `H.TCHC_*` `H.NONPROF` (split)
Corporate Finance → `$.LEVY` `$.DEBT_SVC` `$.RESERVE` (split)
Utilities Kingston → `W.*` `E.*` as operated, wrapper is Tenant

## Spoken name vs ID
Spoken: "Kingston's municipal police."
ID: `S.POLICE.MUNI` on Body `35010010` (example DGUID).
The graph stores the ID. Prose may use the spoken name once, then the ID.

## Residual naming
Do not invent `R.WASTE_SCORE`.
Residual is `f(Organ_cost, Organ_service)` at query time.
If a residual keeps coming back as its own published civic line (water loss %), it may earn a TOKEN (`W.LOSS_%`) because the city already named the organ. Until then it is a query.
