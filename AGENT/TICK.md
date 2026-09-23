# Tick clocks

Stamp: 2026-09-23T14:42Z
Clerk: `unity:publisher.clerk`
Watch: `unity:publisher.watch`
Order: `unity:order.clerk`

Three clocks. Do not mix them.

## Routine wheel — 5 clerks, staggered

See `AGENT/SLOTS.md`.
:01 forensics · :06 audit · :13 design · :19 develop · :23 wattage
Same five again at +30.
They never share a minute with FOREST harvests.
Research does not ship a face.
Lesson lines and score rows ride this wheel.

## Critical — on drop

Every street FAIL is critical until the curl matches.
The tick is the same minute the watch sees HOLE.
No wait for the wheel. No wait for noon.
See `AGENT/WORK-ORDER.md`.

Drop means:
1. Watch writes or refreshes `AGENT/TICKETS/<id>.json` + `AGENT/WORK-ORDERS/NOW.json`.
2. `unity:develop.clerk` writes the named root files.
3. `unity:publisher.clerk` pushes `main` immediately.
4. `unity:publisher.watch` curls the apex (`critical-drop.yml`).
5. That job finishes → escalate wakes forensics + audit now.
6. If HOLE remains → `fail-order.yml` keeps the order open and the loop repeats.
7. Live only if curl matches the file just pushed.

If Pages is repo-connected, the push *is* the deploy. The watch still curls.
This factory does not hold `CLOUDFLARE_API_TOKEN`. We do not pretend the apex flipped.

## What is critical

The street is wrong right now.
L-WAV (greet take 404).
L-003 (engine-link.js not on the lander).
L-ICE (`/ice` not 200).

What is not critical: a new lesson line, a golf envelope, a score row. Those ride the wheel.
