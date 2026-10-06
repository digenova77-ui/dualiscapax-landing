# Factory bots

Live workers write cites and honest receipts. Demoted hourly stubs stay off the clock.

| Bot | Workflow | Slot | Job |
|---|---|---|---|
| Six-hour swarm | `swarm_six_hour.yml` | `0 */6 * * *` UTC | Full runner + adversarial + sector agents. Ledgers only. Actuators false. |
| Iris-Core | `swarm_lane_core.yml` | `0,30` | 5-minute lane. 9 sector tasks. |
| Iris-BioMed | `swarm_lane_biomed.yml` | `5,35` | 5-minute lane. |
| Iris-Treasury | `swarm_lane_treasury.yml` | `10,40` | 5-minute lane. |
| Iris-Gate | `swarm_lane_adversarial.yml` | `15,45` | 4-attack sentry. |
| Sector agents | `swarm_lane_sectors.yml` | `20,50` | Simulation. `DUALIS_TARGET=STUB`. |
| Seal | `swarm_lane_seal.yml` | `25,55` | Actuator floor across the five-minute receipts. |
| Golf USA envelopes | `golf_usa_envelopes.yml` | A `7,37` | Course cite harvest |
| Hockey girls OWHA | `hockey_girls_owha.yml` | B `12,42` | Branch index |
| Hockey boys OMHA U16 | `hockey_boys_omha_u16.yml` | C `17,47` | Dualis seat packs |
| Factory receipt | `factory_workers.yml` | D `22,52` | Honest tick only |
| Ice session bot | `ice_session_bot.yml` | E `27,57` | This chat's law on GitHub |

## Five-minute fleet (seated 2026-10-06)
Six workflows. Five minutes apart. GitHub cron cannot go finer than 5 minutes.
Each lane writes `src/engine/ledgers/five/<lane>/`. `LIVE_ACTUATORS=false`. No Pages. No wrangler.
The six-hour job remains the full epoch flush.

## Six-hour swarm (seated 2026-10-06)
`swarm_six_hour.yml` runs `agent_swarm_runner.py`, `test_adversarial_swarm_attack.py`, and `sector_autonomy_agents.py`.
It commits `src/engine/ledgers/`.
It does not publish the lander. `LIVE_ACTUATORS=false`. `CRA_SEND=NO`. `DUALIS_TARGET=STUB`.

## Demoted (do not schedule)
`swarm_runner.yml` · `swarm_bot_fleet.yml` · `unity_mesh.yml` schedule

Those files stay. Their clocks stay off. The seated clocks are the six-hour flush and the five-minute lanes, not a revival of the stub theater.

## Not these bots
GrokBots (Chief of Staff, Ice Watchdog, DCLM Eyes, DCLM Meaning, Ice Web) are xAI agents in chat. Ice session bot is not a clone of them.
