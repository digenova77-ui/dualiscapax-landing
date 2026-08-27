# Lifecycle — index, relate, strip, drive to zero
2026-08-26 23:51 EDT
Compute years are allowed. Noise years are not the product. The product is a live set of itemized drivers whose residual can still fall.

## Four states of a fact
| state | what it is | where it lives |
|-------|------------|----------------|
| **INDEX** | named, serialized, not yet related | city folder, DROP cells empty |
| **RELATE** | two viewpoints + at least one typed edge | RELATIONS / GRAIN / METRIC-IDS |
| **STRIP** | useful to have built, no longer needed to *wait* a residual | `appendix/` — kept, not queried first |
| **DRIVE** | still changes a cost toward zero | live residual index only |

A fact does not get deleted. It gets stripped. Appendix is memory. Live index is work.

## When to strip
- The relation is locked and invertibility holds (ID walks back to the source).
- Re-search returns the same validated number (METRIC-IDS rule: write nothing).
- The fact does not change a decision on payer, burner, clock, hire, or movement.
Then it leaves the live query path.

## What never strips
Viewpoint pairs that still diverge (115 vs 93). Payer ≠ burner paths whose payer may have changed (Elexicon dividends). Capacity constraints (Belleville TS). Hire-mode inversions. Association types that travel.

## World-zero
Landauer floor is the aim, not a number we invent tonight. Dualis drives residual by removing *waiting on noise* — duplicate search, analog dollars, smashed viewpoints, appendix facts sitting in the live set.
Belleville is still INDEX + RELATE. Do not strip the city yet.
