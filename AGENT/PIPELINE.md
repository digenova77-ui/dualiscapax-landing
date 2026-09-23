# Handoff chain — error to live face

Stamp: 2026-09-23T14:42Z
This file wins any chat memory about departments.
Four desks. Work-order desk sits on top. Eight+ Unity IDs. No buildings.

## Desks

0. `unity:order.clerk` / `unity:order.watch`
   Every fail is a work order. Stamp the ticket. Keep NOW.json honest.
   Do not wait for the wheel.

1. `unity:forensics.clerk` / `unity:forensics.watch`
   Name the bot. Name the class. Write the lesson.
   If the cause is not known, stamp `UNKNOWN` and pass the envelope.
   Do not guess a root cause to look finished.

2. `unity:design.clerk` / `unity:design.watch`
   Write `AGENT/BLUEPRINTS/<id>.md`.
   Backward compatible. Forward compatible. One lander.

3. `unity:develop.clerk` / `unity:develop.watch`
   Implement the blueprint on **root** files the lander actually loads.
   Watch holes a patch that only landed in `cf-pages/` or a zip.

4. `unity:publisher.clerk` / `unity:publisher.watch`
   Push `main`. Curl the apex. Diff to root `index.html`.
   Watch holes “live” without that curl.

## Ticket states

`FAIL → ORDER → FORENSICS → DESIGN → DEVELOP → PUBLISH → LIVE | HOLE`

A ticket may skip DESIGN only when forensics already has a cite and a one-line fix that exists on disk.

## Clocks

Routine tickets ride the five-clerk wheel.
Every street FAIL is critical and ticks **on drop**.
See `AGENT/TICK.md` and `AGENT/WORK-ORDER.md`.
Workflows: `critical-drop.yml`, `escalate.yml`, `fail-order.yml`.

## Compat law

Backward: a visitor on the current face still gets Iris, Talk, Voice.
Forward: the next room or engine probe is a script tag + a plate, not a second site.
If a blueprint needs a second lander, design failed.
