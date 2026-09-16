# LEAGUE_SHAPE

Task: shape every hockey league the OHF-five way.
Hockey is an instance. The genome is: org → members → divisions → public cite → awaiting_* .
Never invent a player or a team. Dualis ≠ Sportsheadz.

## Pack (copy this folder shape)

```
research/hockey/<ring>/<org>/
  INDEX.json     # official name, site, governing parent, jx, season
  CITE.md        # URLs actually fetched + date
  HOLES.md       # awaiting_roster awaiting_schedule awaiting_rights
units/sports/hockey-<ring>/
  UNIT.md        # what this unit may write
```

INDEX.json fields only if cited:
org, parent (Hockey Canada / USA Hockey / IIHF / …), jx, gender, age_band,
level (AAA/AA/A/house/recreational), season, official_url, harvested_at.
No child names. No photos.

## Rings (work outward)

1. OHF five — already a line (`hockey_ohf_five.yml`). Keep it the gold stamp.
2. Other Hockey Canada members (Hockey Eastern Ontario, HEO, Hockey NW Ontario, …) — one INDEX per member or `awaiting_cite`.
3. Other Canadian provinces — Hockey Alberta, Hockey Québec, BC Hockey, … same genome.
4. USA Hockey districts — `awaiting_ring` until a public index URL is in CITE.md.
5. IIHF members — name the federation first; do not scrape a roster.

A ring with no official URL is a hole. Do not fill it with Wikipedia memory.

## Clocks

Do not stack on :09/:39 (OHF) or :17/:47 (OMHA U16) or :12/:42 (OWHA).
New harvest = new :mm pair. `[skip ci]`. Do not push HTML landers.

## Plate

Live mouth = `/ice-desk/` after swallow.
Packs do not become production because they committed.
`/ice` stays cursed until curl says otherwise.

## AND

Look $0. No PII. No Spordle bind. No Helix. TeamSnap = awaiting_oauth.
Print ticket 1 from factory_verify before adding a sixth hockey workflow.
