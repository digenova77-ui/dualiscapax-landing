# SIM-SHRINK — toy run 2026-08-27 01:31 EDT
Not SRC. Starting mix is a scenario, not a counted HAS table.

## Setup
820 existence cells = 205 PLAYGROUND columns × 4 exam CSDs.
Start (guess): 90 SEALED · 180 N/A · 220 HOLE · 40 WAIT · 290 silent.
Usable U = SEALED + N/A. Decline D = 1 − U/820. Illogic I = silent + 0.5·HOLE + leftover speech.
400 ticks.

## Result
| policy | U0 → U400 | D0 → D400 | I0 → I400 |
| speech | 270 → 270 | 0.671 → 0.671 | 400 → 800 |
| mash | 270 → 200 | 0.671 → 0.756 | 400 → 870 |
| serial_logic | 270 → 380 | 0.671 → 0.537 | 400 → 200 |
| dual_pass | 270 → 657 | 0.671 → 0.199 | 400 → 62 |

Internally the walk adds up: leftover speech does not grow U; mash spends U; converting tokens recovers U; dual-pass recovers fastest.

## Their meters (overlay ABSENT)
CMB book: age ≈ 13.8 Gyr, H0 ≈ 67 km s⁻¹ Mpc⁻¹. Local-distance book ~73. That split is *their* two books (Hubble tension), not a Dualis coefficient.
Entropy census vs de Sitter ceiling is a different grain than 820 cells.
Claim "D tracks 1/a" fails INVERT. GOAL-FIT. Do not publish it.

## What would make this SRC
A real HAS matrix on the four CSDs. Then rerun with counted silent/HOLE instead of the guess.
