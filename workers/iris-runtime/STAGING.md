# Iris Runtime — Staging Wiring (non-production)

This document describes how to connect the Iris pages to the governed staging Worker without touching the production Pages deployment.

## Staging Worker

- Location: `workers/iris-runtime/`
- Entry: `worker.mjs`
- Config: `wrangler.toml` (no production routes)
- Deploy command (staging only):
  ```bash
  cd workers/iris-runtime
  wrangler deploy --env staging
  ```

## Page connection (staging only)

Iris pages (`ai/app.html`, `iris.html`, etc.) currently call browser-side `DCLMLook` / BYOK. For staging verification:

1. Set `window.IrisSigningSecret` from a staging-only injection (never in production HTML).
2. Ensure `js/iris-authorize.js` is loaded before `js/iris-session.js`.
3. Point the authorize fetch at the staging Worker origin if it differs from the Pages origin (update `IrisAuthorize.authorize` base URL for the staging build only).

## Required regression tests before any promotion

Run:
```bash
node --test tests/iris-authorize-regression.test.mjs
node --test workers/iris-runtime/worker.test.mjs
```

Must cover:
- Denial (no downstream inference)
- Authorization timeout (treated as denial)
- Duplicate `request_id` (409)
- Concurrent claims (exactly one succeeds)
- Receipt verification (id + sha256 present on allow)

## Production boundary

- Production Pages deployment remains untouched.
- No production routes, secrets, or bindings are changed by this staging wiring.
- `window.IrisSigningSecret` is a browser-visible staging hook only; production requires a server-side signer.
