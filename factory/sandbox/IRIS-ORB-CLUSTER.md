# Iris multi-orb cluster — closed sleeve

Stamp: 2026-09-21
Branch: factory-floor-v01 source only.
Does not deploy. Does not open checkout. Does not redesign the hall.

## What already exists (repo)

- `js/iris-hologram.js` — single conductor orb. Forms: orb / wave / field / sprite.
  Quarks, gaze, mood, scroll parallax. `window.IrisHolo.mount(target)`.
- Apex `/` lander has **no** hologram canvas. Voice button only (`speechSynthesis`).
- Hall five rooms keep identity colors. No sixth card.
- Drive packs (`PURE_ORBS`, constellation zips) are visual intent, not live.
- `factory/sandbox/IRIS-ACADEMY.md` — Iris watches the factory; she is not a shop mouth.

## What this sleeve adds

`factory/sandbox/iris-orb-cluster.js`

- Five moving orbs in locked hall colors.
- Click cycles focus. Session remembers the room. Does not navigate. Does not open chat.
- `IrisOrbCluster.open === false` on purpose.
- Reduced-motion: mount returns null.

## Multipage without opening her

Carry `sessionStorage.dc_iris_orb_room` across Look / How / Hall / Ice-when-it-returns.
Same cluster, same focus, new page. That is multipage motion. Not a new product.

Wire later, after Brock's engine is stable:

1. Optional host on `/iris` or hall stage only.
2. Do not auto-mount on merch `/`.
3. Do not bind `/api/iris` or fuel to the orb tap.

## Law

Look is $0. Sales closed. Five rooms. No MIC. No hall redesign.
SOURCE_REPAIR ≠ PRODUCTION_REPAIR.
