# Swarm bots

All runners are bots. Missing target = `STUB`. Actuators stay off.

| Bot | Workflow | Cadence | Target if undefined |
|---|---|---|---|
| Perpetual swarm | `swarm_runner.yml` | :00 | synthetic sector batch |
| Sector agents | same + fleet | :00 / :15 | literature priors |
| Tax clerks | fleet | :15 | in-memory sample txs, CRA send NO |
| Paper trading | fleet | :15 | SHOP.TO / BTC-CAD paper |
| Unity mesh | `unity_mesh.yml` + fleet | :30 / :15 | role-card stub, no vendor required |
| Fleet umbrella | `swarm_bot_fleet.yml` | :15 + dispatch | `DUALIS_TARGET=STUB` |

`DUALIS_LIVE_ACTUATORS=false` in fleet env. Do not flip that from chat.
