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

## Atomic claim contract (required for a real staging deployment)

After identity and Trinity allow, the Worker calls `IRIS_MEMORY` at
`/v1/requests/claim` with `request_id`, verified principal, action,
server-computed `input_sha256`, and the proposed receipt.

The service must implement this contract atomically across requests and isolates:
- HTTP 200 with no replay marker means this request acquired the claim.
- HTTP 200 with `replay: true` must return the original stored receipt; the Worker checks its request ID and text digest before replaying it.
- HTTP 409 means the request ID is already claimed with a conflicting body or claim.
- Other non-2xx results fail closed; the Worker must not fall back to local-only state.

A generic stub returning HTTP 200 is sufficient for unit tests only. Before staging deploy,
verify the actual `iris-memory-staging` service implements this exact contract and persists
claims and receipts across isolate restarts. The Wrangler service name is currently a
placeholder until that service is confirmed.

## Production boundary

- Production Pages deployment remains untouched.
- No production routes, secrets, or bindings are changed by this staging wiring.
- Staging deployment should wait until the real service bindings are pointed at live staging services and the verification suite passes against that Worker.

## Scripts

### Set the HMAC secret (staging only)

```bash
cd workers/iris-runtime
./set-secret.sh
```

You will be prompted for the value. It is stored as a Cloudflare Worker secret and never written to source or the browser. Equivalent direct command:

```bash
npx wrangler secret put TRINITY_HMAC_SECRET --env staging
```

Confirm with:

```bash
npx wrangler secret list --env staging
```

### Deploy to staging

```bash
cd workers/iris-runtime
./deploy-staging.sh
```

The script runs `verify-staging.mjs` first, then deploys with `wrangler deploy --env staging`. Production is not touched.

### Verify configuration

```bash
node workers/iris-runtime/verify-staging.mjs
```

Checks wrangler bindings, Worker source shape, and receipt contract. Exits non-zero on failure.

## Post-deploy (implemented)

After `./deploy-staging.sh`:

```bash
export IRIS_STAGING_URL=https://iris-runtime-staging.<subdomain>.workers.dev
./post-deploy.sh
```

`post-deploy.sh` runs the local suites always and the live checks when `IRIS_STAGING_URL` is set.

Live checks (`verify-live.mjs`):
1. `/health` is ok and `missing` is empty
2. `force_deny: true` returns `authorized: false`
3. an allow returns `dualis.receipt.v1` with `rct_` id and 64-char `sha256`

## Page wiring

Iris pages load, in order:
- `/js/iris-receipt.js`
- `/js/iris-authorize.js`
- `/js/iris-boot.js`
- `/js/iris-session.js`

`iris-boot.js` reads:

```html
<meta name="iris-authorize-base" content="">
```

Set `content` to the staging Worker origin on the staging page only. Leave it empty in production. The boot script never sets `window.IrisSigningSecret`.
