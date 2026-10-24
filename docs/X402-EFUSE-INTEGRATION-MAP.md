# x402 + eFuse + Trinity integration map

**Status:** integration specification / source reconciliation; not a claim of live integration.

**Purpose:** preserve the source reconciliation and executable integration status for x402, deterministic law/capacity logic, Unity identity, Merit/eFuse accounting and evidence receipts. The paid runtime and durable ledger are now implemented in the integration branch; they are not deployed.

## 1. Recovered source families — keep their identities distinct

### A. x402 HTTP exchange in the website repository

Read-only source inspected on branch `cursor/x402-http-exchange-37b9`:

- `x402.html`
- `js/x402-exchange.js`
- `functions/api/x402/exchange.js`
- `_worker.js`
- `wrangler.toml`

Observed in `js/x402-exchange.js`:
- x402 protocol version 2, `exact` scheme, EIP-3009 USDC authorization.
- Default `AMOUNT = "10000"`, displayed by the page as **0.01 USDC**.
- Base mainnet and Base Sepolia payment requirements.
- `maxTimeoutSeconds = 300` for authorization validity.
- Server path asks the facilitator to `/verify`, then `/settle`, and returns a receipt only after a successful settlement response with a transaction hash.
- Environment can override pay-to, amount and facilitator values.

Important: this is the website's HTTP exchange implementation. The inspected `wrangler.toml` describes a static Pages build, and the inspected `_worker.js` does not route the x402 endpoint. These files alone do **not** prove the exchange is deployed or reachable. The 300 here means **seconds**, not dollars or compute capacity.

### B. X401/X402 compliance and estate rail

The Library contains `TEST-PROOF-RECEIPT.md` and `HANDOFF-20261019.md`, documenting a separate compliance implementation:

- Recorded test evidence: estate x402 rail **47/47**, warrant model **19/19**, and compliance pair **93/93**, with a separate attack rerun.
- Recorded one-exchange proof uses a hash-chained receipt and a settlement reference beginning `sim:`.
- The artifact explicitly says **simulated settlement — no network, no real asset**.
- The record marks real settlement, provider/KYC and production witness-key custody as closed or unresolved. It also names two narrowed partial findings: non-canonical payee-key casing and proof-shaped data nested in some envelopes.
- The recorded TEST rail's authorization-window test rejects a roughly ten-year window against `MAX_WINDOW_SECONDS = 300`.

These are valuable test results for that recorded tree and its stated TEST conditions. They do not establish that its code is the same as the website JavaScript exchange, that the two are wired together, or that a live payment occurred. The original compliance workspace paths are recorded as `~/workspace/x402-compliance/impl` and `~/workspace/swarm-node/x402-rail`; their raw trees were not available in the current repository checkout during this inspection.

### C. Vultr-era DCLM / local gateway prototype

Historical inspection notes identify `dclm_core_node.py`, `dclm_engine.ts`, `main.py`, and `x402-gateway.service`. The recorded DCLM prototype used `MAX_SINGLE_TX = 300`, `MAX_POOL_CAP = 500`, and an eFuse energy-price assumption of `$0.042/kWh`. It also had pool examples of primary 360, reserve 420 and district 520.

The local FastAPI `main.py` found in the Library describes a sandbox origin on `127.0.0.1:8080`, emits `SEE` / `HOLE` receipts, declares `dccp: NOT_ATTESTED`, and has no demonstrated x402 payment-verification or settlement path. Do not equate its hash receipt with a verified payment, Z3 proof, metered energy, or a durable distributed ledger.

The three pool examples also show why the meaning of `POOL_CAP_LIMIT = 500` must be recovered: a district value of 520 conflicts with a universal hard cap if interpreted literally. That may indicate different pool classes, a policy mismatch, or stale prototype data. It is not resolved by arithmetic alone.

## 2. What the numbers mean — do not collapse separate units

| Value | Evidence-backed meaning | Not established |
|---|---|---|
| `300 seconds` in the website x402 code | Maximum payment authorization timeout | $300 transaction cap; pool-cap ratio |
| `300` in the DCLM prototype | Recorded single-transaction limit | Whether still canonical or derived from x402 |
| `500` in the DCLM prototype | Recorded pool-cap limit | Whether universal across pool classes |
| `0.60` | Arithmetic identity 300/500 | A governing invariant, x402 requirement, or experimentally optimal value |
| `0.01 USDC` | Website exchange's default exact payment amount (`10000` base units) | The older compliance prototype's quoted price or a compute/energy price |
| `0.001` | Mentioned in historical notes as an x402 proposal price | Current canonical price or proof it belongs to the website exchange |
| `$0.042/kWh` | Historical eFuse energy-price assumption | Calibrated meter, guaranteed peg, redemption promise, or live billing rule |

The likely mistake would be to infer the ratio from two constants and then treat it as a law. Another mistake would be to confuse the x402 timeout of 300 seconds with the DCLM limit of 300 units merely because the digits match.

**Current ruling:** `0.60` is an unverified candidate from an earlier hypothesis. It is not a canonical constant. Neither $300 nor $500 should be silently removed or enforced as a universal limit until the source semantics are reconciled. Keep the ratio, fixed ceilings, pool-class bounds, payment amount, authorization window and energy tariff as separate typed fields.

## 3. Intended integrated transaction path

A staging-only code path now implements this transaction sequence across `workers/iris-runtime/worker.mjs`, `js/x402-exchange.js` and `workers/x402-ledger/worker.mjs`. It is connected in source and covered by mocked integration tests; it is not deployed, and tests do not establish live facilitator or deployed Durable Object behavior.

1. **Intent:** Iris/client submits a stable request ID, operation, identity reference and canonical resource request. The client cannot self-assert proof, energy or authority.
2. **Identity:** Unity/session verifier establishes the principal and credential state.
3. **Trinity:** the sole authorization gate binds principal, operation, request ID, input digest, policy version and resource reservation intent. Missing, conflicting or expired authorization fails closed.
4. **Deterministic law (DCLM/DC³):** normalize units and validate capacity, budgets, policy version and available resources. If a capacity ratio is eventually approved, its numerator, denominator, units, timing and rounding must be explicit. Reserve resources atomically before any irreversible action.
5. **x402 challenge:** if this operation is chargeable and no valid payment proof is present, return HTTP 402 with exact network, asset, amount, pay-to and timeout. A challenge is not authorization and not settlement.
6. **Payment verification and settlement:** validate the signed payload against the exact offered terms, then call the configured facilitator. Never execute paid work merely because the client supplied a receipt-shaped object. Treat timeouts and ambiguous facilitator responses as `IN_DOUBT`, not as success.
7. **Execution:** after both law authorization and the required payment outcome, execute idempotently under the reserved request ID. A retry must not double-charge, double-reserve or double-execute.
8. **Measurement and accounting:** record actual resource/energy measurements with meter identity, calibration, units, interval and provenance. Caller-supplied measurements are `UNVERIFIED`; do not price them as metered consumption.
9. **One evidence receipt:** bind the request digest, Unity principal, Trinity decision, policy version, reservation, payment verification/settlement reference, execution result, resource measurement and evidence-DAG parent into one canonical receipt. A hash proves bytes' integrity, not the truth of the physical event.
10. **Reconciliation:** record success, refusal, timeout, compensation/refund obligation, or `IN_DOUBT` explicitly. The historical compliance record marks remainder/flow-split rules UNSET, so no implicit distribution or Merit/eFuse issuance may occur.

**Safety order:** identity + Trinity authorization + deterministic admission → atomic reservation → payment challenge/verify/settle where required → idempotent execution → measured receipt → reconciliation. Define and test compensation semantics for the case where payment settles but execution fails before calling this path production-ready.

## 4. What x402 does and does not decide

x402 is the HTTP payment negotiation/verification/settlement rail. It does not decide whether a requested operation is lawful, whether capacity exists, whether a joule reading is authentic, whether a Merit rule is valid, or whether an eFuse peg is real.

- **Trinity** decides permission.
- **DCLM/DC³** evaluates deterministic resource/policy rules.
- **x402** proves and coordinates the required payment flow.
- **Metering** supplies measured resource evidence.
- **Unity** identifies the relevant principal/credential.
- **Merit/eFuse accounting** applies only an explicitly versioned and authorized accounting rule.
- **Receipt/DAG** preserves the evidence chain.

Do not use x402 payment amount as a proxy for resource consumption, and do not use a resource ratio as a payment protocol field.

## 5. Threshold experiment — no arbitrary constant promoted

Run the same synthetic request corpus through independent policy implementations and compare verdicts, with stakes set to zero.

### Candidate policy families

- **Absolute-only:** each explicitly scoped hard limit applies to its declared pool class.
- **Ratio-only:** a versioned, unit-consistent ratio policy applies, without hidden absolute caps.
- **Combined:** ratio and explicitly scoped absolute ceilings both apply.
- **Pool-class policy:** primary/reserve/district capacities have distinct declared semantics; test whether the historical 520 district example is allowed or a contradiction.

Sweep candidate ratios around 0.60, but include alternatives selected from the data rather than presuming a target. For every candidate, measure false acceptance, false rejection, utilization, exhaustion risk, fairness across differently sized pools and sensitivity to concurrent requests. The winning value, if any, must follow from a documented objective and reproducible results.

### Required tests

- exact boundary and one smallest-unit above/below for every declared cap;
- same ratio at different absolute scales;
- 300/500 historical examples and the 360/420/520 pool examples;
- decimal/fractional input, rounding, overflow, negative, non-finite and missing values;
- concurrent reservations and rollback after refusal;
- replayed request IDs and duplicate payment payloads;
- facilitator timeout, invalid verification, settlement failure and ambiguous settlement;
- execution failure after settlement and the declared compensation path;
- two independent policy tables must return identical verdicts for the same canonical fixtures;
- if Z3 is claimed, require an actual solver dependency and inspectable SAT/UNSAT results. Ordinary conditionals or hashes are not solver proofs.

No test may use real funds or mainnet assets. No value becomes canonical because it happens to pass a fixture.

## 6. Concrete work remaining — implementation status

**Implemented in code on the integration branch:**
- Existing website x402 v2 exchange restored into this branch at `js/x402-exchange.js`, `functions/api/x402/exchange.js` and `x402.html`; Base mainnet is now opt-in and the page defaults to Base Sepolia testnet.
- Paid runtime requires explicit `X402_AMOUNT` and `X402_PAY_TO` configuration; missing policy fails closed rather than silently using defaults.
- Facilitator HTTP failures, resource mismatch, malformed/expired/overlong authorization windows, mismatched payer and mismatched settlement network fail closed.
- `POST /v1/paid-turn` now shares the governed runtime's session verification and exact Trinity authorization path; it obtains an x402 challenge only after authorization.
- Durable payment transaction state machine implemented with a Cloudflare Durable Object in `workers/x402-ledger/worker.mjs`: RESERVED → PAYMENT_ATTEMPTED → SETTLED → EXECUTED, with RELEASED and IN_DOUBT handling.
- Ledger calls use a service token; a staging service binding is declared but no route or secrets are configured.
- Threshold interpretation remains isolated in the integer-arithmetic candidate harness and is not wired into enforcement.

**Next engineering gates:**
1. Deploy the ledger to an isolated staging environment, configure the service token, and verify real Durable Object transaction atomicity and concurrency—not just fake-storage tests.
2. Bind the existing identity, Trinity, memory and model services to the staging runtime, configure exact allowed origins, and run end-to-end tests through the real service contracts.
3. Reconcile the raw historical `x402-compliance` tree against the restored website rail and close the two recorded partial findings (non-canonical payee-key casing and deeply nested proof-shaped fields).
4. Decide the paid-operation price and network policy. The existing website default is 10000 USDC base units (0.01 USDC); the historical 0.001 proposal is not canonical. Do not change live pricing or use mainnet funds without explicit approval.
5. Wire the front end to the governed `/v1/paid-turn` endpoint using the real Unity session. The restored `x402.html` page still calls the standalone `/api/x402/exchange` receipt endpoint; it is not yet the paid compute UI.
6. Define and test a real refund/compensation process for cases where settlement succeeds but execution or durable persistence fails. The current code marks those states IN_DOUBT and fails closed; it does not claim automatic refunds.
7. Recover the original DCLM/Z3 threshold source and resolve whether 300/500 are absolute ceilings, pool-class limits, examples, or an old policy. Resolve the 520 district-pool conflict before promoting any candidate threshold.
8. Only after these gates pass, configure and verify staging routes; then request separate authorization for any production route, mainnet payment, issuance or settlement.

## 7. Evidence grading

- **Repository source inspected:** website x402 JavaScript and Pages route/config files on the historical x402 branch.
- **Prior test evidence recorded:** compliance receipt claims the counts listed above for its own TEST tree.
- **CI evidence:** GitHub Actions Iris Runtime Integration run 132 passed **81/81** Node tests for the code state at commit `d7e089753b758c8684dd2b54ddbfd2999f257a7a`. Tests use mock service bindings, fake Durable Object storage and a mocked facilitator.
- **Not verified:** deployed ledger atomicity, live facilitator operation, real settlement, actual identity/Trinity/memory/model service contracts, front-end-to-paid-runtime wiring, refund/compensation, calibrated energy measurement, Z3-backed threshold proof, or production eFuse/Merit settlement.

The point is not to start x402 from scratch. It is to bring the existing rails together under one explicit transaction contract while preserving what has actually been proven and exposing what still needs to be connected.


## 8. Executable threshold gauntlet (isolated, synthetic)

A pure comparison harness now exists at `workers/iris-runtime/threshold-gauntlet.mjs`, with tests at `workers/iris-runtime/threshold-gauntlet.test.mjs`. It is not imported by the production runtime and cannot authorize, charge, or execute anything.

The local Node test run passed **9/9 tests**:
- exact integer-ratio boundaries below/at/above 0.60;
- ratio-only vs absolute-only disagreement at 312/520;
- scale invariance for the candidate ratio across 216/360, 252/420 and 312/520;
- transaction-to-pool ratio versus post-reservation-utilization interpretations;
- physical capacity overflow;
- malformed, negative, fractional, leading-zero and zero transaction input;
- explicit comparison output showing disagreement rather than silently selecting a canonical rule;
- ratio sweep at 0.55, 0.59, 0.60, 0.61 and 0.65;
- exact absolute-limit boundary and one-unit-over cases for both candidate limits.

The harness uses canonical integer strings and basis points (6000 = 0.60), not floating-point division. Its inputs are synthetic common units; this does **not** claim the historical dollar figures are the same unit. The test result is a local run of this harness, not evidence that the existing runtime enforces a threshold or that CI has passed this commit.


## 9. Omnisoftware universal work contract — first executable slice

The integration branch now contains:

- `workers/iris-runtime/universal-work-contract.mjs`: strict envelope validation, resource-measurement record validation, and transparent quote decomposition.
- `workers/iris-runtime/universal-work-contract.test.mjs`: automated Node tests for valid/invalid envelopes, separation of complexity descriptors from energy, cost decomposition, energy double-counting, and measurement provenance.
- `schemas/dualis-work-v1.schema.json`: machine-readable JSON Schema for work envelopes and resource measurement records.
- `docs/UNIVERSAL-DECISION-RESOURCE-ECONOMY.md`: economic and architecture contract.

This is a standalone first slice and is **not yet wired into the Iris request path**. It does not authorize or execute work, meter physical energy, establish a canonical eFuse peg, or settle payments. Trinity remains the authorization gate. Complexity class and features are descriptors/estimates, not a direct energy measurement. Measurement validation checks structure and provenance fields but cannot independently prove that a meter reading is true.

The quote helper returns `QUOTE_ONLY`, never a settled charge, and rejects a quote that separately charges energy when the provider cost already includes it. Next: execute the test suite in CI, align JSON Schema and JavaScript validation against shared fixtures, then integrate the contract at the runtime boundary without weakening existing Trinity, idempotency, payment, or receipt checks.
