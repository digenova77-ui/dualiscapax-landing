# Iris staging validation gate

This file is the operator-facing gate for validating the governed Iris runtime. It records what repository CI proves versus what still requires a real isolated staging environment. Do not treat mocked adapter tests as evidence that remote services are integrated.

## Current source-of-truth

- Runtime: `workers/iris-runtime/worker.mjs`
- Staging declaration: `workers/iris-runtime/wrangler.toml`
- Runtime adapter tests: `workers/iris-runtime/worker.test.mjs` and sibling `*.test.mjs` files
- Historical service excerpts: `workers/iris-runtime/HISTORICAL-SOURCE-AUDIT.md` (explicitly unverified against live host)
- PR: https://github.com/digenova77-ui/dualiscapax-landing/pull/163

## Gate A — repository CI

As of commit `cf3ca413948d1366f2d21c4bbd8842702d607650` on `integration/iris-runtime-main-20261024`:
- Iris Runtime Integration: passed.
- Iris and Trinity test gauntlet: passed; live Trinity edge verification was skipped.
- Static i18n validation: passed.
- Elite CI: static, provider-authorization boundary, and voice jobs passed.

These are source/CI results only. They are not a live service test or a deployment.

## Gate B — real staging bindings (currently unverified)

The runtime's current staging `wrangler.toml` declares only the `X402_LEDGER` service binding. The following required adapters are not configured in that file and must be supplied by an authorized staging operator:

| Binding / setting | Required contract | Evidence required |
|---|---|---|
| `IDENTITY_API` | `POST /v1/session/verify` | Valid session accepted; invalid/expired session rejected |
| `TRINITY_LAW` | `POST /v1/authorize` | Request-bound allow and deny; mismatched principal/action/request/input rejected |
| `IRIS_MEMORY` | `POST /v1/requests/claim`, `/v1/memory/context`, `/v1/memory/append` | Atomic claim, duplicate/concurrent replay handling, durable append |
| `MODEL_PROVIDER` | `POST /v1/infer` | Provider request only after identity and Trinity authorization |
| `IRIS_ALLOWED_ORIGINS` | Exact allowlisted origins | Unlisted/missing Origin denied |
| `X402_LEDGER` + token/policy | Versioned payment claim/attempt/settlement contract | Isolated test payment, idempotent replay, ambiguous state fails closed |

Never place credentials in source control. Use the platform's protected secret/configuration mechanism. Do not bind historical services merely because their names or ports look familiar; verify their source, deployed revision, authentication, and contract first.

## Gate C — required end-to-end evidence

1. Capture staging Worker configuration and deployment revision without exposing secret values.
2. Confirm `GET /health` reports required bindings present; paid operations remain unavailable until payment contract verification is complete.
3. Send one fixed deterministic request with a unique stable request ID. Record the canonical input hash, exact Trinity decision binding, output hash, and independently recomputed receipt verification.
4. Replay the same request ID and payload; prove no second protected execution or append occurs.
5. Reuse the request ID with changed input; prove conflict rejection.
6. Deny through Trinity; prove provider, memory claim/append, settlement, and other protected side effects do not occur.
7. Simulate each required adapter unavailable and malformed/mismatched response; prove fail-closed behavior.
8. If probabilistic inference is enabled, prove it follows the same authorization and idempotency gates.
9. Validate rollback floor against trusted monotonic state. The PUEL verifier now requires an explicit floor, but persistence/monotonic storage is not yet implemented by that verifier change alone.
10. Save redacted request/response evidence, test results, deployed commit SHA, and operator/time. Do not record cookies, tokens, secrets, or user text.

## Gate D — release decision

- Keep the integration branch and production isolated until Gate B and Gate C have evidence.
- Do not claim energy metering, token issuance, or settlement as proven from mock tests. eFuse needs measured resource evidence; Merit needs an explicit entitlement policy; Unity needs verified identity credentials.
- Mark a gate PASS only from captured evidence. Otherwise mark it BLOCKED or NOT RUN.
