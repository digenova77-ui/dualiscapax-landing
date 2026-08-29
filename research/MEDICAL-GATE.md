# Medical gate — precise door

**Status:** Open under constraint · 29 Aug 2026  
**Surface:** `/research/healthcare/` · door `/research/healthcare/locked.html`

## Who may enter medical depth

The file is open to **everyone** who meets one line:

1. Institutional address on **`.org`**
2. Institutional address on **`.gov`** (`.gc.ca` counts as government class)
3. **Ranking affiliate at top SEAL tier** — Dualis-issued mark `SEAL-1` / `SEAL-T1` / `DC-SEAL-1`

No tribe preferred inside the line. A .org charity and a .gov desk use the same door.

## Who stays outside

- Bare `.com` / `.ai` / personal mail with no ranking mark
- Paid-pack language from the old closed jacket does not reopen card checkout
- This door is **not** a clinic credential and **not** a sale of treatment

## Engineering

- `js/medical-gate.js` writes a session grant. No selectable body text. Form fields remain typeable.
- Pages marked `data-medical-depth="1"` bounce to the door unless granted.
- Tribute pages that only point at the Foundation or public journals stay on the public floor.
- Bind additional ranking marks in `RANKING` inside `js/medical-gate.js`. Do not print wallet keys here.

## Hard speech

Simulation is not treatment. Not a diagnosis. Not a cure. Not shares. Ontario and Canadian law apply.
