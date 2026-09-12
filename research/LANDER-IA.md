# Lander information architecture (2026-09-12)

Theme: **lander CSS** (`lander.css` extracted from original `index.html` tokens). Do **not** use thin civic `styles.css` pages as the public face.

## Kept on `index.html` (first half)

- Hero + Hear Iris
- `#ask-iris` (sensors + IrisHandoff + IrisAV/DSAP voice)
- `#sector-municipal` (short)
- `#sector-commercial` (savings calculator kept)
- `#explore` card grid → peeled pages
- `#founder-wall` (short)
- `#onboard` CTA → `onboard.html`
- Footer / bottom dock → Home · Ask Iris · Sandbox · Explore · Pilot

## Peeled pages (lander-themed)

| Page | Source section |
|------|----------------|
| `research.html` | `#sector-research` (117 monographs) |
| `fuel.html` | `#sector-fuel` + OPEN→Grok note |
| `sectors.html` | `#sector-eight` |
| `alacarte.html` | `#sector-alacarte` |
| `sandbox.html` | `#sandbox` |
| `purity.html` | `#sector-purity` |
| `physics.html` | `#sector-math` + swarm factory block |
| `unity.html` | `#sector-unity-vision` |
| `measure.html` | `#dropzone` |

Shared peel runtime: `js/lander-peel-runtime.js` (study selectors, checkout stubs, sandbox).

## Related links (existing)

`onboard.html`, `pay.html`, `portal.html`, `faq.html`, `access-layers.html` — linked from Explore / footer; restyle to lander theme over time if still on thin CSS.
