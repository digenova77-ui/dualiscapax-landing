# Civic / student / sport stack — entities then similars
2026-08-27 00:06 EDT
ON Belleville only. Do not import IL Oktoberfest or IL Hawks.

## QSWC (the box everything else rents)
265 Cannifton. 330,000 sqft. Four arenas, pool, gym, track, 50+ Centre, Hall of Fame, city counter (tax/water/tags/transit). Senators lease through **2029-30**, option to **2034-35**. Priority on CAA ice. Open Council: AHL tenant **lowers** QSWC cost-recovery (ice days the city cannot rent). Dual view: civic pride vs rental residual.
Home Show lives here two days a year. Same floor as hockey.
ID: `BEL.QSWC` · `BEL.SENS.LEASE_TO` = 2029-30

## Quinte Home & Cottage Show (QHBA)
Mar 28-29 2026 at QSWC. Since 1970s. Platinum sponsor **Crozier Heating**. Headliner Carson Arthur. Market on the Bay artisans. ~128 exhibitors on old 10times scrape — treat as type, refresh from 2026 guide. Prize heat pump from Crozier. Same trades we just named, on the floor.
ID: `BEL.HOMESHOW.2026`

## Festivals (civic calendar species)
- Waterfront Multicultural Festival — 45th year, West Zwick's, 4 days. Kouri's Copters, tribute bands.
- Caribbean Festival — 5th year; committee claimed **10,000** people and **$1.1M** local spend last August (their number, not a city audit).
- Farmers Market (weekly) · Lions Concerts on the Bay · Discover Belleville calendar as the index.
Do not book IL Oktoberfest.

## Empire Theatre
321 Front St. ~**700** seats. 2003 reopen. 2026 book: Steve Earle, Finger Eleven, Kim Mitchell / Paul Langlois, Stampeders, Pavlo, Randy Feltface, Tom Thomson's Wake. Cineplex Galaxy on Bell Blvd is the *other* screen species.
ID: `BEL.EMPIRE.CAP` = 700

## Loyalist student body (how it hits the city)
Winter 2026: **2,950** Belleville+Port Hope (4.5% over budget). 276 new; 88% domestic. Board plan: domestic **2,300-2,500**, international **≤15%**, 65-70 programs, Belleville remains core campus. Residence **476** beds on campus. Fall programs full: nursing, paramedic, fire, med-rad. Transit Route 3 just *left* the campus for Amazon/College St — hire-mode inversion now has a bus.
City effect species: rent, transit, QSWC drop-in, downtown nights, clinical placements at QHC. Not a headcount smash into HPEDSB.
ID: `LOY.ENROL_W26` = 2,950 · `LOY.RES_BEDS` = 476

## Athletic hierarchy
| layer | entity |
|-------|--------|
| pro tenant | Belleville Senators (AHL) — QSWC |
| junior football | Quinte Skyhawks (CJFL) — Sills / field plane |
| club basketball | Belleville Spirits U17 |
| special olympics | BQW basketball @ St. Michael's gym |
| city fields | Mary-Anne Sills Park, 140 Palmer — Bruce Faulds Track + turf #2 |
| city courts | Clifford Sonny **Belch** Park pickleball + 3v3 (GC name on a park) |
| park system | **55** parks, **>500** acres |
| college sport / rec | Loyalist gym + QSWC membership |
| high-school | HPEDSB / ALCDSB gyms |

Mary-Anne Sills is the outdoor athletic box the way QSWC is the indoor box. Skyhawks reviews tag the field. Same pattern: box → tenant → calendar.

## Similars this pattern finds
QSWC : Sills : Empire : Zwick's : campus rec
Senators : Skyhawks : Spirits : Lions concert series
Home Show : Waterfront Fest : Caribbean Fest : Farmers Market
Crozier-on-the-show-floor : Reid's-on-Duvanco-page : Peak-on-hospital-award
Each pair is the same species at a different box. Do not merge boxes.
