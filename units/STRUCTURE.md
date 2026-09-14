# STRUCTURE FIRST

Scale target: unit coverage across **government-class** domains (and sports playgrounds).  
Implementation order: **structure → queue → harvest script → workflow → live[]**.

## Do
- One folder per unit under `units/`
- Independent cron only after packs write
- Register live units in `FOREST.json`

## Don’t
- Spawn empty crons that stamp fake consensus
- Timeslice one job across unrelated domains
- Claim Dualis *is* government, police, or tax authority
- Invent cites to fill thin trunks (girls/women’s hockey = build the map honestly)

## Live (2026-09-14)
- `sports/golf-usa` — slot A
- `sports/hockey-girls-women-amateur` — slot B (OWHA branch index)

## Next harvest candidates
1. `sports/hockey-boys-amateur` — deepen Ontario packs into repo harvest (slot C)
2. `sports/football-ncaa` then `football-hs`
3. First public trunk with a clear open cite class (start narrow: one metro open-data seat)

## Demoted rails
- `swarm_bot_fleet` / `swarm_runner` / scheduled `unity_mesh` — no more stub SUCCESS theater
- Factory receipt: `factory_workers.yml` (slot D)

## Order (layer cap)

Verify upward only as far as the unit needs:

0 structure → 1 cite class → 2 harvest script → 3 workflow/cron slot → 4 live registry

**Cap:** stop at the highest layer required. **Do not** re-verify a verifier already proven (shared infra or prior seal for that unit).

## Cron offsets

See `FOREST.json` → `cron_slots`. New live units take the next free slot (B, C, …) — independent clocks, not one timesliced brain.
