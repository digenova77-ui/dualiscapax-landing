# TEMPLATE — every Ontario municipality
2026-08-27 00:26 EDT
Blank plate. No entities. Fill later per PATH.

Ontario map = **444** lower- and single-tier municipalities + separate upper-tiers (regions/counties). Unincorporated North is not a municipality — DSSAB book if opened.
User said "$44" → treated as 444.

Each row is one CSD / municipal corporation. Shared agencies are referenced, never copied as local.

---

## 0. Identity (required before any number)
`MUNI.NAME` · `MUNI.TYPE` city|town|township|village|municipality
`MUNI.TIER` single|lower|upper
`MUNI.CSD_DGUID` · `MUNI.UPPER` (if lower-tier)
`MUNI.SSM` (housing / social services manager)
`MUNI.AMALG_YEAR` or null
`MUNI.WARDS` count or null

## A. People (StatCan census year locked on the plate)
`POP` · `POP_PRIOR` · `POP_CHG_%`
`DWELL_TOTAL` · `DWELL_OCC`
`AREA_KM2` · `DENS`
`MED_AGE` · `HH_SIZE`
`OWN_PCT` · `RENT_PCT` · `CORE_NEED_%`
`DETACHED_PCT` · `APT5PLUS_PCT`
`MED_DWELL_$` · `MED_OWN_SHELTER` · `MED_RENT`
`RENT_30PCT` · `RENT_SUBSIDIZED_%`
`MED_HH_INCOME`
Do not substitute CMA or county for the CSD.

## B. Money / safety
`TAX_LEVY_$` · `TAX_LEVY_DELTA_%` · `RES_TAX_%_ON_REF`
`POLICE.MODEL` municipal|OPP|other
`POLICE.BUDGET_$` · `POLICE.SWORN_N`
`FIRE.STATIONS_N` · `FIRE.CAREER_N` · `FIRE.VOL_N` · `FIRE.UNIONS` count
`TRANSIT.MODEL` municipal|contract|none|shared
`TRANSIT.RIDES_PERIOD` · `TRANSIT.FARE_$` · `TRANSIT.FLEET_N`

## C. Limiters
`WTP.N` · `WTP.CAP_MLD` · `WTP.PEAK_MLD` · `WTP.HEADROOM`
`WATER.MAINS_KM` · `SEWER.KM` · `SPS_N`
`WPCP.N` · `WPCP.CAP_MLD` · `WPCP.ECA`
`LDC.NAME` (tag only) · `LDC.MW_FORECAST` · `TS.LIMIT_MW`
`HOUSING.STARTS_YR` · `HOUSING.PERMITS_$M` · `HAF_$` or null
`LANDFILL.TONNES_YR` or `WASTE.CONTRACTOR`
Empty limiter = hole, not zero.

## D. Boxes (counts and rates, not names)
`ARENA.PADS_N` · `ICE.ADULT_PRIME_$` · `ICE.MINOR_PRIME_$`
`POOL.N` · `MARINA.SLIPS_N`
`PARKS.N` · `PARKS.ACRES`
`MALL.SF` or null · `CASINO.HOST_$` or null
`HOTEL.N` · `HOTEL.OCC_%` or hole
`AIRPORT.MODEL` municipal|federal|none

## E. Clubs / marks (identifiers only when filled)
`CLUB.JR_HOCKEY` league+name or null
`CLUB.MINOR_HOCKEY` · `CLUB.GIRLS_HOCKEY`
`CLUB.SOCCER` · `CLUB.FOOTBALL` · `CLUB.LACROSSE` · `CLUB.RUGBY`
`CLUB.BASEBALL` · `CLUB.RINGETTE` · `CLUB.OTHER`
Same word on two orgs = two IDs. Never smash.

## F. Care / faith / cash (counts)
`CC.N` · `CC.CWELCC_N`
`CHURCH.N` or hole
`BANK.BRANCH_N`
`SOCIAL_HOUSING.UNITS` + owner tag (county/SSM vs this CSD)

## G. Work
`EMPLOYER.TOP` list of public names only when a page printed them
`SUNSHINE.FTE` or hole
`GC.PLANE` firms named on awards or hole
`BASE.MILITARY` name+FTE or null

## H. Shared corporations (tag, do not copy numbers as local)
`HEALTH.CORP` · `BOARD.ENG` · `BOARD.FR` · `BOARD.CATH`
`CONSERVATION.AUTH` · `LDC` · `HOUSING.SSM`
Occupancy, enrolment, dam count live on the corporation file. Municipality file points.

## Score
`SEALED` = cells with a public page
`DEFINED` = every ID above
`HOLE` = defined, page silent
`RESIDUAL` = invented or smashed across geography
Score = SEALED / DEFINED

## Fill rule
PATH order. One municipality at a time. Do not pre-load names into this file.
