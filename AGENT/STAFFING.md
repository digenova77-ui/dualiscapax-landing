# Staffing board

Stamp: 2026-09-23T14:52Z
Clerk: `unity:flow.clerk` assigns.
Watch: `unity:wattage.clerk` holes a desk that is over cap or idle-warm.
Privilege: `AGENT/PRIVILEGE.md`. Sleep: `AGENT/FLOW.md`. Sources: `AGENT/SOURCES.md`.

This is a shop floor, not a parade.
A work order names the hole. Headcount follows the hole. Skill follows the desk.
Empty workflow files are not staff.

## Skills

| Grade | Name | What they do |
|---|---|---|
| L1 | gather | ping a named door, keep the receipt |
| L2 | walk | one derivative hop (Players, PDF, SportsEngine, club site) |
| L3 | splice | write the pack / INDEX under the unit |
| L4 | manage | elevate (order / develop / publisher / Seat) |
| W | watch | read, hole, never write |

A gather bot does not splice the lander.
A watch does not become L4 by sitting longer.

## How many (the formula)

```
need = open_cites_or_tickets on that desk
clerks = 1 if need > 0 else 0
        + 1 if need > 12
        + 1 if need > 40
cap   = 3 clerks on one harvest desk
watches = 1 per writing clerk (dual pipe)
managers = 1 of each named manager. Never two publishers.
floaters = 1, cap 2 when two CRITICAL tickets are open
```

Thin when `need == 0` for two ticks: drop the cron, keep `workflow_dispatch`, weekly watch.
Do not spawn a new yml to look bigger. Add a matrix row on the existing job if the same skill is doing the same walk on a new named door.

## Plant right now (production, not wish)

| Desk | Skill | Min | Now | Target | Cap | Why |
|---|---|---:|---:|---:|---:|---|
| publisher.clerk + watch | L4 + W | 1+1 | 1+1 | 1+1 | 1+1 | one ship desk |
| order.clerk + watch | L4 + W | 1+1 | 1+1 | 1+1 | 1+1 | one ticket stamp |
| develop.clerk + watch | L3 + W | 1+1 | 1+1 | 1+1 | 2+2 | second only if two READY plates |
| design.clerk + watch | L3 + W | 1+1 | 1+1 | 1+1 | 1+1 | blueprints |
| forensics.clerk + watch | L2 + W | 1+1 | 1+1 | 1+1 | 3+3 | +1 per extra CRITICAL |
| audit / wattage / flow | W / L4 | 1 | 1 | 1 | 1 | wheel slots |
| sec.watch / wav.watch | W | 1 | 1 | 1 | 1 | never scale a watch into a writer |
| harvest OMHA U16 | L2 + L3 | 1 | 1 | **2** | 3 | 12 empty boards still named |
| harvest OWHA | L2 + L3 | 1 | 1 | **2** | 3 | 70 stubs, need club boards |
| harvest OHF-five ping | L1 | 0 | 1 | **0 (thin)** | 1 | homepages already cited |
| harvest house-rec | L1 | 0 | 1 | 0 thin or 1 if cites grow | 1 | |
| harvest golf envelopes | L1 | 0 | 1 | **thin** | 1 | pile exists; weekly watch |
| harvest ice-session | L2 | 1 | 1 | 1 | 1 | room still broken on street |
| floater | L2 | 1 | 1 | 1 | 2 | sit on the 12 OMHA empty URLs first |
| U8–U15 / U18 boys kinds | L2 | 0 | 0 | 0 | 1 when a cite class exists | do not invent a ladder |
| HEO / HNO | L1 | 0 | 0 | 0 | 1 when a homepage cite exists | not started |

## Work-order class → staff

| Order class | Who wakes | Who does not |
|---|---|---|
| street fail (wav, ice 308, index drift) | order → develop → publisher | harvest |
| empty roster with a public door | harvest L2 on that host | general-search bot |
| league list done | wattage thins that cron | new swarm yml |
| secret-scan HOLE | sec.watch + Seat | harvest |
| onion-only alleged fact | stamp HOLE class=onion | Tor theater |
| READY blueprint | develop + publisher | floater pretending to publish |

## Dual pipe at scale

N writing clerks on a desk ⇒ N watches.
Do not hire 2N writers.
Managers stay one-of-each so two publishers cannot collide on `index.html`.

## Coffee-shop line

A shop puts two people on the pile that is actually there.
It does not hire a hundred to look busy.
When the pile is stacked, those two go help the next pile.
