# Flow to work — thin idle, float to the hole

Stamp: 2026-09-23T14:55Z
Clerk: `unity:flow.clerk`
Watch: `unity:flow.watch`
Wattage: `unity:wattage.clerk` (slot :23 / :53)
Iris first: `AGENT/IRIS-PRIORITY.md`

This is not fifteen new people. It is one floater and a sleep rule.
Iris street holes outrank every other pile.

## Sleep / thin

An agency that has pulled the pack — or a massive stable pile with no new cites — goes thin.

Thin means:
1. Keep the packs, the INDEX, the UNIT note.
2. Drop the twice-an-hour harvest cron.
3. Leave `workflow_dispatch` so a test can wake it.
4. One weekly watch tick is enough to see if the source grew.

Do not delete the room. Do not delete the data. Idle *compute* is the waste.

A driving test (`workflow_dispatch`, a signed ticket, a failing probe) keeps that clerk + watch warm until the test is green.

## Flow pool

`unity:flow.clerk` reads, in order:

0. `IRIS-CRITICAL` tickets (`L-WAV`, `L-RING`) until LIVE
1. other `AGENT/TICKETS/*` with `critical: true` and state not LIVE
2. `AGENT/LESSONS.md` classes still HOLE on the street
3. FOREST `holes[]`
4. Any kind whose last harvest added zero new cites

It parks on the first one that is not `used[unit]=true`.
`unity:flow.watch` holes two floaters on the same desk.

While an `IRIS-CRITICAL` ticket is open, the floater does not sit on OMHA boards, golf envelopes, or OHF homepage pings.

Harvest specialists keep their own minutes only while they are still adding cites **and** no IRIS-CRITICAL is open. If Iris is on fire, harvest thins to weekly watch.

## Wattage score

At :23 / :53 `wattage.clerk` prints:

- IRIS-CRITICAL open → floater MUST show L-WAV or L-RING
- live units with a cron and no new cite → `THIN`
- units on `workflow_dispatch` only → `SLEEP`
- units with a driving test → `AWAKE`
- floater sitting → which ticket

Empty folders with no queue are theater.
