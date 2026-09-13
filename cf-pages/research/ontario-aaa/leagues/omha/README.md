# OMHA AAA — Dualis brand `omha`

**League:** Ontario Minor Hockey Association AAA (OMHA Digital Network / omha-aaa.net)  
**Geography:** East (GTA fringe + Simcoe + Kawartha + Quinte + Kingston) and West (Halton / Hamilton / Niagara / Guelph / Grey-Bruce / Southern Tier).  
**Dualis seat prefix:** `on.aaa.omha.{team}.{age}.{season}`  
**Captured:** 2026-09-12 (America/Toronto)

## Brand notes

- This is the **first** Ontario AAA lane Dualis already packed (U16 2026-27).
- 20 AAA clubs on the official omha-aaa.net member list. Same 20-club grid at U14 / U15 / U16 / U18.
- East 11 / West 9 at U16 (MYHockey + existing Dualis pack + 2025-26 official standings).
- **Not** a parent of GTHL / HEO / ALLIANCE / NOHA. Those are sibling brands.

## Existing packs (do not rebuild)

| Path | What |
|---|---|
| `omha-u16.2026-2027.index.json` | Copy of the original pack index (counts, confidence, staff flags) |
| `rosters/` | Symlink → `../../rosters/` (20 U16 JSON packs + Quinte U18) |
| `OMHA-U16-2026-2027.md` | Copy of pack summary |
| `teams.u16.2026-2027.index.json` | Dualis team registry shape (`slug` / `name` / `division` / `sources`) |

Pack status lives in the copied summary: Markham U16 incomplete (club empty); Grey-Bruce partial (6). Kingston flagged `soft_for_user_check`.

## Team counts (this pass)

| Age | Birth year (2026-27) | Teams | Source |
|---|---|---|---|
| U14 | 2013 | **20** | 2025-26 official U14 standings + 2026-27 schedule |
| U15 | 2012 | **20** | omha-aaa.net 20-club list + 2026-27 U15E/U15W schedule labels |
| U16 | 2011 | **20** | existing pack + 2025-26 official standings |
| U18 | 2009–2010 | **20** | 2025-26 official U18 standings + 2026-27 schedule |

2025-26 U14 West also listed North Bay Trappers and Sudbury Wolves at 9 GP — **NOHA interlock**, not OMHA clubs. 2025-26 U16 West listed NOHA White / NOHA Black (2 GP exhibition) — same rule.

## Sources

- https://omha-aaa.net/
- https://omha-aaa.net/Groups/1210/Standings/ (U16 2025-26)
- https://omha-aaa.net/Rounds/30855/OMHA_AAA_League_2025-2026_U14_Regular_Season/
- https://omha-aaa.net/Rounds/30863/OMHA_AAA_League_2025-2026_U18_Regular_Season/
- https://omha-aaa.net/Schedule/ (2026-27 already labeled U14/U15/U16/U18)

No new players. No deploy.
