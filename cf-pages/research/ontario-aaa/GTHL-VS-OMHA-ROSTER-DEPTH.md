# GTHL vs OMHA — public roster depth (Dualis pack fill)

**Captured:** 2026-09-12 (America/Toronto)  
**Scope:** Fun/exploratory. Compare public sources only. **No GTHL packs built.**  
**Branding law:** GTHL is its **own** conference/league lane — never under OMHA header. Ontario AAA ice portal nails OMHA first; GTHL separate.

**Rule:** Never invent players. Counts and names below are only what public pages published at capture.

---

## Verdict (Dualis pack fill)

### **Similar** — slight lean **easier for marquee GTHL clubs on Elite Prospects** once a season is loaded; **not** categorically easier end-to-end.

| Factor | Edge |
| --- | --- |
| EP full names (completed season) | **Tie** — both GTHL samples and Quinte OMHA U16 2025-26 look full (~17–24 athletes) |
| EP jersey # completeness | **OMHA Quinte / GTHL Marlboros–Don Mills** strong; **Vaughan / Mississauga Sens** EP jerseys thin |
| EP early next-season load (2026-27) | **GTHL Marlboros already full**; **Quinte OMHA thin (2)** — marquee GTHL may fill EP earlier |
| Official league site → roster | **Tie / neither** — gthlcanada.com has standings/news/all-stars, **no** central public team rosters |
| Club Sportsheadz Players pages | **Tie** — GTHL clubs (e.g. Toronto Marlboros) use Sportsheadz same pattern as OMHA |
| Universe size (ops) | **GTHL easier registry** — 12 AAA clubs × ages vs larger OMHA footprint |
| IG birth-year reveals | **Similar** — club IG exists; not a GTHL-only shortcut from this quick pass |

**Practical Dualis read:** Same pipeline as OMHA (`ROSTER-POPULATION.md`): club current-season Players → Prospect Report / EP same-season → IG. EP alone is **not** enough for every GTHL team’s jersey seat IDs. Do not treat GTHL as “EP dump and done.”

---

## 1) Elite Prospects — sample counts

Parsed from EP team season HTML / schema athletes + `jerseyNumber` fields (2026-09-12).

### GTHL U16 AAA samples

| Team | Season | Full names (athletes) | Jersey #s on EP | Notes |
| --- | --- | --- | --- | --- |
| Toronto Marlboros | 2025-2026 | **19** | **19** | Full G/D/F depth; names + numbers |
| Toronto Marlboros | 2026-2027 | **17** | **17** | Already near-full next season (`G: 2, D: 6, F: 9`) |
| Don Mills Flyers | 2025-2026 | **21** | **21** | Full; EP Roster Facts ~20 players |
| Vaughan Kings | 2025-2026 | **24** | **6** | Names strong; jersey coverage sparse on EP |
| Mississauga Senators | 2025-2026 | **17** | **1** | Names present; almost no jersey #s on EP |

EP URLs used:
- Marlboros: `eliteprospects.com/team/8178/toronto-marlboros-u16-aaa/{season}`
- Don Mills: `…/team/9245/don-mills-flyers-u16-aaa/2025-2026`
- Vaughan: `…/team/9663/vaughan-kings-u16-aaa/2025-2026`
- Mississauga Sens: `…/team/9679/mississauga-senators-u16-aaa/2025-2026`

### OMHA baseline (known thin next-season)

| Team | Season | Full names | Jersey #s | Notes |
| --- | --- | --- | --- | --- |
| Quinte Red Devils U16 | 2025-2026 | **18** | **18** | Full (`G: 2, D: 6, F: 10`) — same class as strong GTHL |
| Quinte Red Devils U16 | 2026-2027 | **2** | **0** | Thin — Dualis pack elsewhere has 17 via Prospect Report + validation (see `EP-QUINTE-U16-2026-2027-CROSSCHECK.md`) |

**Takeaway:** Completed-season EP depth is **comparable**. Upcoming-season EP is where **marquee GTHL** (Marlboros) currently looks **ahead** of Quinte OMHA — do not generalize that to every GTHL club without checking.

U15 / U14: not fully re-sampled here; MYHockey + EP both list GTHL U15/U14 AAA divisions with the same 12-club set. Expect similar EP pattern (better late in season / on marquee clubs).

---

## 2) Official GTHL site / standings → roster

- **gthlcanada.com** — standings portal, game-centre news, age chart, approved-teams PDF (12 AAA clubs × 8 ages = 96 AAA for 2026-27).  
- **No** public click-through to full team player lists (rosters live in HCR / club systems).  
- League publishes **subset** name lists for events (U16 Top Prospects, U18 All-Stars) — useful cross-check, **not** a pack source.

Third-party standings/rosters: MYHockey Rankings (often mirrors EP), RivalScores (scores/standings). Same role as for OMHA — secondary, date-check required.

---

## 3) Club sites / Sportsheadz

- **Toronto Marlboros** (`torontomarlboros.com`) — Sportsheadz / Teams/{id}/App|Players pattern (same family as OMHA Digital Network club sites). Confirmed App pages for prior-season teams; treat **current season breadcrumb** as primary seat source when present (privacy-truncated `First L` still valid seats per Dualis law).  
- Other GTHL AAA clubs generally run club sites + Sportsheadz app codes — expect the **same** club-primary path as OMHA, not a worse one.

---

## 4) Instagram birth-year patterns (quick)

- Club accounts (e.g. Marlboros) post team/champ content; GTHL org posts prospects lists.  
- No evidence in this pass that GTHL has a systematically better public birth-year IG reveal cadence than OMHA. Still treat `IG_REVEAL` as gold seal when a dated roster card exists — same pipeline.

---

## Evidence snapshot (names only — do not invent)

**Marlboros U16 2025-26 EP athletes (19):** Nolan Hardy, Egor Sokolov, Connor Ashcroft, Joshua Caputo, Christian Cucullo, Jaden Licastro, Maximus Mavrou, Shane Roche, George Zettas, Will Cameron, Jayden Challenger, Preston Hebert, Gianni Livolsi, Michael Pacek, Aaron Petrov, Mason Quinn, Braden Reilly, Miles Reilly, Michael Warner.

**Quinte U16 2026-27 EP athletes (2):** Ezekiel Gibson, Lucas Brown — thin vs Dualis 17-seat pack.

---

## Product implications (no build)

1. Keep **GTHL as separate branding / `on.aaa.gthl.*` seat namespace** — never nest under OMHA.  
2. Ontario portal priority stays **OMHA first**; GTHL is a later lane.  
3. When GTHL packs are eventually authorized: same confidence tags (`CLUB_CURRENT`, `PROSPECT_REPORT`, `ELITE_PROSPECTS`, `IG_REVEAL`); EP jersey gaps (Vaughan/Sens pattern) mean club pages remain primary for `#`.  
4. Smaller club count (12) helps **registry** ops even when roster-source difficulty is similar.

---

## Sources

1. Elite Prospects team season pages (curl + schema athlete / jerseyNumber parse) — 2026-09-12.  
2. gthlcanada.com standings / game centre / approved teams PDF / prospects articles.  
3. MYHockey GTHL U16 AAA division listing (12 teams).  
4. torontomarlboros.com Sportsheadz club surface.  
5. Local Dualis notes: `ROSTER-POPULATION.md`, `EP-QUINTE-U16-2026-2027-CROSSCHECK.md`.

No deploy. No GTHL roster packs. No players invented.
