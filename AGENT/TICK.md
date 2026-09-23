# Tick clocks

Stamp: 2026-09-23T14:32Z
Clerk: `unity:publisher.clerk`
Watch: `unity:publisher.watch`

Three clocks. Do not mix them.

## Routine wheel — 5 clerks, staggered

See `AGENT/SLOTS.md`.
:01 forensics · :06 audit · :13 design · :19 develop · :23 wattage
Same five again at +30.
They never share a minute with FOREST harvests.
Research does not ship a face.

## Critical — on drop

If a ticket has `"critical": true` the tick is the same minute the splice lands on `main`.
No wait for the wheel. No wait for noon.

Drop means:
1. `unity:develop.clerk` writes the named root files.
2. `unity:publisher.clerk` pushes `main` immediately.
3. `unity:publisher.watch` curls the apex (`critical-drop.yml`).
4. That job finishes → escalate wakes forensics + audit now (`AGENT/ESCALATE.md`).
5. Live only if curl matches the file just pushed.

If Pages is repo-connected, the push *is* the deploy. The watch still curls. A green Actions run is not the street.

## What is critical

The street is wrong right now. L-003 is critical until `engine-link.js` appears on `https://dualiscapax.ai/`.

What is not critical: a new lesson line, a golf envelope, a score row. Those ride the wheel.
