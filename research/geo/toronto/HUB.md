# HUB — sports, Bay Street, rent, housing (definition pass)
2026-08-27 00:45 EDT
This file writes the *slot language* every other Canadian city inherits.
If the organ is absent there: N/A. Do not ratio Belleville rent to these rents and call it the same market.
CMHC rent tables are often **CMA**. Census tenure is **CSD**. Keep both IDs.

## 1. Pro sport — `SPORT.PRO` stack
In this CSD, six major-league homes:
| League | Club | Box | Cap (printed) |
|---|---|---|---|
| NHL | Maple Leafs | Scotiabank Arena | 18,819 |
| NBA | Raptors | Scotiabank Arena | 19,800 |
| MLB | Blue Jays | Rogers Centre | 39,150 |
| MLS | Toronto FC | BMO Field | 27,980–28,180 |
| CFL | Argonauts | BMO Field | same roof |
| AHL | Marlies | Coca-Cola Coliseum | 8,100 |

Also in CSD: CEBL Scarborough Shooting Stars (Pan Am, 2,000). IBL Toronto Maple Leafs baseball at Dominico Field (1,000) — same *word* as the NHL club, different organism.
**Out of CSD, do not swallow:** Raptors 905 = Mississauga. Hamilton Ticats = Hamilton. Ottawa Sens = Ottawa.
MLSE is the corporate parent of Leafs/Raptors/TFC/Marlies — one company, four clubs. Count clubs, then tag the parent.
`SPORT.PRO.LEAGUES_N` = 6 here. Belleville = 1 (AHL). Most 444 = 0 = N/A.
FIFA 2026 is a calendar load on these boxes, not a seventh league.

## 2. Bay Street — `FINANCE.HUB`
Species: national listing exchange + Big Five bank headquarters + the street name as the Canadian capital-markets idiom.
- TSX / TMX Group sits in this CSD. Market cap $ = HOLE this pass (do not invent).
- Big Five HQ in this CSD: RBC, TD, Scotiabank, BMO, CIBC. CIBC Square (81 & 141 Bay) is the new CIBC ops HQ; Microsoft Canada also landed at 81 Bay from Mississauga.
- 2025 Bay Street print (LSEG via Globe): Canadian companies issued **$31.4B** new shares (more than double 2024); M&A involving Canadian companies **US$303B**.
- Downtown office: **83.0 million sq ft** · vacancy **13.0%** YE2025 (Newmark) · Financial Core 37.6 msf led absorption. Trophy/Class A filled; older towers emptier (Commerce Court availability was printed ~28% mid-2025 in one Globe/CoStar clip — treat as colour, not the city seal).
Belleville: a branch and a credit union is not this species. `FINANCE.HUB` = N/A. A regional city with one bank campus is still not TSX.
Implication for every other book: Canadian wholesale finance *clears through this organism*. That is a flora tag on the rest of the country, not a column you fill with a local exchange.

## 3. Rent — split the species
Never one "Toronto rent."
`RENT.PB` purpose-built (CMHC, 3+ units, Oct survey)
`RENT.CONDO` secondary condo rental
`RENT.TURN` what a *new* tenant paid (turnover)
`RENT.ASK` asking sites (Rentals.ca etc.) — not CMHC. Do not smash.
`GEO.CMHC` is usually CMA. `GEO.CSD` is census.

Toronto CMA, CMHC Oct 2025 (purpose-built):
- Vacancy **3.0%** (first 3% since pandemic; up from ~2.2–2.5%)
- Average all-units **~$1,917**
- 2-bed average **~$2,045–2,046**
- Turnover 2-bed **$2,547** (down from $2,612 in 2024)
Condo 2-bed average printed higher (~$2,891 in one recap) · condo vacancy ~0.9–1.3% depending on table. Two markets.
Asking rents can fall while CMHC average still rises. That is not a contradiction. Different IDs.
Belleville: use the same four IDs. Do not import $2,045.

## 4. Own / house / target
CSD 2021 (already sealed): own 52% / rent 48% · core need 19% · median owner-reported dwelling **$900,000**.
TCHC: 57,516 units · ~93,800 tenants · $8.42B SOGR backlog.
Municipal Housing Target: **285,000** starts 2022–2031.
City pipeline 2025: 1,744 projects · **791,045** proposed units · 151,122 purpose-built rental proposed · 1.36M pop if fully built.
Starts toward target: **87,921** by end-2025 (31%) · **90,989** by Q1-2026 (31.9%). Completions 85,617 (30%). Under review 251,669. Approved on paper ≠ started.
Need ~28,154 starts/year 2026–31 to catch the target (city planning math). That is a gap marker, not a forecast we invent.
`HOUSE.PRICE_BENCH` current TREB/CREA = HOLE this pass.
`HOUSE.STARTS_YR` single year = HOLE (we have the 2022–now cumulative).

## 5. Definition kit — copy these IDs onto every later city
`SPORT.PRO.LEAGUES_N` 0–6+
`SPORT.PARENT` (MLSE-class) yes|no
`FINANCE.HUB` yes|N/A  (TSX-class or Big-Five HQ)
`FINANCE.BRANCH_ONLY` yes  (atom default)
`OFFICE.SF` · `OFFICE.VAC_%`
`RENT.PB` · `RENT.CONDO` · `RENT.TURN` · `RENT.ASK`
`RENT.VAC_PB_%`
`TENURE.OWN_%` · `TENURE.RENT_%` · `CORE_NEED_%`
`MUNI_HOUSING.UNITS` · `MUNI_HOUSING.SOGR_$`
`HOUSE.TARGET` · `HOUSE.STARTS_CUM` · `HOUSE.PIPELINE_U`
`AIRPORT.IN_CSD` · `AIRPORT.OUT`
`TRANSIT.RAIL` subway|metro|streetcar|LRT|none
`CAPITAL.PROV` yes|N/A
`CAPITAL.FED` yes|N/A
`STATUTE.SPECIAL` COTA-class | Municipal Act | other

If a later city has none of the hub organs, the kit still prints. The answers are N/A. That is the refinement.
