# Staffing — production levels

Stamp: 2026-09-23T14:52Z
Parents: `AGENT/FLOW.md` `AGENT/PRIVILEGE.md` `AGENT/HOCKEY-CENSUS.md`
Clerk: `unity:flow.clerk` assigns. Watch: `unity:flow.watch` holes overstaff.

This is a shop floor, not a parade. Headcount follows the open hole.
A bot with no row and no ticket is idle wattage. Thin it.

## Skill grades

| Grade | Who | Production |
|---|---|---|
| W | watch | curl, grep, hole. Never writes the lander. |
| C | clerk | one named floor |
| H | harvest | packs + INDEX under its unit only |
| M | manager | elevate one job, watched |
| F | floater | next job on the hottest hole, then leave |
| S | Seat | Settings, secrets |

N writers on a desk need N watches. Not 2N writers.

## Levels (the whole factory)

| Level | When | Force |
|---|---|---|
| 0 Skeleton | always | every named desk is 1 clerk + 1 watch |
| 1 Production | open cites on that unit | keep H+W on that unit; everyone else stays 1+1 |
| 2 Surge | CRITICAL ticket not LIVE | +1 floater on that ticket. Cap **3** floaters factory-wide |
| 3 Parade | never | do not mass-spawn harvest crons |

A manager does not add a fourth hockey yml because the first one is empty.
Point the awake unit at the empty boards.

## Per work-order class

| Order class | Min | Target | Cap | Skill | Thin when |
|---|---:|---:|---:|---|---|
| Street splice (index/js/audio) | 1C+1W | 1C+1W | 1C+1W | develop → publisher | curl green |
| Forensics / lesson | 1C+1W | 1C+1W | 1C+1W | forensics | lesson stamped |
| Fail → ticket | 1C+1W | 1C+1W | 1C+1W | order | ticket LIVE |
| WAV / secret / ice-door probe | 1W | 1W | 1W | watch | probe LIVE |
| Hockey OMHA U16 AAA | 1H+1W | 1H+1W | 2H+1W | harvest | 12 empty boards cited or locked |
| Hockey OWHA U18/U22 | 1H+1W | 1H+1W | 2H+1W | harvest | stubs have a club door or stay empty-on-purpose |
| Hockey OHF five ping | 0H+1W | 0H+1W | 1W | watch | **THIN now** — homepages already cited |
| Hockey new age class | 0 | 0 | 1H+1W | harvest | only after a named kind + first cite |
| Golf envelopes | 1H+1W | 1H+1W | 1H+1W | harvest | zero new cites two ticks |
| Ice session | 1H+1W | 1H+1W | 1H+1W | harvest | notes stable |
| Factory mill / audit / verify | 1C+1W each | same | same | read clerks | slot done |
| Swarm / bot-fleet | 0 | 0 | 0 | demoted | stay read |

## This minute (cite the census)

Awake: OMHA U16 (8/20 filled, 12 boards empty) + OWHA (70 stubs).
Thin: OHF five homepage ping.
Not started: U8–U15 / U18 boys, HEO, HNO, Alliance/GTHL/NOHA teams — **do not staff** until a kind exists.
Street: skeleton 1+1. Surge cap unused unless a CRITICAL ticket is open.
Floaters sitting: 0 of 3.

## Who assigns

`unity:flow.clerk` reads tickets → lessons → census holes → zero-cite units.
It may move one floater. It may not grant `contents: write`.
`unity:order.clerk` opens the ticket. `unity:publisher.clerk` ships the lander.
Seat flips Settings.

A harvest clerk that self-spawns a sibling yml is a privilege hole.
