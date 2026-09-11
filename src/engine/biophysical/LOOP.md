# SEC-01 knowledge loop (V2)

Document: ED-BIO-20260911-HOCKEY-LOOP-V2  
Engine: `hockey_performance_manifold.py`  
Floor: NO_FORCE. Simulation is not treatment. No named-minor PII.

## Clocks now in the model

| Clock | Closed how | Still empirical |
|---|---|---|
| Burst vs shift mean speed | Peak and mean are separate inputs. 34.2 km/h is labeled PEAK. F prior peak 32 / mean 16.5; D peak 28 / mean 15. | No Quinte GPS tape |
| F/D split | `POSITION_PRIOR` + `run_period()` | Priors from published tracking, not this roster |
| Multi-shift residual | `pcr_frac` carries into the next shift | No consented multi-shift HR/GPS |
| Two-lobe PCr | \(t_{1/2}\) 22 s / 170 s; `seconds_to_pcr_target` (default 80%) | τ not measured on this bench |
| LT as PCr-rate covariate | optional `lt_fraction_vo2` scales fast lobe | No SMAT / LT test on file |
| Maturity band | PRE / MID / POST / UNSPECIFIED prior on τ | No %PAH |
| Glycogen | per-shift leak; D weighted higher TOI | 31% / 48% are U20 biopsy priors, not Quinte |
| Active vs passive | `STAND_PACE` vs `PASSIVE` with UNCERTAIN note | Mixed literature at shift scale |
| Tape ingest | `run_period(measured_tape=[...])` | Tape field empty → `quinte_tape_present: false` |

## What remains open on purpose

These are not software holes. They are evidence holes.

1. Consented, de-identified Quinte shift tape.
2. SMAT stage or bike LT1/LT2 for a placeholder id.
3. Female / mixed-sex U16 game GPS (engine is sex-agnostic; literature used here is mostly male youth/pro).
4. Proof that 34.2 km/h is a U16AAA *mean peak* rather than a rush extrema.
5. A signed decision that rest targets 70 / 80 / 90 % PCr — that is a choice, not a law.

## On-air sentence

The V2 engine will print a two-lobe PCr leftover and an F/D period. It will not print a living player.
