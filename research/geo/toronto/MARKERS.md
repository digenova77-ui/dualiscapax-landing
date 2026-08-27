# MARKERS — finance, governance, traffic, school-move (entity kit)
2026-08-27 00:55 EDT
Physical entities only. Symbols first. A bond is a later act. Empty cell = N/A. Unread = HOLE.

## 0. Law of two books
City levy ≠ school-board grant.
TTC farebox ≠ yellow-bus contract.
TomTom metro ≠ city TTI dashboard ≠ INRIX hours.
CSD ≠ CMA ≠ "city center".
Write the ID. Then the number. Never a blend.

## 1. Governance entities (stamp every later city)
`STATUTE` COTA | Municipal Act | other
`COUNCIL.N` 25 wards here
`MAYOR.STRONG` origin-2022 | later | no
`AGENCY.N` TPS TFS TTC TCHC TPH Hydro PortsToronto Zoo … count later
`BOARD.PUB` TDSB  `BOARD.CATH` TCDSB  `BOARD.FR` two French boards
`BOARD.XPORT.ORG` **TSTG** (Toronto Student Transportation Group) — consortium, not a city division
`COURT.SUP` `COURT.ON` `DETENTION` Toronto South = in-CSD; Don Jail = closed
`CAPITAL.PROV` 1 here  `CAPITAL.FED` 0 here

## 2. School-move species (this is why traffic is not a single lever)
Toronto does **not** yellow-bus the city.
TDSB rule (printed):
- JK–Gr5 eligible → contracted carrier (70-pax / 18-pax / wheelchair / minivan / taxi)
- Gr6–8 → **TTC tickets** (Gr6 bus only if TTC needs >1 transfer)
- Age ≤12 ride TTC free → ticket line shrinks by policy, not by congestion
- Gr9–12 tickets if distance + financial tests
- Special-ed / IPRC is its own fleet (ride-alone possible)

TSTG 2024–25 revised consortium budget **$140.5M**.
TCDSB 2025–26 transport envelope ~**$55.8M** of which regular bussing **$48.1M** · TTC tickets **$2.0M** · fuel escalation $0.5M · driver retention $1.6M.
TDSB $ share of the $140.5M = HOLE as a single pulled line this pass (it is the residual of the consortium).
TCDSB ADE 2024–25: elem 58,285 + sec 27,749 = **86,034**. TDSB enrolment = HOLE this pass (page exists).

### Symbols
`X.$ = X.BUS + X.TAXI + X.TTC + X.ADMIN + X.FUELΔ + X.RETENTION`
`X.BUS = Σ_r (WAGE_r + FUEL_r + VEH_r) · T_block_r`
`T_block = T_free · TTI`     (city TTI from Transportation Services dashboard)
`X.TTC = N_ticket · P_youth` until `AGE_FREE` covers the cohort → then `X.TTC → 0` for that cohort
`SAVE_traffic` is **not** `∆TTI × X.$`.
It is `∆TTI × X.BUS` only, and only on routes whose clock is paid by the hour.
Ticket students do not get cheaper when the Gardiner slows. They were never on the Gardiner.
Island Public School is a boat, not a bus. Separate term.

Congestion can *raise* `X.BUS` (more vehicles to hold the same window) while `X.TTC` is a fare policy.
Driver shortage already forced a phased September start — labour is a limiter beside traffic.

## 3. Traffic markers (three vendors, three IDs)
`TTI.CITY_PM` City dashboard, weekday 17:00–18:00 vs free-flow. Recovered to pre-pandemic city-wide; **downtown above** pre-pandemic (construction + events + people).
`TOM.T10` minutes to drive 10 km. 2024 city-center **25 min 13 s** · speed 23.8 km/h · 5.3B km driven (metro clip — tag metro).
`TOM.LOST_HR` 2025 recap: **~100 hours**/driver rush delay; 2nd in Canada after Vancouver; 29 min AM / 34 min PM per 10 km (2025 clip).
`INRIX.HR` 2024: Toronto **61 h** delay/driver · rank 25 world · downtown 13 mph. City 2023 brief used 63 h / world-17 — **year and vendor differ**.
`VKM` 5.3B is TomTom metro. CSD VKM = HOLE.
Do not average the three.

## 4. Finance markers still dark (need-list, not guesses)
`DEBT.PER_CAP` `DEBT.SERVICE_$` `CREDIT.RATING` (AA+ was named in a 2026 budget release — confirm on the rating page)
`RESERVE.$` deferred revenue printed $6.6B committed vs $24.6B obligations — needs a clean line
`DC.$` development charges collected / unspent
`TAX.CVA_AVG` $692,140 was the 2026 levy example home
`TAX.RATE` residential + City Building Fund 2.2% on that example
`PIL` payments in lieu (Queen's Park / hospitals / feds sit in this CSD — $ HOLE)
`GRANT.ONT` New Deal $1.23B was named as operating support — year-lock HOLE
`GRANT.FED`
`HYDRO.RATE` OEB-approved 2025–29 plan exists; $ HOLE
`WATER.RATE` +3.75% sealed; $/m³ HOLE
`TTC.FARE` youth 13–19 PRESTO $2.35 · adult $3.30 · youth pass $128.15 (Sep 2025 TTC page)
`POLICE.COST/CAP` `FIRE.COST/CAP` derivable later = `$.NET / POP` only after both sealed same year
`BOARD.GRANT` `BOARD.SURPLUS` `BOARD.SCHOOL_N` `BOARD.UTIL_%`
`TSTG.VEH_N` `TSTG.ROUTES` `TSTG.SPED_SHARE`

## 5. Governance-cost markers still dark
`311.VOL` `311.COST`
`CLERK.ELECTION_$`
`LEGAL.$` `INSURANCE.$` `WSIB`
`AUDIT.AR`
`LOBBY.REG`
`BIA.N` `BIA.LEVY`
`CIC` community councils (legacy names as boxes)
`OMB/OLT` appeals N — planning friction
`STRONG.VETO_N` use-count

## 6. Correlation stance
Allowed later, same ID + same year + same geography:
`TTI.CITY_PM` ↔ `X.BUS` on hour-paid routes.
`TTC.FARE` ↔ `X.TTC`.
`AGE_FREE` ↔ `∆X.TTC`.
`POP` ↔ `OP.TAX`.
`ASSET.AM` ↔ `SOGR.$`.
Forbidden now: `∆TTI → school-board savings $Y`. Not computed. Labour + policy + mode mix sit in front of traffic.

Belleville: yellow-bus dominant, TTC-ticket species = N/A, TTI downtown-construction species = N/A, TSTG = N/A (different consortium or board-run).
