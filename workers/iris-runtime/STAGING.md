# Iris Runtime — Staging Wiring (non-production)

This document describes how to connect the Iris pages to the governed staging Worker without touching the production Pages deployment.

## Security boundary (non-negotiable)

`window.IrisSigningSecret` is browser-visible. Any value readable by browser JavaScript is public to that browser. Production must use a server-side signer. The staging hook is for verification only.

The production client path (`js/iris-authorize.js` → `authorizeProduction`) posts to `IrisAuthorizeBase` with same-origin credentials and never supplies a secret. The Worker is expected to hold `TRINITY_HMAC_SECRET` as a Worker secret.

## Staging Worker

## Fast path: deploy an isolated contract-test stack

The repository now contains explicitly fake dependency fixtures under
`workers/iris-staging-dependencies/`. They remove the need to invent external
endpoints just to exercise the complete runtime-to-memory flow. They are **not**
real identity verification, a production Trinity policy engine, or an external
AI model:

- Identity fixture accepts only one operator-supplied staging Unity ID.
- Trinity fixture allows only `iris.turn.look` and independently recomputes the text digest.
- Model fixture returns a deterministic marker and never calls an external model.
- Every fixture fails closed unless `STAGING_FIXTURE_ENABLED=true` and
  `STAGING_UNITY_ID` are configured as Worker secrets.

From a trusted machine with Wrangler authenticated to the intended Cloudflare
account, run:

```bash
bash workers/deploy-iris-staging-stack.sh
```

The script runs local verifiers/tests first, generates fresh memory and HMAC
secrets in memory, configures staging-only Worker secrets, deploys memory,
deploys the three dependency fixtures, then deploys `iris-runtime-staging`.
It asks for the runtime `workers.dev` URL so it can run live checks. It never
deploys Pages or configures production routes. If the live checks are skipped,
the script does not print secrets; rerun the stack script to rotate secrets and
perform the live check in the same session.

**Boundary:** passing this gauntlet proves the Worker-to-Worker contracts,
durable claim, receipt lookup, and fixture-backed inference path. It does not
prove real Unity identity, real Trinity policy, or real model inference. Replace
the fixture bindings with approved staging providers before any production use.

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
- Memory service token (same random value configured as a secret in both Workers):
  ```bash
  # In workers/iris-memory:
  npx wrangler secret put IRIS_MEMORY_SERVICE_TOKEN
  # In workers/iris-runtime:
  npx wrangler secret put IRIS_MEMORY_SERVICE_TOKEN --env staging
  ```
  Never put this token in source, browser code, command logs, or committed config.
- Durable memory service: workers/iris-memory/ uses a SQLite-backed Durable Object. Deploy this service first; it must be reachable as the iris-memory-staging service binding.
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

## Operational diagnostics

The runtime's `/v1/metrics` and `/v1/audit` endpoints are disabled by default.
They can reveal request identifiers and policy outcomes, so they require a dedicated
server-side Worker secret:

```bash
cd workers/iris-runtime
npx wrangler secret put IRIS_DIAGNOSTICS_TOKEN --env staging
```

Use a fresh random value distinct from `TRINITY_HMAC_SECRET` and
`IRIS_MEMORY_SERVICE_TOKEN`. Send it only from a trusted operator-side client
as `Authorization: Bearer <token>`. Never embed it in browser code or commit it.
If the secret is absent, the endpoints return 404; missing or incorrect credentials
return 401. Metrics are still isolate-local counters, not durable or globally
aggregated telemetry.

## Durable claim and receipt contract (required for staging)

The Identity and Trinity service response contracts are also strict:
- `IDENTITY_API /check` must return `verified: true` and the exact `unity_id` (or `principal.unity_id`) requested. A generic HTTP 200 is not identity proof.
- `TRINITY_LAW /evaluate` must return `authorized: true`, `decision: "allow"`, the exact `request_id`, `principal.unity_id`, `action`, and `input_sha256` that were evaluated. Any missing or mismatched field denies the turn before a claim is attempted.

The memory service must implement a durable, cross-isolate contract. The Worker calls
`IRIS_MEMORY` at `/v1/requests/claim` only after identity and Trinity allow, passing
`request_id`, principal, action, server-computed `input_sha256`, and the proposed receipt.

The claim endpoint must atomically persist both the unique request claim and its receipt:
- **HTTP 200, `claimed: true`, `receipt`** means this request acquired the claim. The returned receipt must match the request ID and server-computed text digest.
- **HTTP 200, `replay: true`, `receipt`** means the same request/digest already exists. Return the original receipt unchanged.
- **HTTP 409** means the request ID conflicts with an existing claim.
- Any other result or malformed success response fails closed. The Worker does not issue a second non-atomic `/record` call.

Inference and receipt verification query `IRIS_MEMORY` at `/v1/requests/get` with
`request_id`. The service returns `{ found: true, receipt }` only for a persisted record.
A missing record, malformed response, timeout, or binding error must deny the operation.
This is the source of truth; isolate-local maps are not authoritative.

After claim (including a replay), the runtime reads `/v1/context/read` for the same principal before returning authorization. Inference reads it again immediately before calling the model provider. Context is a bounded list of prior authorized activity metadata (request ID, action, input digest, receipt ID, timestamp); it deliberately does not store or return raw prompt text. The principal index and claim record are updated in the same Durable Object transaction.

The test fixture simulates this API in memory and is **not** evidence of persistence across
Workers isolates or restarts. Before staging deploy, inspect and test the actual
`iris-memory-staging` service implementation, including concurrent claims, conflict handling,
receipt persistence, and lookup after a cold start. The memory service source and Wrangler configuration are now in this PR, but the Cloudflare service has not yet been deployed or live-verified. The identity, Trinity, and model-provider service bindings also need real staging services before runtime deployment.

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

Before deploying the runtime, deploy the durable memory service from workers/iris-memory/ and configure IRIS_MEMORY_SERVICE_TOKEN in both Workers. Then deploy the runtime with the required identity, Trinity, and model-provider staging bindings configured.

After `./deploy-staging.sh`:

```bash
export IRIS_STAGING_URL=https://iris-runtime-staging.<subdomain>.workers.dev
export IRIS_STAGING_SIGNING_SECRET='<same value as the staging TRINITY_HMAC_SECRET>'
export IRIS_STAGING_UNITY_ID='<registered staging Unity ID>'
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
