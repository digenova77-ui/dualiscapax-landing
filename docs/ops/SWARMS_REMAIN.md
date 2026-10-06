# Swarms stay on GitHub

Document control: `ED-OPS-20260911-SWARMS-STAY-V1`
Seat amendment: `ED-OPS-20261006-SWARM-SIX-HOUR-V1`

These Actions keep running. They write ledgers and verify invariants. They do not publish the lander.

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
