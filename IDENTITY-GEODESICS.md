# Identity lock — foundation geodesics

Card rails were already correct. Only the orb `data-color` values on 02 and 05 were swapped.

| Card | Identity rail | Geodesic was | Geodesic now |
| --- | --- | --- | --- |
| 01 Fiduciary | `#ffb830` | `#ffb830` | `#ffb830` |
| 02 Infrastructure | `#3b82f6` | `#00ffaa` | `#3b82f6` |
| 03 Autonomous AI | `#00e5ff` | `#00e5ff` | `#00e5ff` |
| 04 Intellectual Property | `#c084fc` | `#c084fc` | `#c084fc` |
| 05 Sovereign Onboarding | `#00ffaa` | `#3b82f6` | `#00ffaa` |

Production drop-in (apex `/` canvases):

```html
<canvas class="geodesic-orb-canvas" data-color="#3b82f6" width="40" height="40"></canvas>
<!-- 02 // INFRASTRUCTURE -->

<canvas class="geodesic-orb-canvas" data-color="#00ffaa" width="40" height="40"></canvas>
<!-- 05 // SOVEREIGN ONBOARDING -->
```

Do not touch the header polychrome mark.
