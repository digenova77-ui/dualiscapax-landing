# PREDICT — from cells, not from a story about the cells
2026-08-27 00:52 EDT
Law.

## Split the example before the model
Bike theft is not one number.
`S.CRIME.BIKE.REPORT` — occurrence / verified report on the police book
`S.CRIME.BIKE.CALL` — dispatched or recorded call (may exceed reports)
`S.CRIME.BIKE.RECOVER` — if the service prints it
Grain must be declared: CSD is the body; *prediction grain* is neighbourhood / DA / beat + **day-part or hour** if the ledger has it.
TPS vs BPS vs Kingston Police vs OPP are `S.POLICE.*` species. Do not merge books to make a denser heat map.

## Predictive
Condition only on cells that exist:
P(report | area A, window T) ≈ count(REPORT, A, T) / exposure(A, T)
Exposure is also an organ: bikes registered (rare), population, or just "per day in A" with the denominator named.
If CALL and REPORT both exist, they are two predictions, not one blended "theft."
Output: "this area, this window, this book, this rate from the last sealed pull."
Not: "this is a bad neighbourhood."

## Assumptive (forbidden unless named as a target)
Density implies theft. Poverty implies theft. Headline implies a wave. Saturday path of a person. Outlet slant as a prior.
Those have no HAS stamp on the crime organ.

## When we do not predict
- No report/call ledger at the asked grain → HOLE, not a guess.
- Grain finer than the book (hour asked, annual PDF only) → predict at the book's grain or refuse.
- Cross-city rank without same species and same definition of "bike theft."

## Identify-on-proof
The hour a service publishes bike-theft by beat or by day-part, cut `S.CRIME.BIKE.*` + grain on that Body. Do not wait for a provincial mash.

## Agent rule
Prediction is a query over sealed cells.
Assumption is a sentence with the cells removed.
Keep the first. Drop the second.
