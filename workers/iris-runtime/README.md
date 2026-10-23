# Iris governed runtime — staging contract

This directory contains an isolated Worker entry point for Iris. It is **not deployed** by adding this file.

## Local contract tests

From the repository root:

```sh
node --test workers/iris-runtime/worker.test.mjs workers/iris-runtime/compute-arbitrator.test.mjs tests/test_api_base_trust.mjs
```

## Required staging bindings

Before a staging route can be considered available, an authorized staging operator must map existing services to all four service bindings:

- `IDENTITY_API`: server-side session verification at `POST /v1/session/verify`, returning `verified: true` and the authoritative `unity_id`.
- `TRINITY_LAW`: request-bound authorization at `POST /v1/authorize`. A valid allow response must echo the exact `request_id`, `action`, `input_sha256`, and `principal.unity_id`, alongside `decision: "allow"` and `authorized: true`. A generic allow is insufficient.
- `IRIS_MEMORY`: atomic idempotency claim at `POST /v1/requests/claim`, scoped context at `POST /v1/memory/context`, and append/receipt at `POST /v1/memory/append`.
- `MODEL_PROVIDER`: bounded inference at `POST /v1/infer`.

These are adapter contracts, not assertions that the services currently implement them. Do not create duplicate production services to satisfy a placeholder contract; inventory the existing source of truth first.

Set `IRIS_ALLOWED_ORIGINS` to exact, authorized staging origins only. Do not use wildcards. The checked-in `wrangler.toml` intentionally contains no route, service binding, secret, or origin, so the runtime should remain unavailable until explicitly configured.

## Security ordering

1. Validate origin, method, body, and a **caller-stable `x-request-id`**. Missing IDs are rejected because a fresh server-generated ID cannot deduplicate a client retry.
2. Verify the session with the identity service; never trust browser-supplied identity or authorization tickets.
3. Ask Trinity to authorize the exact principal, action, request ID, and input hash; validate every binding in the response.
4. Atomically claim the request ID before context reads or provider work. The adapter must scope idempotency by principal and request ID and atomically prevent concurrent duplicate claims.
5. Read private memory only for the probabilistic lane, scoped to the verified Unity ID.
6. Execute deterministic arithmetic locally or invoke the provider for probabilistic inference.
7. Persist the result and require a matching durable receipt.

A denied or mismatched Trinity decision must not read memory, call a provider, claim a request, or write a conversation. A duplicate/ambiguous claim must not call a provider. Neither a unit test nor a configured binding proves the real service obeys these contracts; staging end-to-end tests must verify them.

## Joule / Merit boundary

The accounting helper accepts supplied inputs; it does not measure compute, select a live energy index, verify meter calibration, issue Merit, or settle payments. Missing/invalid index data stays unpriced. A caller-supplied `measurement: "measured"` is labeled `PRICED_UNVERIFIED`, not verified metering.

## Wrangler preview failure

The root `wrangler.toml` is for the static Pages brochure and does not declare a Worker `main`. Running a Worker preview command against that root configuration can produce “Missing entry-point to Worker script or to assets directory.” This dedicated config declares the Iris Worker entry point, but it is deliberately not production-ready and does not establish which Cloudflare project emitted the supplied log. Confirm the failing project's root directory and intended output before changing any build command.

No production route, DNS, deployment, secret, binding, database, permission, or payment setting is changed by these files.
