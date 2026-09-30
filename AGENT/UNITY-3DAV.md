# UNITY 3D AV — close charter

Stamp: 2026-09-29T21:10-04:00
Status: DECLARED close list. Not live on / .

## What “complete” means

One Unity seating. One Iris organ. 3D AV = body + jewelry graph + mouth. Not BEM. Not FMM. Not SOFA bake. Not three canvases.

## Pipes (do not smash)

1. **Mouth** — `speechSynthesis` in `iris-av.js` / land-stage greet. Not an AudioNode.
2. **Jewelry** — `dsap-engine.js` AudioContext, 64× `PannerNode("HRTF")`, `speakField` / `wave` / `energy`.
3. **Body** — pick ONE: IrisSphere (cluster + 2D fallback) OR IrisHolo OR IrisGL. Not all three on one page.

Wire today: mouth → `jewel(text)` → jewelry pulses. Samples of the voice do **not** enter the panners.

## L0

- NO_FORCE: `DSAP.unlock` only after Talk / ♪. No visibility auto-wake as a bind.
- HOST_SAFE: one context, one body, reduced-motion fallback. 64 panners = tension; gains stay 0 unless pulse.
- CLEANUP: `DSAP.cleanup` / suspend on mute and hidden.
- TRUTH: do not say 3D voice or live / until curl.

## Receipts to close (B)

1. Named HTML (recommend `ai/app.html` or a Seat-chosen apex — not silent swap of `/`).
2. That HTML loads: dsap-engine, ONE body, iris-av, ring.
3. `#presence` or `#iris-stage` exists and `mount` is called once.
4. Curl that URL: Talk visible, canvas present, mute works, cam optional and out of ring.
5. Zip + wrangler if that HTML is to be `/`.

Until 4–5: library only.

## Out of close

BEM, Burton–Miller, FMM, measured SOFA, HOA, graph TTS, four homepages, Drive as AV corpus.

## Derivative

d(claim)=cite. d(field)=this URL + this yes.
