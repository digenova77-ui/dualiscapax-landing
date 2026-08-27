# OVERLAY — Belleville plate on Toronto plate
2026-08-27 01:00 EDT
Three states only.
`BOND.STRONG` same organ, same species, size is a scalar.
`BOND.WEAK` same family word, different species or different legal parent. Ratio lies.
`ABSENT` organ does not grow on the atom. Not a weak bond. N/A.

## STRONG — the shared machine
These survive the overlay. They are why a 55k city and a 2.8M city can still talk.
- `P.N` `P.DENS` `P.OWN_%` `P.RENT_%` `P.CORE_NEED_%` `P.HH` `P.DWELL`
- `$.OP_GROSS` `$.OP_TAX` `$.LEVY` `$.TAX_CVA` `$.NBV` `$.SOGR` (same accounting idea; books differ in depth)
- `W.WTP_N` `W.WTP_MLD` `W.WW_N` `W.KM_DIST` `W.SERVICES` `W.HYDRANT`  — both treat water; both have *a* plant
- `SW.T` `SW.DIV_%`  — both collect garbage. Landfill *ownership* is a different ID (see ABSENT)
- `E.HYDRO_CUST`  — both have meters. Peak-MVA / data-centre load may drop to N/A on atom
- `S.POLICE_$` `S.FIRE_$` `S.FIRE_STN` `S.EMS_$`  — municipal safety organs exist on both (TPS vs BPS is still police)
- `M.BUS` `M.ROAD_KM` `M.BRIDGE_N` `M.SIGNAL_N`
- `K.BOARD_PUB` `K.BOARD_CATH` `K.ENROL` `K.SCHOOL_N` `K.XPORT_BUS`  — boards exist; ticket-to-subway is WEAK
- `K.LIB_N` `K.REC_N` `K.POOL_N` `K.ICE_N` `K.PARK_HA`
- `H.RENT_PB` `H.VAC_PB` `H.STARTS`  — CMHC species exists at both scales (CMA vs CSD still tagged)
- `G.CSD` `G.HA` `G.WARD_N` `G.AMALG_YR`  — both are CSDs that ate neighbours in 1998. Scar size differs; the scar exists.
- `L.CITY_POS`  — both employ people to run the machine

Strong does **not** mean equal. 72 ML/d vs 2,805 ML/d is still one plant-species bond.

## WEAK — same word, different animal
Do not ratio these and call it complexity.
- `M.TRANSIT_RIDES`  bus-only vs bus+streetcar+subway. Split to `M.BUS` (strong) + `M.SUBWAY` (absent on atom)
- `K.XPORT_$`  yellow-bus county vs TSTG + TTC tickets + free-under-12. Bus-hour term can bond; ticket term cannot
- `M.AIR_IN`  Trenton/Quinte field vs Billy Bishop 2M pax island. Call them both air if you must; do not divide pax
- `M.PORT`  Bay slips vs PortsToronto tonnes + cruise. Slips ≠ tonnes
- `H.TCHC_U` vs Hastings SSM housing  — both "social housing," different legal parent. Weak unless you invent `H.SSM_U` on the atom and keep TCHC as ceiling-only
- `S.LTC`  city-run 10 homes vs county/hospital/private mix
- `S.CC`  city SSM vs county SSM
- `S.HOSP`  QHC one site vs UHN/Sinai/Sunnybrook stack. Site-in-CSD can bond; teaching-hospital flag cannot
- `K.UNI`  Loyalist nearby / not in CSD vs four universities in-CSD
- `R.LEAGUE_N`  AHL-1 vs six majors. AHL-to-AHL (Marlies↔Sens) is stronger than AHL-to-NHL
- `T.*`  Bay of Quinte visitors vs Destination Toronto 9M overnight. Tourism *family* exists; the book is different
- `F.OFFICE_SF`  a downtown block vs 83 million sq ft Financial Core
- `M.TTI`  small-city delay vs downtown-construction TTI. Vendor exists; the organ of "congestion as a published program" is ceiling-heavy
- `G.STATUTE`  Municipal Act vs COTA. Both municipalities; not the same act
- `MAYOR.STRONG`  tool may now exist on both (province spread it). Load it was built for does not. Tool = weak. Load = absent

## ABSENT on the atom — not weak
These are Toronto organs Belleville does not grow. Overlay prints N/A. No ratio.
`M.SUBWAY` `M.STREETCAR` `M.PATH_KM` `M.UP` `M.BIKE_SHARE`
`M.AIR_BILLY` as that species  `M.CRUISE` as 18k-pax species
`W.EXPORT` (York)  `W.CSO` as a named program  `E.DISTRICT` (Enwave)  `E.DC_MVA`
`SW.LANDFILL_OUT` city-owned Green Lane 200 km away
`F.HUB` `F.TSX` `F.BANK_HQ`
`G.CAPITAL_PROV` `G.COTA`
`H.TCHC` as 57k-unit city corp  `K.FILM_$` as $2B hub  `K.STUDIO_SF`
`T.MTCC` `R.FIFA` `R.CNE` `R.TIFF` as those calendars
`K.TSTG`  `M.GO` terminal as Union-class
Six-name amalgam scar as a *living* internal geography (Scarborough ≠ North York still used as boxes)

## How to use the overlay
1. Start every new city on the STRONG list. Those bonds are the kit.
2. When a word matches a WEAK row, split the ID before you compute.
3. When the organ is ABSENT, write N/A and stop. Do not call it 0. Do not call it weak.

The outliers are the ABSENT list. They are the definition of ceiling, not a poor score on the atom.
