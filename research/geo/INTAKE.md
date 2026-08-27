# INTAKE — how any later body or private feed enters the plate
2026-08-27 01:12 EDT
Public floor first. Private is a second book on the same ID, never a replacement.
The public must be known as well as — then better than — it knows itself: every organ named, every silence typed.

## 1. Five stamps, no sixth
Every cell is one of:
`SEALED`  public page, year, geography locked
`N/A`     organ does not grow on this body (overlay ABSENT)
`HOLE`    organ exists; page not pulled
`WAIT`    exists behind a grant / portal / FOI / private ledger
`UNLEARNABLE`  free will, or no instrument will ever print it
Silence is a defect. 0 is not N/A. N/A is not HOLE.

## 2. Handle = ID, not the source
Incoming file (city PDF, CMHC table, TomTom, TCHC annual, a factory's own kWh, a hospital's occupancy extract) does **not** get its own schema.
It must declare:
`ID` from PLAYGROUND.md
`GEO` CSD | CMA | site | parcel | vendor-metro
`YEAR`
`SRC` civic | statcan | cmhc | vendor | operator | private
`STAMP` one of the five
If the file cannot name an ID, it sits in `INBOX` until an ID is cut. No orphan columns.

## 3. Two books on one ID
`P.N` civic census and `P.N` a payroll vendor's headcount are not smashed.
Write `P.N.CENSUS` and `P.N.PAYROLL` or keep `SRC` on the row.
Private never overwrites public. It sits beside it. Disagreement is a feature (`Δ`).

## 4. Municipality N+1 — order of work
Do not start at film or congestion. Start at the STRONG list from OVERLAY.md:
1. `G.*` skin (CSD, km², statute, amalgam year, wards)
2. `P.*` census (count, density, tenure, core need)
3. `$.*` levy / op / cap if a budget book exists
4. `W.*` `S.POLICE` `S.FIRE` `M.BUS` `K.BOARD_*` — organs that both atoms and the ceiling share
5. Run OVERLAY vs Toronto **and** vs Belleville: STRONG / WEAK / ABSENT
6. Only then fill ceiling-only organs (subway, TSX, …) which will print N/A on most of the 444
7. HOLE list becomes the next public hunt
8. WAIT list is the grant/FOI/private list — do not pretend it is public
Quinte West already proved the mock: species decides correlation before decimals do.

## 5. Private / operator feeds (the Dualis tenant slot)
A corporation, hospital, school board, or plant may drop a file we cannot scrape.
Bind it as a **tenant book**:
`TENANT.ID` (legal name)
`TENANT.CSD` (where the meters sit)
`TENANT.ORGANS` the PLAYGROUND IDs it actually operates (kWh, beds, headcount, truck-km)
`TENANT.SRC` private
`TENANT.STAMP` WAIT until the file is in hand, then SEALED-private
It does not become the city's `E.PEAK_MVA`. It becomes `E.PEAK_MVA.TENANT` next to the civic hydro number.
Onboarder isolation from the old Dualis law still holds: one tenant's ledger is not another tenant's.

## 6. Know the public better than it knows itself
The public prints programs. We print **organs**.
City budget says "Infrastructure Services." We split water / wastewater / storm / roads / TTC / SOGR tax vs rate.
City says "rent." We split PB / condo / turnover / asking.
City says "airport." We split in-CSD / out-CSD / military / civilian.
TCHC $8.4B SOGR and the city's $1.8B TCHC line both stay. The public rarely holds both in one sentence. That is the better-than.
Cross-book discipline:
- NBV ≠ AM value ≠ replacement
- CMA ≠ CSD
- farebox ≠ yellow bus
- Destination Toronto ≠ CSD tourism
- OPP ≠ municipal police
A future feed that arrives as one blended number is split or rejected.

## 7. What we still do not know (public HOLE families — hunt list)
Toronto: `K.LIB_*` `K.SCHOOL_N` TDSB `S.SHELTER_BED` `S.HOSP_BED` by site `M.PATH_KM` `311` `BIA.N` `DETENTION.BEDS` `M.MODAL` `M.VEH` `W.RATE.$/m3` `$.DEBT_SVC` `$.PIL` `$.DC` unused `N.CANOPY` `N.FLOOD`
Belleville: many of the same at atom scale + 2016 tenure/Indigenous/religion comparators + LIM-AT + age bands
Quinte West: thinner than Belleville — WTP ML/d, SOGR, ice N, boards, CMHC rent
The hunt list *is* the foundation. A new city inherits it blank, then stamps.

## 8. What we will never learn from a page
Saturday path. Who they love. How a council member actually decided.
Those stay `UNLEARNABLE`. Building a better public book does not require them.

## 9. Test that the handle works
Drop any file. If you can point at one PLAYGROUND ID + GEO + YEAR + SRC + STAMP, the dataset accepted it.
If you cannot, cut an ID or refuse the column.
That is the whole machine for the next 444, and for whatever private ledger walks in after.
