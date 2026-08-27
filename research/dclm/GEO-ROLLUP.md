# Canada geo roll-up
2026-08-26 22:06 EDT

Identity spine is geographic before it is named.

```
Canada  (federal snapshot)
  └ province / territory
       └ CMA / CSD (municipality)
            └ named firm (only when a public record exists)
```

Municipal cells must sum toward the provincial cell.
Provincial cells must sum toward the Canada cell.
Same vintage. Same definition (employer vs non-employer). Location ≠ enterprise.

## Official count sources (fill, do not invent)

June 2026 Canada: 1.37M employer + 3.78M non-employer (≥ $30k).
Tables:
- 33-10-1174-01 employer × province × NAICS × size
- 33-10-1175-01 non-employer × province × NAICS
- 33-10-1176-01 employer × CMA / CSD

December 2025 vintage still used if a bot is mid-fill: 33-10-1095/1096/1097.

CSD public tables omit places with fewer than 10 employer businesses. That hole is **suppression**, not an extra firm type.

## Discrepancy law

If Dualis named rows + municipal cells ≠ provincial cell ≠ Canada cell:

1. Different vintage → treat the gap as **opens and closes since the snapshot** (StatCan also publishes monthly openings/closures). Do not invent businesses to close the gap.
2. Location vs enterprise → do not force them equal.
3. T2 corporation count vs StatCan location count → different universes. Join by native ID when you have one; never add the two.
4. Suppression → leave the small-CSD remainder on the provincial cell as `suppressed`, not as named assets.

## Agent A next fill

A1: pull 33-10-1174 and 1175 → 13 province/territory employer + non-employer cells under Canada 1.37M / 3.78M.
A1b: CMA/CSD under Ontario first (Dualis home), then the rest.
A3 still first for **names**.
