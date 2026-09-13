# Ontario AAA branches — DualisCapax

ED-COM-20260912-ON-AAA-BRANCH-V1  
Captured: 2026-09-12 (America/Toronto, UTC-4)  
**No player names or jerseys in this tree.** Team registries only.

## Law

Ontario AAA is **five Dualis brands**, not one OMHA umbrella.

```
on.aaa.{league}.{team}.{age}.{season}
         │
         ├── omha
         ├── gthl
         ├── heo
         ├── alliance
         └── noha      ← Great North Hockey League (GNHL) AAA
```

- **Never nest** GTHL / HEO / ALLIANCE / NOHA under `omha` in seats, nav, landers, or pack paths.
- GTHL is a **destination / deep** conference of its own (12 AAA clubs × 8 ages = 96 AAA teams). Ontario ice portal still **nails OMHA first**; GTHL is a later lane, not an OMHA child.
- NOHA AAA is **GNHL**, not NOJHL junior. Do not mix North Bay Battalion / Sudbury Wolves (OHL) / Soo Greyhounds (OHL) junior brands into this tree.
- Thunder Bay Kings play the GNHL circuit (HNO geography). Dualis still branches that circuit under `noha` — not a sixth brand.

## Why five folders

Hockey Canada minor AAA in Ontario is administered as **separate member leagues**. Dualis mirrors that:

| Dualis slug | Brand | Geography | U16 AAA depth (verified) |
|---|---|---|---|
| `omha` | Ontario Minor Hockey Association AAA | Greater Golden Horseshoe + eastern/central ON (Kingston → Grey-Bruce) | **20** (East 11 / West 9) — packs already exist |
| `gthl` | Greater Toronto Hockey League AAA | Toronto / Vaughan / Markham / Mississauga | **12** — destination; EP + official approved list |
| `heo` | Hockey Eastern Ontario AAA | Ottawa / eastern ON | **5** — tight grid; U18 adds OHA |
| `alliance` | ALLIANCE Hockey AAA | Southwest ON (Windsor → Waterloo / Brantford) | **10** official 2026-27 (East 5 / West 5) |
| `noha` | Great North Hockey League AAA (under NOHA) | Northern ON + Thunder Bay on the GNHL sheet | **3** U16 + **7** U18 — sparse |

Interlock guests stay on their **home brand**. Example: Sault Major Jr Greyhounds appear on official ALLIANCE U14/U15 2026-27 standings — Dualis `league` remains `noha`. North Bay / Sudbury 9-GP cameos on OMHA U14 2025-26 West stay `noha`.

## Tree

```
research/ontario-aaa/
  ONTARIO-AAA-BRANCHES.md          ← this file
  ROSTER-POPULATION.md             ← pipeline; now points here
  omha-u16.2026-2027.index.json    ← original pack index (kept)
  rosters/                         ← original OMHA packs (kept)
  leagues/
    omha/     README + teams.u14/u15/u16/u18 + copy of pack index + rosters symlink
    gthl/     README + teams.u14/u15/u16/u18
    heo/      README + teams.u14/u15/u16/u18
    alliance/ README + teams.u14/u15/u16/u18
    noha/     README + teams.u16 + teams.u18
```

Each `teams.{age}.{season}.index.json` is `{ slug, name, division?, sources[] }` plus capture metadata. **Empty roster files are not required yet** except existing OMHA U16 packs.

## Product seats

```
on.aaa.omha.quinte-red-devils.u16.2026-2027
on.aaa.gthl.toronto-marlboros.u16.2026-2027
on.aaa.heo.ottawa-jr-67s.u16.2026-2027
on.aaa.alliance.london-jr-knights.u16.2026-2027
on.aaa.noha.north-bay-trappers.u16.2026-2027
```

Same claim pipeline as `ROSTER-POPULATION.md` once a brand is authorized for packs. EP alone is **not** a pack source.

## What this pass did / did not

**Did:** verify team lists from official standings / approved-team PDFs / EP league pages for 2025-26 and 2026-27. Cite URLs on every index.

**Did not:** invent players, jerseys, or missing clubs. No deploy. No GTHL/HEO/ALLIANCE/NOHA roster packs.

Sun County Panthers: on official ALLIANCE **U14 and U15** 2026-27; **not** on official U16 or U18 2026-27 (still on EP U16 historical list + club announced a U16 HC in Feb 2026). Held out of U16 until official standings list them.
