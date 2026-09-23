# Blueprint L-003 — engine unlink

State: DESIGN done. DEVELOP next. PUBLISH after curl.
Cause: KNOWN. Forensics did not need to pass UNKNOWN.
Exists in the real repo: yes. `js/engine-runtime.js`, `js/cosmic-runtime.js`, `js/engine-link.js`, `js/iris-engine-link.js` are on main.
Invented: no. The missing piece is import, not a new kernel.

## Backward compatible

Keep the current Iris boot order. Add four script tags after `js/iris-ring.js`. Do not remove Talk, Voice, camera, or the orb.

## Forward compatible

The probe card (`#engine-probe`) is optional UI. Iris `think()` already hooks engine words via `iris-engine-link.js`. Later rooms can call `EngineLink.step()` without a new site.

## Develop splice (exact)

On root `index.html`, before `</body>`:

```html
<script src="js/engine-runtime.js" defer></script>
<script src="js/cosmic-runtime.js" defer></script>
<script src="js/engine-link.js" defer></script>
<script src="js/iris-engine-link.js" defer></script>
```

Optional plate: a button `Run one step` that prints q, p, H, residual, receipt prefix.

## Publish

`unity:publisher.clerk` pushes root `index.html` on main.
Curl `https://dualiscapax.ai/` until `engine-link.js` appears.
Until that grep hits, the ticket stays DEVELOP/PUBLISH, not LIVE.
