# Mount the join plate on dualiscapax.ai

The five-card playground on the apex is the home. Why / story / docs already live in this repo. The Cloudflare Sovereign Router still 404s those paths.

Allowlist or serve as static files:

- `/why.html`
- `/story.html`
- `/research/docs.html`
- `/research/doc-pane.html`
- `/research/doc-catalog.json`
- `/js/doc-pane.js`
- `/css/doc-pane.css`
- `/js/apex-doc-hook.js` (when present)

Do not replace the five-card lander. Do not point the same hostname at GitHub Pages and the Worker at once (see `PAGES.md`).

Until the origin mounts those paths, share github.io only as a fallback — not as a second home.
