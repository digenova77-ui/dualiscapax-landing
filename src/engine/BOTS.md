# Factory bots

Live workers write cites and honest receipts. Demoted hourly stubs stay off the clock.
Cues refill to a floor. They do not sit empty waiting.

| Bot | Workflow | Slot | Job |
|---|---|---|---|
| Six-hour swarm | `swarm_six_hour.yml` | `0 */6 * * *` UTC | Full runner + adversarial + sector agents. Refills every cue. Actuators false. |
| Iris-Core | `swarm_lane_core.yml` | `0,30` + chain | Cue floor 12. Chains the next refill. |
| Iris-BioMed | `swarm_lane_biomed.yml` | `5,35` + chain | Cue floor 12. |
| Iris-Treasury | `swarm_lane_treasury.yml` | `10,40` + chain | Cue floor 12. |
| Iris-Gate | `swarm_lane_adversarial.yml` | `15,45` + chain | Cue floor 4. |
| Sector agents | `swarm_lane_sectors.yml` | `20,50` + chain | Cue floor 7. `DUALIS_TARGET=STUB`. |
| Seal | `swarm_lane_seal.yml` | `25,55` + chain | Cue floor 4. Actuator floor. |
| Golf USA envelopes | `golf_usa_envelopes.yml` | A `7,37` | Course cite harvest |
| Hockey girls OWHA | `hockey_girls_owha.yml` | B `12,42` | Branch index |
| Hockey boys OMHA U16 | `hockey_boys_omha_u16.yml` | C `17,47` | Dualis seat packs |
| Factory receipt | `factory_workers.yml` | D `22,52` | Honest tick only |
| Ice session bot | `ice_session_bot.yml` | E `27,57` | This chat's law on GitHub |

## Cues (seated 2026-10-06)
`src/engine/ledgers/cue/<lane>.json` is the pending work.
A lane takes a batch, works it, then refills to the floor before commit.
Exit on an empty cue is a refuse.
Each lane chains its own next run when nothing is already queued. Cron remains the backstop if a chain drops.
`LIVE_ACTUATORS=false`. No Pages. No wrangler.

## Five-minute fleet (seated 2026-10-06)
Six workflows. Five minutes apart. GitHub cron cannot go finer than 5 minutes.
Each lane writes `src/engine/ledgers/five/<lane>/`.
The six-hour job remains the full epoch flush.

## Six-hour swarm (seated 2026-10-06)
`swarm_six_hour.yml` runs `agent_swarm_runner.py`, `test_adversarial_swarm_attack.py`, and `sector_autonomy_agents.py`.
It refills `src/engine/ledgers/cue/` before and after the flush.
It does not publish the lander. `LIVE_ACTUATORS=false`. `CRA_SEND=NO`. `DUALIS_TARGET=STUB`.

## Demoted (do not schedule)
`swarm_runner.yml` · `swarm_bot_fleet.yml` · `unity_mesh.yml` schedule

Those files stay. Their clocks stay off.

## Not these bots
GrokBots (Chief of Staff, Ice Watchdog, DCLM Eyes, DCLM Meaning, Ice Web) are xAI agents in chat. Ice session bot is not a clone of them.
