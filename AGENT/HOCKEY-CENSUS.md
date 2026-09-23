# Hockey census — what is filled, what is not

Stamp: 2026-09-23T14:40Z
Season: 2026-2027
Law: cite-or-hole. Never invent a player.

## Short answer

We cannot name “how many OHF U8–U18 teams are empty” because we never built the U8–U18 ladder.
What we *did* build:

| Pack | What it is | Teams on disk | Rosters filled | Empty / stub |
|---|---|---:|---:|---:|
| OMHA U16 AAA | one age, one class | 20 | 8 | **12** |
| OWHA U18 AA + U22 AA | two divisions | 70 | 0 | **70** |
| OHF five | homepage ping + seed orgs | 16 seed orgs | 0 players | seeds only |
| HEO / HNO | marked beside the plate | 0 | 0 | not started |
| Alliance / GTHL / NOHA teams | not harvested | 0 | 0 | not started |
| U8 U9 U10 U11 U12 U13 U14 U15 U18 boys | no pack | 0 | 0 | not started |

OHF five `org_count` is 4+4+4+3+1 = **16 named orgs**, not hundreds of clubs.
NOHA homepage ping was `cite_ok: false` last capture.

## Why the search is not finding rosters

1. **Wrong job.** `hockey_ohf_five.yml` only pings five league homepages and rewrites the same seed list. It does not walk TeamSnap, SportsEngine, or club `/Teams/N/Players/` boards except where the OMHA U16 script already does.
2. **Wrong ages.** Live harvests are U16 AAA boys + OWHA U18/U22. U8–U15 and U18 boys are not a unit.
3. **Public boards hide names.** 12 of 20 OMHA U16 AAA club player pages returned `seat_count: 0` / `awaiting_player_cites`. The URL exists. The cite has no names. That is a locked board, not a missing URL.
4. **OWHA stubs.** 70 teams have `roster: []` on purpose. Standings pages are not rosters.
5. **HEO and HNO** were parked as “Hockey Canada siblings beside OHF.” They will stay empty until a new kind exists.

## Thin / keep

| Unit | Call |
|---|---|
| `hockey-ohf-five` homepage ping twice an hour | **THIN** — cites are up (except NOHA). Daily watch is enough. |
| `hockey-boys-omha-u16` | **AWAKE** — 12 of 20 still empty. Point it at the 12 `awaiting_player_cites` hosts, not a general search. |
| `hockey-girls-owha` | **AWAKE** — 70 stubs. Need club boards, not another standings scrape. |
| New U8–U18 ladder | **NOT STARTED** — do not spin a general search. One age class per kind, cite first. |

Floater sits on the 12 empty OMHA U16 AAA player URLs before it invents a U9 crawler.
