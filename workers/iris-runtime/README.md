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
- `IRIS_MEMORY`: atomic idempotency claim at `POST /v1/requests/claim`, scoped context at `POST /v1/memory/context`, and append/receipt at `POST /v1/memory/append`. The append request carries the contract version, Unity ID, request ID, action, input SHA-256, and result SHA-256. Its response must echo those bindings exactly, set `persisted: true`, and return a non-empty `receipt_id` plus a 64-character lowercase SHA-256 `receipt_sha256` plus a canonical receipt envelope whose SHA-256 the runtime recomputes. The runtime computes the output digest itself and rejects a receipt whose request/action/input/output bindings differ.

The claim response is a strict versioned contract and must echo `contract: "dualis.idempotency.v1"`, `unity_id`, `request_id`, and the exact `input_sha256`. It must distinguish `state: "RESERVED"` with `claimed: true` (new reservation), `state: "APPLIED"` with a stored `replay` object (same request already committed), `state: "CONFLICT"` (same operation key with different semantic input), and `state: "IN_DOUBT"` (effect outcome unresolved). The replay object must bind the same Unity ID/request ID and authorization label and include the original result, provider label, receipt ID, and receipt SHA-256. A replay returns the original result/receipt without calling the provider or appending again. Unknown states, mismatched digests, or malformed replay receipts fail closed. The adapter must implement these semantics atomically; tests using a fake adapter are not evidence that it does.
- `MODEL_PROVIDER`: bounded inference at `POST /v1/infer`.

These are adapter contracts, not assertions that the services currently implement them. Do not create duplicate production services to satisfy a placeholder contract; inventory the existing source of truth first.

## Trinity policy boundary

The runtime treats Trinity as the authorization decision point, after server-side session verification and before the durable claim, private-memory read, provider call, or persistence. It accepts an allow only when the response matches the verified Unity ID, exact action, caller-stable request ID, and input SHA-256. Missing, denied, malformed, or mismatched decisions fail closed.

The request schema for this version is exactly `{ "text": string }`. Extra fields are rejected before identity or Trinity calls, so client-supplied tickets, roles, or metadata cannot be silently ignored while a different payload is authorized. The input digest is SHA-256 of the exact UTF-8 text passed to the compute/inference planner.

The standing policy names `TRUTH_OR_NOTHING`, `NO_FORCE`, `HOST_SAFE`, `CLEANUP_FIRST`, and Father-only write authority are not magical effects of naming them in a prompt or README. They must be explicitly represented and enforced by the authoritative Trinity policy and by the protected service that performs each action. This inference endpoint does not implement general write actions or prove Father-only write authority; any future write route needs its own exact action binding and explicit principal/authority check. `CLEANUP_FIRST` likewise needs a concrete, auditable cleanup/state-transition contract before it can be claimed as enforced.

Trinity is not identity authentication, consensus, Sybil resistance, execution, energy metering, Merit issuance, or settlement. The runtime delegates authentication to `IDENTITY_API`, computation to the deterministic planner or model provider, and durable idempotency/persistence to `IRIS_MEMORY`.

Set `IRIS_ALLOWED_ORIGINS` to exact, authorized staging origins only. Do not use wildcards. The checked-in `wrangler.toml` intentionally contains no route, service binding, secret, or origin, so the runtime should remain unavailable until explicitly configured.

## Security ordering

1. Validate origin, method, body, and a **caller-stable `x-request-id`**. Missing IDs are rejected because a fresh server-generated ID cannot deduplicate a client retry.
2. Verify the session with the identity service; never trust browser-supplied identity or authorization tickets.
3. Ask Trinity to authorize the exact principal, action, request ID, and input hash; validate every binding in the response.
4. Atomically claim the request ID before context reads or provider work. The adapter must scope idempotency by principal and request ID and atomically prevent concurrent duplicate claims.
5. Read private memory only for the probabilistic lane, scoped to the verified Unity ID, with at most 12 context items and a 32 KiB serialized-context cap.
6. Execute deterministic arithmetic locally or invoke the provider for probabilistic inference. Provider output is bounded to 12,000 characters.
7. Persist the result and require a matching durable receipt.

A denied or mismatched Trinity decision must not read memory, call a provider, claim a request, or write a conversation. A duplicate/ambiguous claim must not call a provider. Neither a unit test nor a configured binding proves the real service obeys these contracts; staging end-to-end tests must verify them.

## Joule / Merit boundary

The accounting helper accepts supplied inputs; it does not measure compute, select a live energy index, verify meter calibration, issue Merit, or settle payments. Missing/invalid index data stays unpriced. A caller-supplied `measurement: "measured"` is labeled `PRICED_UNVERIFIED`, not verified metering.

## Wrangler preview failure

The root `wrangler.toml` is for the static Pages brochure and does not declare a Worker `main`. Running a Worker preview command against that root configuration can produce “Missing entry-point to Worker script or to assets directory.” This dedicated config declares the Iris Worker entry point, but it is deliberately not production-ready and does not establish which Cloudflare project emitted the supplied log. Confirm the failing project's root directory and intended output before changing any build command.

No production route, DNS, deployment, secret, binding, database, permission, or payment setting is changed by these files.

## Existing frontend is not yet wired to this Worker

The current `ai/app.html` and legacy `ai/iris.html` load `ai/dclm-look.js`, `js/iris-fuel-gate.js`, and `js/byok.js`. The Fuel ticket is explicitly a browser-side UX gate, not a server authorization boundary. A supplied ticket object can influence the client-side lane, and BYOK inference calls the provider directly from the browser with the visitor's own session-stored key.

Therefore these pages are **not proof of a live Trinity-governed backend**. The staging Worker in this directory is not connected to them by this PR. Do not claim that the existing UI is server-authorized, that private memory is governed by this Worker, or that a provider call has a server-issued Trinity receipt.

The safe integration sequence is: configure authorized staging service bindings; prove session verification, request-bound Trinity allow/deny, idempotency, scoped memory, provider invocation, and hashed persistence receipts end-to-end; then migrate the UI to the governed endpoint and remove direct provider calls for protected operations. Keep current behavior clearly labelled as a client-side UX / BYOK path until that sequence passes.


## x402-paid runtime path

`POST /v1/paid-turn` is implemented as a distinct paid operation path. It shares the same identity verification and exact Trinity authorization checks as `/v1/turn`; an unauthorized request never reaches the facilitator. With an authorized request and no `PAYMENT-SIGNATURE`, it returns the x402 v2 payment challenge. With a signature, it requires the durable `X402_LEDGER` service binding before settlement.

The payment ledger is a required production dependency, not an in-memory map. It must atomically implement these versioned endpoints:

- `POST /v1/payments/claim`: idempotently bind Unity ID, request ID, action, input digest and payment-header digest. Return `RESERVED` + `claimed:true` for a new transaction, `SETTLED` or `EXECUTED` with the original `payment_receipt` and transaction for the same payment, `CONFLICT` for a different payment/request binding, or `IN_DOUBT` for unresolved settlement.
- `POST /v1/payments/record`: durably record the facilitator settlement receipt and transition only the matching reserved payment to `SETTLED`.
- `POST /v1/payments/release`: release a reservation only when the runtime has evidence that no settlement occurred.
- `POST /v1/payments/in-doubt`: preserve unresolved facilitator or post-settlement failures for reconciliation; never reset them to a fresh chargeable state.
- `POST /v1/payments/complete`: bind the settled payment to the durable execution receipt and transition to `EXECUTED`. This operation must be idempotent.

Every response must echo the contract, Unity ID, request ID, action, input digest and payment digest. The store must prevent concurrent duplicate claims and must never allow a different payment digest to overwrite an existing settlement. If the facilitator outcome is ambiguous, the runtime records `IN_DOUBT` and does not execute again automatically. If payment is settled but inference or persistence fails, the payment remains unresolved and requires a defined refund/compensation workflow; no automatic refund is claimed by this code.

The runtime verifies that a stored settlement receipt has the exact scheme, amount shape, recipient, asset, network, payer and transaction-hash shape. The x402 facilitator is still the authority for cryptographic signature/chain verification; the runtime additionally binds the returned receipt to the ledger's idempotent request.

**Current deployment status:** the Durable Object ledger implementation and staging service-binding declaration now exist in source. They are not deployed or configured with secrets, and the runtime still lacks the identity, Trinity, memory and model service bindings. The paid route therefore remains unavailable until authorized staging configuration. Local tests use fake Durable Object storage/service bindings and a mocked facilitator; they prove state-machine logic and runtime control flow, not deployed Cloudflare atomicity or a live payment. Do not attach this route to production or use real funds until the ledger, compensation path, staging facilitator, exact price policy and operator approval are verified.
