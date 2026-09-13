# Quinte Red Devils U16 AAA 2026-2027 — Dualis pack vs Elite Prospects

**Captured:** 2026-09-12 (America/Toronto)  
**Dualis pack:** `rosters/quinte-red-devils.u16.2026-2027.json` (also echoed in `js/ice-portal.js` `FALLBACK_PACK`)  
**EP season page:** https://www.eliteprospects.com/team/8623/quinte-red-devils-u16-aaa/2026-2027  
**EP default team URL:** https://www.eliteprospects.com/team/8623/quinte-red-devils-u16-aaa — same season tab (2026-2027); identical 2-player roster.  
**Rule:** No invented names. Only names present in Dualis pack and/or EP HTML/`__NEXT_DATA__`.

## EP 2026-2027 roster (complete extract)

| Jersey (EP) | Pos | Name | EP player path |
| --- | --- | --- | --- |
| *(none)* | G | Ezekiel Gibson | `/player/1287018/ezekiel-gibson` |
| *(none)* | D | Lucas Brown | `/player/1092773/lucas-brown` |

EP footer facts for this season: **G: 1, D: 1** (2 players total). No forwards listed. No jersey numbers published on EP for either player.

## Depth check (incomplete season vs prior)

| Source | Season | Player count |
| --- | --- | --- |
| Dualis pack (USER_VALIDATED) | 2026-2027 | **17** |
| EP Quinte U16 | 2026-2027 | **2** |
| EP Quinte U16 | 2025-2026 | **18** (jerseys present; full G/D/F depth) |

**Conclusion:** EP 2026-2027 Quinte U16 looks **incomplete** relative to normal U16 AAA depth (prior EP season had 18; Dualis has 17). Treat EP as first-name enrichment only for the two matched seats — not as an authoritative full roster yet.

## Seat-by-seat comparison (Dualis → EP)

| Dualis seat | EP match? | Notes |
| --- | --- | --- |
| #32 N. Armstrong (G) | No | Missing on EP 2026-2027 |
| #31 E. Gibson (G) / preferred Ezekiel Gibson | **Yes** | EP: Ezekiel Gibson (G); Dualis initial form + enriched first; EP has no jersey |
| #7 L. Brown (D) / preferred Lucas Brown | **Yes** | EP: Lucas Brown (D); Dualis initial form + enriched first; EP has no jersey |
| #11 R. Cousins (D) | No | Missing on EP |
| #10 T. Gervais (D) | No | Missing on EP |
| #13 D. Illingworth (D) | No | Missing on EP |
| #8 J. Jones (D) | No | Missing on EP |
| #96 D. Vincent (D) | No | Missing on EP |
| #17 C. Crawford (F) | No | Missing on EP |
| **#29 D. Di Genova (LW)** | **No** | **Flagged below** |
| #16 L. Dupont (F) | No | Missing on EP |
| #73 C. Helmer (F) | No | Missing on EP |
| #18 M. Hoar (F) | No | Missing on EP |
| #19 O. Kellar (F) | No | Missing on EP |
| #27 C. Mercer (F) | No | Missing on EP |
| #22 K. Patterson (F) | No | Missing on EP |
| #23 W. Prinzen (F) | No | Missing on EP |

### On EP but not in Dualis pack

None. Both EP names map to Dualis seats (#31 Gibson, #7 Brown).

### Dom Di Genova #29 (flag)

- **Dualis:** jersey **29**, display `D. Di Genova`, preferred alias `Di Genova`, pos **LW**, `seat_note`: USER_VALIDATED household LW #29. Present in pack JSON and `FALLBACK_PACK`.
- **EP 2026-2027 Quinte U16 roster:** **not listed**.
- **EP player search (web):** no Dom / Domenic / “D. Di Genova” Quinte U16 profile found; only unrelated EP surnames (e.g. Robert Di Genova, Andrea/Paolo DiGenova) with no Quinte U16 link observed in this check.
- **Active Dualis roster status:** Yes — on the USER_VALIDATED pack; absence from EP does **not** remove him from Dualis.

## EP coverage for older AAA ages (full names)

For older Ontario AAA ages (U14 / U15 / U16 / U18), Elite Prospects maintains dedicated **team season pages** and per-player pages that typically publish **full legal-style names** (not initials), often with jersey, position, DOB, and bio fields once the roster is populated. Examples: Quinte Red Devils **U16 AAA** team `8623` (2025-2026 season lists full names such as Nathan Ferriss, Landen White, Andrew Laurin, Lauchlan Whelan with jerseys; 2026-2027 currently only Ezekiel Gibson and Lucas Brown, each with their own player URL); Quinte Red Devils **U18 AAA** team `5413` (e.g. 2024-2025 roster lists full names such as Jaime Bales, Wyatt Albright, MacLean Chisholm, Liam Grant with jerseys). Those team + player pages are the normal EP surface for cross-checking Dualis seats when EP has finished loading a season — which, for Quinte U16 2026-2027 as of this capture, it has not.

## Sources used

1. Local Dualis JSON pack (17 seats).  
2. WebFetch of EP 2026-2027 and default team URLs (2 athletes in page body).  
3. curl + `__NEXT_DATA__` parse of EP 2026-2027 (2), 2025-2026 (18), and U18 2024-2025 (24) for depth / full-name citation.  
4. Web search for Di Genova on EP (no Dom Quinte U16 hit).

No deploy. No roster edits.
