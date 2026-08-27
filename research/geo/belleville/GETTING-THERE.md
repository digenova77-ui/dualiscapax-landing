# Getting there — city analog of a transport cost
2026-08-26 23:49 EDT
Mars is the far template. Belleville is how you learn to price *movement through a place*: energy, water, road, rail, harbour, hire. Same types later. No SpaceX math tonight.

## Energy (capacity before the kWh)
Belleville TS is already a constraint. Elexicon told Hydro One the station exceeds capacity as early as 2025 (committed industrial + growth). OEB Jan 2026: 3.40% distribution increase; **denied** ICM for a new Dual Element Spot Network at Belleville TS. Viewpoint A: plants need power. Viewpoint B: the transformer book may not grow as filed.
IDs: `BEL.ELEXICON.TS_CAPACITY` · `BEL.ELEXICON.RATE_2026`
P&G 24/7 12h sits on that clock. Night production is a different TOU than a school.

## Water (declining block = plant viewpoint)
2026 city book is public:
- first 455 m³: $2.06/m³
- next 22,275 m³: $1.57
- over 22,730 m³: $0.94
- wastewater surcharge 111.9% on the first block; **60%** over 22,730 m³ for general service
That *is* a plant residual type. We do not invent P&G’s m³. We have the tariff they would drop into.
ID: `BEL.WATER.INDUSTRIAL_TARIFF_2026`

## Who paid for the pipe
Open Council: $14.4M industrial DC exemptions 2022–May 2025, made up from property tax and water rates. Council cut the 100% discount Jul 2025. Payer ≠ burner again: residents/ratepayers carried industrial connect cost.
ID: `BEL.CITY.DC_INDUSTRIAL_EXEMPT`

## Harbour is not freight
Meyers Pier = recreation slips, gas/diesel for boats. Historic working harbour is gone. “Getting product out” is 401 / 62 / rail / Amazon yard — provincial and private books, not the pier.
Do not book a deep-water port that is not there.

## Species that travel to a later planet-scale model
capacity-before-kWh · declining-block water · DC exemption as transfer · clock-on-energy · recreation-harbour ≠ freight-harbour · hire-mode on the same labour market
Those types are how you later price a fuel + habitat + lift stack. The Belleville numbers stay Belleville.
