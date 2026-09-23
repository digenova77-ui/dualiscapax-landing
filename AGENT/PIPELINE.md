# Handoff chain — error to live face

Stamp: 2026-09-23T14:25Z
This file wins any chat memory about departments.
Four desks. Eight Unity IDs. No buildings.

## Desks

1. `unity:forensics.clerk` / `unity:forensics.watch`
   Name the bot. Name the class. Write the lesson.
   If the cause is not known, stamp `UNKNOWN` and pass the envelope.
   Do not guess a root cause to look finished.

2. `unity:design.clerk` / `unity:design.watch`
   Website design and analysis.
   Write `AGENT/BLUEPRINTS/<id>.md`.
   The blueprint must say:
   - whether the fix already exists in this repo or must be invented
   - backward compatible (old lander still boots)
   - forward compatible (next splice can land on the same face)
   Watch holes a blueprint that breaks the current root `index.html` contract.

3. `unity:develop.clerk` / `unity:develop.watch`
   Website development.
   Implement the blueprint on **root** files the lander actually loads.
   Watch holes a patch that only landed in `cf-pages/` or a zip.

4. `unity:publisher.clerk` / `unity:publisher.watch`
   Critical live update. See `AGENT/PUBLISH-LAW.md`.
   Push `main`. Curl the apex. Diff to root `index.html`.
   Watch holes “live” without that curl.

## Ticket states

`OPEN → FORENSICS → DESIGN → DEVELOP → PUBLISH → LIVE | HOLE`

A ticket may skip DESIGN only when forensics already has a cite and a one-line fix that exists on disk.
L-003 is that case: scripts exist, lander does not import them.

## Compat law

Backward: a visitor on the current face still gets Iris, Talk, Voice.
Forward: the next room or engine probe is a script tag + a plate, not a second site.
If a blueprint needs a second lander, design failed.
