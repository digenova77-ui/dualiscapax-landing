# Iris Runtime — Staging Wiring (non-production)

This document describes how to connect the Iris pages to the governed staging Worker without touching the production Pages deployment.

## Security boundary (non-negotiable)

`window.IrisSigningSecret` is browser-visible. Any value readable by browser JavaScript is public to that browser. Production must use a server-side signer. The staging hook is for verification only.

The production client path (`js/iris-authorize.js` → `authorizeProduction`) posts to `IrisAuthorizeBase` with same-origin credentials and never supplies a secret. The Worker is expected to hold `TRINITY_HMAC_SECRET` as a Worker secret.

## Staging Worker

- Location: `workers/iris-runtime/`
- Entry: `worker.mjs`
- Config: `wrangler.toml` (staging environment only; no production routes)
- Required bindings (declared in `wrangler.toml`):
  - `IDENTITY_API`
  - `TRINITY_LAW`
  - `IRIS_MEMORY`
  - `MODEL_PROVIDER`
- HMAC secret (Worker secret, never in source):
  ```bash
  wrangler secret put TRINITY_HMAC_SECRET --env staging
  ```
- Receipt contract: `dualis.receipt.v1` with 64-char lowercase SHA-256
- Deploy command (staging only):
  ```bash
  cd workers/iris-runtime
  wrangler deploy --env staging
  ```

## Verification before any promotion

```bash
node workers/iris-runtime/verify-staging.mjs
python -m unittest tests.test_iris_authorize_contract -v
node --test tests/iris-authorize-regression.test.mjs
python -m unittest discover -s tests -v
```

Must pass:
- `wrangler.toml` declares the four required bindings
- `worker.mjs` exports a fetch handler and does not reference a browser secret
- Denial (no downstream inference)
- Authorization timeout (treated as denial)
- Duplicate `request_id` (409)
- Concurrent claims (exactly one succeeds)
- Receipt verification (id + sha256 present on allow)
- Production client path does not require a browser secret

## Production boundary

- Production Pages deployment remains untouched.
- No production routes, secrets, or bindings are changed by this staging wiring.
- Staging deployment should wait until the real service bindings are pointed at live staging services and the verification suite passes against that Worker.
