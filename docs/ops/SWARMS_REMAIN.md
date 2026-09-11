# Swarms stay on GitHub

Document control: `ED-OPS-20260911-SWARMS-STAY-V1`

These Actions keep running. They write ledgers and verify invariants. They do not publish the lander.

| Workflow | Cadence | Job |
|---|---|---|
| `swarm_runner.yml` | hourly + dispatch | `agent_swarm_runner.py`, adversarial test, sector agents, commit ledgers |
| `swarm_bot_fleet.yml` | :15 past hour + dispatch | swarm + tax clerks (CRA send stays NO) + paper trading + unity mesh stub |
| `unity_mesh.yml` | existing | mesh stub |
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
