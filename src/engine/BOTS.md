# Factory bots

Live workers write cites and honest receipts. Demoted hourly stubs stay off the clock.

| Bot | Workflow | Slot | Job |
|---|---|---|---|
| Six-hour swarm | `swarm_six_hour.yml` | `0 */6 * * *` UTC | Perpetual runner + adversarial sentry + sector agents. Ledgers only. Actuators false. |
| Golf USA envelopes | `golf_usa_envelopes.yml` | A `7,37` | Course cite harvest |
| Hockey girls OWHA | `hockey_girls_owha.yml` | B `12,42` | Branch index |
| Hockey boys OMHA U16 | `hockey_boys_omha_u16.yml` | C `17,47` | Dualis seat packs |
| Factory receipt | `factory_workers.yml` | D `22,52` | Honest tick only |
| Ice session bot | `ice_session_bot.yml` | E `27,57` | This chat's law on GitHub |

## Six-hour swarm (seated 2026-10-06)
`swarm_six_hour.yml` runs `agent_swarm_runner.py`, `test_adversarial_swarm_attack.py`, and `sector_autonomy_agents.py`.
It commits `src/engine/ledgers/`.
It does not publish the lander. `LIVE_ACTUATORS=false`. `CRA_SEND=NO`. `DUALIS_TARGET=STUB`.

## Demoted (do not schedule)
`swarm_runner.yml` · `swarm_bot_fleet.yml` · `unity_mesh.yml` schedule

Those files stay. Their clocks stay off. The six-hour job is the seated swarm, not a revival of the stub theater.

## Not these bots
GrokBots (Chief of Staff, Ice Watchdog, DCLM Eyes, DCLM Meaning, Ice Web) are xAI agents in chat. Ice session bot is not a clone of them.
