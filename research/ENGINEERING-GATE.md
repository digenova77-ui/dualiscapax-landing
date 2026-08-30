# Engineering gate — precise door

**Status:** Identity gate live · paid seat closed · 30 Aug 2026  
**Surface:** `/research/engineering/` · door pattern mirrors medical

## Who may enter engineering depth

Same line as medical institutional class, adapted:

1. Institutional address on **`.edu`**, **`.org`**, or **`.gov`** (`.gc.ca` counts)
2. Verified plant / utility domain on the allow list (operator-maintained)
3. **Ranking affiliate at top SEAL tier** — `SEAL-1` / `SEAL-T1` / `DC-SEAL-1`

No tribe preferred inside the line.

## Who stays outside

- Bare personal `.com` / consumer mail with no ranking mark
- Paid-pack language does not reopen card checkout while `open: false`
- This door is **not** a P.Eng. stamp and **not** a safety certification

## Engineering

- `js/engineering-gate.js` writes a session grant. No selectable body text on depth pages where no-select is set.
- Pages marked `data-eng-depth="1"` bounce to the door unless granted.
- Public residual prose (e.g. thermodynamic residual overview) stays on the public floor.
- Bind additional ranking marks in `RANKING` inside `js/engineering-gate.js`. Do not print wallet keys here.

## Hard speech

Simulation is not a stamped design. Not a code compliance certificate. Not shares. Ontario and Canadian law apply.
