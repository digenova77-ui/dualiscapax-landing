# Mount the join plate on dualiscapax.ai

The five-card playground on the apex is the home. Why / story / docs already live in this repo. The Cloudflare router still 404s those paths.

Allowlist or serve as static files — **path-exact, never `/*`**:

- `/why.html`
- `/story.html`
- `/research/docs.html`
- `/research/doc-pane.html`
- `/research/doc-catalog.json`
- `/js/doc-pane.js`
- `/css/doc-pane.css`
- `/js/apex-hook.js`

On the legacy lander, before `</body>`:

```html
<link rel="stylesheet" href="/css/doc-pane.css"/>
<script src="/js/doc-pane.js"></script>
<script src="/js/apex-hook.js"></script>
```

Do not replace the five-card lander. Do not point the same hostname at GitHub Pages and the Worker at once (see `PAGES.md`).

Until those paths mount, the sine is locked in git and out of phase on `.ai`.
