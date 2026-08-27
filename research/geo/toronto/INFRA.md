# INFRA — public dollars and the asset book (Toronto CSD)
2026-08-27 00:50 EDT
Correlation later. This pass only seals what the city printed.
Two asset languages — do not smash:
`ASSET.NBV` audited net book value (historical cost minus amortization).
`ASSET.AM` asset-management / replacement-class value used in budget books.

## City-wide envelope (already sealed, restated)
2026 operating: **$18.9B** ($16.61B tax / $2.25B rate).
10-year capital: **$63.1B** ($42.6B tax / $20.5B rate).
How $63.1B is funded (budget deck): city sources dominate; intergovernmental **$8.32B (13%)** of which TTC capital $5.40B includes $1.16B Canada Public Transit Fund.

## Audited book (year-end 2024, $ millions)
Total assets **64,113** · liabilities **28,230** · accumulated surplus **34,746**.
Long-term debt up 3.4% / +$294M; $1,000M debentures issued in 2024 (incl. $200M social + $200M green).
Tangible capital assets **NBV $45,417M** on cost $71,323M.
Of that NBV:
- General (land, buildings, vehicles, equipment) **18,357**
- Infrastructure **19,789** (water/ww linear 6,718 · roads linear 3,825 · transit 6,592)
- Under construction **7,271**
Annual amortization 2024: **1,793**.
This is the accounting floor. Budget "asset value" figures below sit above it.

## Asset-management values (2026 budget books — not NBV)
Infrastructure Services cluster: capital assets to deliver services **$125B**.
Toronto Water AM value **$95.2B**.
City total AM value printed on the SOGR table: **$194.3B** (2026 beg) rising to $264.0B (2035 plan).
SOGR backlog 2026 beg: tax-side **$7.254B** + Water **$3.314B** = **$10.567B** (5.4% of AM value).
Plan path: total SOGR **$24.693B** by 2035 (9.4%) — Water *falls* to $1.488B; tax-side *rises* (Transportation 2.645 → 8.580; TTC 0 → 6.147; TCHC 1.797 → 4.799).
TCHC SOGR $8.42B appeared on the housing corp's own page — different cut than the city's $1.797B TCHC line. Two books. Do not smash.

## Rate organs (pay the pipe, not the levy)
**Toronto Water 2026**
Op: gross **$542.4M** · revenue **$1,654.1M** · capital contribution **$1,111.7M**.
Split: treatment/supply $223.6M gross / $499.9M to capital · wastewater $268.0M / $651.7M · storm $50.7M.
Positions 1,975.3. Rate +3.75% (Jan 1 2026).
10-yr capital cash-flow **$10.771B** (2026 commitments) + plan to 2035 in the $18.9B Water capital envelope.
Physical: 4 WTPs · 4 WW plants · 11 reservoirs + 4 tanks · **5,574 km** dist + **544 km** trunk · 71,158 valves · 42,381 hydrants · 520,170 services · 18 pump stations.

**Solid Waste 2026**
Gross **$406.5M** · revenue **$412.6M** · capital contribution **$6.2M**.
Positions 1,205.4.
Green Lane + diversion already on BREADTH.

## Move organs
**TTC 2026**
Gross **$3,027.5M** · revenue **$1,546.9M** · net **$1,480.6M**.
Conventional $2,825.9 / $1,289.2 net · Wheel-Trans $201.7 / $191.4 net (~4.4M WT rides).
Positions **15,299**.
~42% own-source (fare ~39%) · ~9% provincial New Deal · ~49% property tax.
10-yr capital printed **$16.657B** gross in one book; Board cash-flow **$12.980B** + $3.677B 2027–35 estimates in another. Keep both labels.
TTC SOGR-as-%-of-asset in the TTC book: 20.7% → planned 8.7% over the ten years — a different table than the city-wide SOGR line that starts TTC at $0. Two books.

**Transportation Services 2026** (roads, signals, street ops — not TTC)
Net **$304.2M** (from $329.3M). Part of Infrastructure Services $2.7B gross / $344.5M net tax cluster.
SOGR roads is the fastest-growing tax-side hole ($2.645B → $8.580B).

## Already-sealed safety $ (do not re-guess)
TPS net $1,339.0M (2025). TFS $587.9M gross / $558.9M net (2026). Paramedics tax line was inside the $394M health cluster (2026).

## Culture / film office (levy sliver next to a $2B private spend)
EDC 2026: gross $111.8M · net **$97.2M** (arts $57.8 net · business $19.3 · entertainment industries $5.5 · museums $14.7).
City film *office* is not the $2.2B production spend.

## IDs for every later city
`OP.GROSS` `OP.TAX` `OP.RATE`
`CAP.10YR` `CAP.TAX` `CAP.RATE` `CAP.FEDPROV`
`ASSET.NBV` `ASSET.AM` `SOGR.$` `SOGR.%_AM`
`DEBT.LT` `TCA.AMORT`
`WATER.OP_GROSS` `WATER.REV` `WATER.TO_CAP` `WATER.AM` `WATER.RATE_%`
`SW.OP_GROSS` `SW.REV`
`TRANSIT.OP_GROSS` `TRANSIT.OP_NET` `TRANSIT.FARE_SHARE` `TRANSIT.POS` `TRANSIT.CAP_10YR`
`ROAD.OP_NET` `ROAD.SOGR`
`POLICE.$` `FIRE.$`
`LTC.CITY_BEDS` already on BREADTH.

Belleville fills the same IDs at atom scale. A missing organ is N/A. An unread page is HOLE.
Free will (where a person walks on Saturday) is not a cell.
