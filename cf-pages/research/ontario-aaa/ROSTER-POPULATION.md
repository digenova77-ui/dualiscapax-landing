# Roster population — path to truth

ED-COM-20260912-ROSTER-POP-V1  
Product law: this is how DualisCapax fills Ontario AAA team/player seats for the app.

## Why

Stale club pages and prior age-band lists lie. A 2024–25 U14-2011 Quinte list is **not** the 2026–27 U16 team. Players move (Patterson → Gaels, Haley → Whitecaps, Pettey → Halton). Populating the app the wrong way = wrong Unity binds.

## Pipeline (ordered)

```
1. Season + birth_year lock
   e.g. 2026-27 U16 → birth_year 2011

2. Team registry (league-approved)
   OMHA | GTHL | HEO | ALLIANCE | NOHA(GNHL) × age
   Canonical files: leagues/{omha,gthl,heo,alliance,noha}/
   Public. No player PII required. See ONTARIO-AAA-BRANCHES.md

3. Current-season roster sources (pick strongest available)
   a. Instagram birth-year account roster reveal  ← holy grail (# / name / pos / face)
   b. The Prospect Report team sheet (dated this season)
   c. Club site CURRENT season team page only
   d. TeamSnap / GameSheet when connected (canonical after bind)
   FORBIDDEN: prior-season pages, wrong age band, Elite Prospects alone without date check

4. Mover audit
   Cross-check marquee names against other clubs this season.
   If conflict → mark CONFLICT; do not bind until IG / org confirms.

5. Staff bind
   HC / assistants from current club contact for that age band.

6. Seat IDs
   on.aaa.{league}.{team}.{age}.{season}.#{jersey}.{pos}
   Display names org-private; public lander stays de-ID.

7. Claim
   Pick team → pick name → Spordle/HCR (preferred) and/or TeamSnap email prove
   → Dualis passphrase seals vault

8. Provenance
   Every roster JSON stores: source, captured_at, confidence, conflicts[]
```

## Confidence tags

| Tag | Meaning |
|---|---|
| `IG_REVEAL` | From season IG highlight cards |
| `PROSPECT_REPORT` | Prospect Report dated this season |
| `CLUB_CURRENT` | Club current-season page |
| `USER_VALIDATED` | Operator/parent confirmed |
| `STALE_COHORT` | Prior band — **never ship** |
| `CONFLICT` | Sources disagree — hold bind |

## Quinte U16 AAA 2026–27 (pack #1)

- `team_id`: `on.aaa.omha.quinte-red-devils.u16.2026-2027`
- Bench: Rowe HC · Culhane · Boomhower (`USER_VALIDATED` + club contact)
- Roster file: `rosters/quinte-red-devils.u16.2026-2027.json`
- Source: The Prospect Report 2026-09-07 + user validation 2026-09-12
- Confidence: `PROSPECT_REPORT` + `USER_VALIDATED` (IG still preferred gold seal)

## Build order for the app

1. Encode this pipeline in onboard / org seat claim UI.
2. Seed team registry all leagues × U10–U18 (`leagues/` tree is the U14–U18 start).
3. Ingest season sheets → private roster packs (not public lander dumps).
4. Wire Spordle + TeamSnap prove.
5. Operator “refresh roster” job: re-run steps 3–4 before each season / after tryouts.

## Club current-season Players pages (OMHA / Sportsheadz)

Primary **live** roster for a season: each club site under that season → `Teams/{id}/Players/`.
Example: `https://peterboroughminorpetes.ca/Teams/1768/Players/` (U16, season 2026-2027 when selected).
- Names may be privacy-truncated (First + last initial) — still valid seat list.
- Expand full surnames via Elite Prospects (U16+) / Prospect Report / linear progression.
- OMHA league site team click-through also links into these rosters.

## Echo-only law

Never invent or recreate player data. Only echo what a verified source publishes.
- Club First + last initial seats are **valid** pack rows (Unity claim later proves via Spordle/HCR or TeamSnap).
- Do not guess surnames to “complete” a roster.
- Surname expansion only when uniquely evidenced (EP / Prospect Report / linear with unique First+initial+BY+jersey).

## Identity vs aliases

Populate **all seats first**; fine-tune nomenclature second.

Per seat:
- One stable **player identity** (team + jersey + birth year + club seat as published).
- **aliases[]** — every verified name form (club `First L`, EP full name, `F. Lastname`, …). Never invent aliases.
- **preferred_alias** — best proven display so far (upgrade as evidence arrives).

Full surname when uniquely evidenced is the goal for display — not a requirement for the seat to exist. Spordle/TeamSnap still prove claim.

## OMHA U16 identity + club-primary (2026-09-12)

ED-COM-20260912-OMHA-U16-CLUB-PRIMARY

For **U16 AAA+** Ontario packs:

1. **Club CURRENT season Players page** (Sportsheadz / OMHA Digital Network, season breadcrumb `2026-2027`) is the primary seat source — including privacy-truncated `First + last initial`.
2. Prospect Report season sheet → Elite Prospects **same-season** team page → IG reveal.
3. Do **not** invent surnames. Seats exist with club display as published.
4. Each seat stores `display_name`, `aliases[]` (every verified form), `preferred_alias` (best proven so far).
5. Linear/EP surname expansion only when **uniquely evidenced** (jersey + initials); tag `LINEAR_PROGRESSION` / `ELITE_PROSPECTS` with evidence.
6. Full identity bind later via Spordle/HCR or TeamSnap.

OMHA U16 2026-27 packs: `rosters/*.u16.2026-2027.json` · index `omha-u16.2026-2027.index.json` · summary `OMHA-U16-2026-2027.md`.



## League branch tree (2026-09-12)

ED-COM-20260912-ON-AAA-BRANCH-V1

Ontario AAA is **five Dualis brands**, not OMHA-plus-children. Team registries (no player seats except existing OMHA U16 packs):

```
leagues/omha/       20 U16 (packs exist) · U14/U15/U18 stubs
leagues/gthl/       12 U16 · U14/U15/U18 stubs (destination / own brand)
leagues/heo/        5 U16 · U14/U15 stubs · U18 = 6 (adds OHA)
leagues/alliance/   10 U16 official · U14/U15/U18 differ by age
leagues/noha/       3 U16 + 7 U18 GNHL (sparse; not NOJHL)
```

How Dualis branches: `ONTARIO-AAA-BRANCHES.md`.  
Seat prefix: `on.aaa.{omha|gthl|heo|alliance|noha}.{team}.{age}.{season}`.

Never invent players. Never nest GTHL/HEO/ALLIANCE/NOHA under OMHA.
