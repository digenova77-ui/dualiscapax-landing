# Metric IDs — change only when truth beats the prior
2026-08-26 23:47 EDT
Format: `CITY.ENTITY.METRIC` — stable. Vintage sits beside the value, not inside the ID.

Example: `BEL.PG.HEADCOUNT` = >1,000 (source: P&G Jan 2025 plant page).

## Rule
1. Re-search hits the **same number** and the same scope → do not touch the entity or the metric. Write nothing.
2. Re-search hits a **different number** → do not overwrite. Open a delta:
   - same scope, new vintage (they restated)
   - different scope (family vs site, authorized vs deployable)
   - analog sneak-in (reject)
   - source conflict (two shelves)
3. New value replaces the old only after it is **validated against the prior**: same entity, same metric, better or equal source, reason named.
4. Unvalidated change stays in UNKNOWN / a `DELTA` line. The live ID keeps the last validated value.

## IDs already live (Belleville)
| ID | last validated | vintage / source |
|----|----------------|------------------|
| BEL.CITY.LEVY | $147,727,800 | 2026-038 |
| BEL.BPS.OPEX | ~$33.5M | 2026 BPS book |
| BEL.BPS.AUTH | 115 | 2026 BPS |
| BEL.BPS.DEPLOY | 93 | Jan 2026 BPS |
| BEL.PG.HEADCOUNT | >1,000 | P&G Jan 2025 |
| BEL.PG.PREMIUM | $3.20/hr | plant page |
| BEL.AMZN.TOURS | ~300 | city/Amazon tours |
| BEL.QHC.FAMILY_STAFF | ~2,600 mixed | QHC pages — do not collapse with 1,700+364 |
| BEL.LOY.FACULTY_FT_2024 | 141 | union summer 2024 |
| BEL.HPEDSB.STAFF_STATED | ~1,800 | board about-page |

## Delta log (empty until a validated change)
| ID | old | new | why | keep? |
|----|-----|-----|-----|-------|
| | | | | |
