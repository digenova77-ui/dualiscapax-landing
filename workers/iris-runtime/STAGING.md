# Iris Runtime — Staging Wiring (non-production)

This document describes how to connect the Iris pages to the governed staging Worker without touching the production Pages deployment.

## Security boundary (non-negotiable)

`window.IrisSigningSecret` is browser-visible. Any value readable by browser JavaScript is public to that browser. The `IrisAuthorizeBase` option correctly enables a separate staging origin, but neither feature makes a browser-held secret private. Production must use a server-side signer; the staging hook is for verification only.

## Staging Worker

- Location: `workers/iris-runtime/`
- Entry: `worker.mjs` (present on the integration branch; not yet on this branch)
- Required bindings: `IDENTITY_API`, `TRINITY_LAW`, `IRIS_MEMORY`, `MODEL_PROVIDER`
- Receipt contract: `dualis.receipt.v1` with 64-char lowercase SHA-256
- Config: `wrangler.toml` (no production routes)
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
- Denial (no downstream inference)
- Authorization timeout (treated as denial)
- Duplicate `request_id` (409)
- Concurrent claims (exactly one succeeds)
- Receipt verification (id + sha256 present on allow)
- Binding presence check
- Receipt contract shape

## Production boundary

- Production Pages deployment remains untouched.
- No production routes, secrets, or bindings are changed by this staging wiring.
- Staging deployment should wait until the real-runtime tests and required bindings are verified.
