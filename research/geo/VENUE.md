# VENUE — predicted columns from the ice-at-1am ask
2026-08-27 00:57 EDT
Column work. Dual viewpoint: municipality book vs pad-user book (the player / team / tenant of the sheet). Not a person’s Saturday path.

## Why this family first
The 00:53 question forced CLOCK, occupancy vs existence, and downtime residual on one civic organ. Those cuts repeat on pool, hall, library after-hours, transit barn, WTP night setback. Ice is the exam column-set. Do not invent a new letter.

## Headers to cut (when a page proves them)

### Pad existence (city or operator)
`K.ICE_N` sheets
`K.ICE.NHL` `K.ICE.OHL` `K.ICE.AHL` `K.ICE.COMMUNITY` species — do not mash
`K.ICE.CAP` seats if printed
`K.ICE.OWNER` city | board | private | junior club

### Clock (grain, not 1440 columns)
`K.ICE.CLOCK.OPEN` posted hours
`K.ICE.CLOCK.LAST` last public skate / last permit
`K.ICE.CLOCK.FLOOD` flood / plant window
`K.ICE.CLOCK.DARK` hours the sheet is not sold
Do **not** cut `K.ICE.MINUTE_0000` … `K.ICE.MINUTE_2359`. Window tokens × Cache.year × Body is the 10^n. Headers stay few.

### Occupancy / user book (player-side, aggregated)
`K.ICE.SLOT_SOLD` permit hours sold
`K.ICE.SLOT_OPEN` unused saleable hours
`K.ICE.UTIL_%` if they print it
`K.ICE.USER.REP` representative / junior / house — species of *use*, not a named kid
UNLEARNABLE: which player is on which sheet tonight.

### Downtime residual (city or operator can move)
`E.ICE.KWH` hydro to the plant
`E.ICE.HVAC` building, not the slab
`E.ICE.HEAT` spectator / change-room
`K.ICE.ZAMBONI.L` or `K.ICE.ZAMBONI.KWH` fuel or electric — species of machine
`L.ICE.OPS` operators on shift
`L.ICE.JANITOR` after-hours clean
`K.ICE.AD.$` rink-board / dasher inventory if printed
`$.ICE.OP` `$.ICE.REV` if the city prints a pad P&L

### Fleet / extent (extrapolate, still columns not rows)
`K.ICE.N_CITY` count of pads on this Body
`K.ICE.NEED` if a rec master plan printed a deficit
`K.ICE.LIMIT` seasonal close / outdoor only
Same tokens apply to `K.POOL_*` `K.REC_*` `K.LIB_*` after ice stamps exist. Copy the pattern. Do not fork MESH.

## Two viewpoints, two books
City: can I dark the plant at 01:00 and cut kWh / staff / Zamboni hours?
User: is a sheet for sale in window T? (SLOT_OPEN + CLOCK)
Do not average them into "arena health."
A junior club tenant gets `K.ICE.*.TENANT` beside the civic line. Isolation holds.

## Where 10^n actually lives
Bodies × pads × window × year × book.
That is Cache cardinality.
If headers explode toward 10^n we failed NAMING — we put grain in the column name.
Target: tens of venue tokens, not millions of minute-columns.

## Identify-on-proof
Hours PDF → CLOCK tokens same pass.
Utility submeter or published kWh → E.ICE.*
Zamboni procurement or fuel line → machine species.
No page → HOLE with SRC kind, still a column.

## Agent rule
Predict columns by walking the organ: exists → clock → sold vs dark → energy/staff/fuel in the dark → same pattern on the next venue type.
Do not add a fifth city to discover HVAC.
