# Swarms stay on GitHub

Document control: `ED-OPS-20260911-SWARMS-STAY-V1`
Seat amendment: `ED-OPS-20261006-SWARM-SIX-HOUR-V1`
Seat amendment: `ED-OPS-20261006-SWARM-FIVE-V1`

These Actions keep running. They write ledgers and verify invariants. They do not publish the lander.

## Five-minute fleet (2026-10-06)

GitHub cron floor is 5 minutes. Six swarms, staggered, each twice an hour.

| Workflow | UTC minute | Swarm |
|---|---|---|
| `swarm_lane_core.yml` | 0, 30 | Iris-Core |
| `swarm_lane_biomed.yml` | 5, 35 | Iris-BioMed |
| `swarm_lane_treasury.yml` | 10, 40 | Iris-Treasury |
| `swarm_lane_adversarial.yml` | 15, 45 | Iris-Gate |
| `swarm_lane_sectors.yml` | 20, 50 | Sector agents, STUB |
| `swarm_lane_seal.yml` | 25, 55 | Actuator floor |

Receipts: `src/engine/ledgers/five/<lane>/LATEST.json`.
Slots sit off the factory minutes (`7,12,17,22,27` and `37,42,47,52,57`).
GitHub may delay a scheduled run. Manual dispatch is the same lane.

## Seated clock (2026-10-06)

| Workflow | Cadence | Job |
|---|---|---|
| `swarm_six_hour.yml` | `0 */6 * * *` UTC + dispatch | `agent_swarm_runner.py`, adversarial sentry, sector agents, commit ledgers. Actuators false. |

UTC fires: 00:00, 06:00, 12:00, 18:00. GitHub may delay a scheduled run. Manual dispatch is the same job.

## Prior table (transformed, not deleted)

| Workflow | Cadence | Job |
|---|---|---|
| `swarm_runner.yml` | demoted 2026-09-14 — dispatch only | refuse stub epoch |
| `swarm_bot_fleet.yml` | demoted 2026-09-14 — dispatch only | refuse theater |
| `unity_mesh.yml` | dispatch / issue only | mesh stub; no scheduled UNANIMOUS_PASS |
| `residual-ring.yml` | existing | residual ring |
| `encyclopedia-verify.yml` | existing | encyclopedia verify |
| `secret-scan.yml` | existing | secret scan |
| `jurisdiction-watch.yml` | existing | jurisdiction watch |
| `dualis-gate-replay.yml` | existing | gate replay |
| `pinata-pin.yml` | manual dispatch | Pinata pin (keep) |
| `oidc-auth.yml` | existing | auth helper — not a lander publish |
| `stripe-fulfill.yml` | existing | fulfillment helper — not Pages |

Do not add `actions/deploy-pages` or `wrangler deploy` back onto these jobs.

Live actuators stay `false` on the bot fleet unless Seat flips that on a seated machine outside GitHub.
