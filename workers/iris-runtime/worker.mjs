/**
 * Iris single governed runtime (staging integration unit).
 *
 * Required service bindings: IDENTITY_API, TRINITY_LAW, IRIS_MEMORY, MODEL_PROVIDER.
 * These are service bindings, not URL-based third-party calls. No binding is optional:
 * missing authority or persistence fails closed before inference.
 *
 * Adapter contracts are versioned under /v1. No secret, prompt, cookie, or user text is logged.
 */
import { arbitrateCompute } from "./compute-arbitrator.mjs";
import { validateWorkEnvelope } from "./universal-work-contract.mjs";
import { decodeHeader, handleExchange } from "../../js/x402-exchange.js";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_TEXT_CHARS = 8000;
const MAX_OUTPUT_CHARS = 12000;
const MAX_MEMORY_CONTEXT_BYTES = 32 * 1024;
const RECEIPT_HASH_RE = /^[a-f0-9]{64}$/;
const REQUEST_ID_RE = /^[A-Za-z0-9._:-]{8,128}$/;
const RECEIPT_CONTRACT = "dualis.receipt.v1";

const json = (body, status = 200, headers = {}) =>
  Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'",
      ...headers,
    },
  });

const unavailable = (stage) =>
  json({ available: false, stage, reason: "required-service-unavailable" }, 503);

function compareUnicodeScalars(a, b) {
  const left = Array.from(a, (character) => character.codePointAt(0));
  const right = Array.from(b, (character) => character.codePointAt(0));
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return left.length - right.length;
}

export function canonicalJson(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new Error("non-canonical-number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (!value || typeof value !== "object") throw new Error("non-canonical-value");
  const keys = Object.keys(value).sort(compareUnicodeScalars);
  return "{" + keys.map((key) => JSON.stringify(key) + ":" + canonicalJson(value[key])).join(",") + "}";
}

async function verifyReceiptEnvelope(receipt, expected) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) return false;
  const envelope = {
    contract: RECEIPT_CONTRACT,
    unity_id: expected.unity_id,
    request_id: expected.request_id,
    action: expected.action,
    input_sha256: expected.input_sha256,
    result_sha256: expected.result_sha256,
    receipt_id: expected.receipt_id,
  };
  if (receipt.contract !== envelope.contract ||
      receipt.unity_id !== envelope.unity_id ||
      receipt.request_id !== envelope.request_id ||
      receipt.action !== envelope.action ||
      receipt.input_sha256 !== envelope.input_sha256 ||
      receipt.result_sha256 !== envelope.result_sha256 ||
      receipt.receipt_id !== envelope.receipt_id) return false;
  return typeof expected.receipt_sha256 === "string" &&
    RECEIPT_HASH_RE.test(expected.receipt_sha256) &&
    await sha256(canonicalJson(envelope)) === expected.receipt_sha256;
}

function allowedOrigin(request, env) {
  const origin = request.headers.get("origin");
  const configured = String(env.IRIS_ALLOWED_ORIGINS || "")
    .split(",").map((x) => x.trim()).filter(Boolean);
  return !!origin && configured.includes(origin) ? origin : null;
}

async function callJson(binding, path, init) {
  if (!binding || typeof binding.fetch !== "function") throw new Error("binding-unavailable");
  const response = await binding.fetch(new Request("https://internal.invalid" + path, init));
  if (!response.ok) throw new Error("upstream-not-ok");
  const data = await response.json();
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("invalid-upstream-response");
  return data;
}

async function readBody(request) {
  const rawLength = request.headers.get("content-length");
  if (rawLength !== null && (!/^\d+$/.test(rawLength) || Number(rawLength) > MAX_BODY_BYTES)) return null;
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return null;
  try { return JSON.parse(raw); } catch { return undefined; }
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    if (request.method === "OPTIONS") {
      if (!origin) return json({ available: false, reason: "origin-not-authorized" }, 403);
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    let response;
    try { response = await handleRequest(request, env); }
    catch { response = unavailable("request"); }
    return origin ? withCors(response, origin) : response;
  },
};

async function handleRequest(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/health" && request.method === "GET") {
    const bindings = {
      identity: !!env.IDENTITY_API,
      trinity: !!env.TRINITY_LAW,
      memory: !!env.IRIS_MEMORY,
      provider: !!env.MODEL_PROVIDER,
      payment_ledger: !!env.X402_LEDGER && typeof env.X402_LEDGER_TOKEN === "string" && env.X402_LEDGER_TOKEN.length >= 32 && validPaymentPolicy(env),
    };
    const complete = bindings.identity && bindings.trinity && bindings.memory && bindings.provider &&
      typeof env.IRIS_ALLOWED_ORIGINS === "string" &&
      env.IRIS_ALLOWED_ORIGINS.trim().length > 0;
    return json({
      service: "iris-governed-runtime",
      version: "1",
      available: complete,
      bindings,
      authorization: "trinity-required",
      persistence: "required",
      paid_operations: bindings.payment_ledger ? "configured-but-contract-unverified" : "unavailable",
    }, complete ? 200 : 503);
  }

  const isPaidTurn = url.pathname === "/v1/paid-turn";
  const isWorkValidation = url.pathname === "/v1/work/validate";
  const isWorkPrepare = url.pathname === "/v1/work/prepare";
  if (url.pathname !== "/v1/turn" && !isPaidTurn && !isWorkValidation && !isWorkPrepare) return json({ available: false, reason: "not-found" }, 404);
  if (request.method !== "POST") return json({ available: false, reason: "method-not-allowed" }, 405, { allow: "POST" });

  const origin = allowedOrigin(request, env);
  if (!origin) return json({ available: false, stage: "origin", reason: "origin-not-authorized" }, 403);

  // Prepare creates a content-bound envelope only. Caller-supplied identity is metadata,
  // not authentication or authority; this endpoint never executes or authorizes work.
  if (isWorkPrepare) {
    const body = await readBody(request);
    if (body === null) return json({ valid: false, errors: ["body-too-large"], execution_performed: false }, 413);
    if (body === undefined) return json({ valid: false, errors: ["invalid-json"], execution_performed: false }, 400);
    const allowed = ["request_id", "unity_id", "action", "module", "policy_version", "input", "complexity", "resource_budget", "verification"];
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).length !== allowed.length || Object.keys(body).some((key) => !allowed.includes(key)) ||
        typeof body.input !== "string" || !body.input.trim() || body.input.length > MAX_TEXT_CHARS) {
      return json({ valid: false, errors: ["invalid-prepare-input"], execution_performed: false }, 400);
    }
    const envelope = {
      contract: "dualis.work.v1",
      request_id: body.request_id,
      input_sha256: await sha256(body.input),
      unity_id: body.unity_id,
      action: body.action,
      module: body.module,
      policy_version: body.policy_version,
      complexity: body.complexity,
      resource_budget: body.resource_budget,
      verification: body.verification,
    };
    const result = validateWorkEnvelope(envelope);
    return json({
      contract: "dualis.work.preparation.v1",
      valid: result.valid,
      errors: result.errors,
      envelope: result.valid ? envelope : null,
      execution_performed: false,
      authorization_performed: false,
      metering_performed: false,
      settlement_performed: false,
      identity_verified: false,
    }, result.valid ? 200 : 422);
  }

  // This endpoint validates a work envelope only. It does not authenticate a principal,
  // invoke Trinity, execute work, meter resources, charge, or settle anything.
  if (isWorkValidation) {
    const body = await readBody(request);
    if (body === null) return json({ valid: false, errors: ["body-too-large"], execution_performed: false }, 413);
    if (body === undefined) return json({ valid: false, errors: ["invalid-json"], execution_performed: false }, 400);
    const result = validateWorkEnvelope(body);
    return json({
      contract: "dualis.work.validation.v1",
      valid: result.valid,
      errors: result.errors,
      execution_performed: false,
      authorization_performed: false,
      metering_performed: false,
      settlement_performed: false,
    }, result.valid ? 200 : 422);
  }

  // A caller-stable ID is mandatory: generating a new ID server-side cannot protect retries.
  const requestId = request.headers.get("x-request-id");
  if (!requestId || !REQUEST_ID_RE.test(requestId)) {
    return json({ available: false, stage: "request", reason: "valid-client-request-id-required" }, 400);
  }

  const body = await readBody(request);
  if (body === null) return json({ available: false, stage: "request", reason: "body-too-large" }, 413);
  // Keep the authorization digest bound to the complete accepted semantic input.
  // This version accepts only { text }; reject extra client-controlled fields rather
  // than silently ignoring data that a caller might believe Trinity authorized.
  if (
    !body || typeof body !== "object" || Array.isArray(body) ||
    Object.keys(body).length !== 1 || !Object.hasOwn(body, "text") ||
    typeof body.text !== "string" || !body.text.trim() || body.text.length > MAX_TEXT_CHARS
  ) {
    return json({ available: false, stage: "request", reason: "invalid-input" }, 400);
  }

  const computePlan = arbitrateCompute(body.text);

  // Fail before identity/authorization/claim side effects when a required service
  // binding is absent. In particular, never reserve a probabilistic request that
  // cannot reach inference because the provider binding is missing.
  const hasBinding = (binding) => !!binding && typeof binding.fetch === "function";
  if (!hasBinding(env.IDENTITY_API)) return unavailable("identity");
  if (!hasBinding(env.TRINITY_LAW)) return unavailable("trinity");
  if (!hasBinding(env.IRIS_MEMORY)) return unavailable("idempotency-claim");
  if (isPaidTurn && (!hasBinding(env.X402_LEDGER) || typeof env.X402_LEDGER_TOKEN !== "string" || env.X402_LEDGER_TOKEN.length < 32)) return unavailable("payment-ledger");
  if (isPaidTurn && !validPaymentPolicy(env)) return unavailable("payment-policy");
  if (computePlan.lane === "probabilistic" && !hasBinding(env.MODEL_PROVIDER)) return unavailable("inference");

  let identity;
  try {
    identity = await callJson(env.IDENTITY_API, "/v1/session/verify", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "origin": origin,
        ...(request.headers.get("cookie") ? { cookie: request.headers.get("cookie") } : {}),
      },
      body: JSON.stringify({ origin, request_id: requestId }),
    });
  } catch { return unavailable("identity"); }
  const unityId = typeof identity.unity_id === "string" ? identity.unity_id : "";
  if (identity.verified !== true || !/^[A-Za-z0-9_-]{8,128}$/.test(unityId)) {
    return json({ available: false, stage: "identity", reason: "session-not-verified" }, 401);
  }

  const inputSha256 = await sha256(body.text);
  let law;
  try {
    law = await callJson(env.TRINITY_LAW, "/v1/authorize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        principal: { unity_id: unityId },
        action: computePlan.action,
        request_id: requestId,
        input_sha256: inputSha256,
        memory_requested: computePlan.lane === "probabilistic",
        compute_lane: computePlan.lane,
      }),
    });
  } catch { return unavailable("trinity"); }

  const lawPrincipal = law.principal && typeof law.principal === "object" ? law.principal.unity_id : null;
  if (
    law.decision !== "allow" ||
    law.authorized !== true ||
    law.request_id !== requestId ||
    law.action !== computePlan.action ||
    law.input_sha256 !== inputSha256 ||
    lawPrincipal !== unityId
  ) {
    return json({ available: false, stage: "trinity", reason: "authorization-denied-or-unbound" }, 403);
  }

  let claim;
  try {
    claim = await callJson(env.IRIS_MEMORY, "/v1/requests/claim", {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": requestId },
      body: JSON.stringify({
        contract: "dualis.idempotency.v1",
        unity_id: unityId,
        request_id: requestId,
        action: computePlan.action,
        input_sha256: inputSha256,
      }),
    });
  } catch { return unavailable("idempotency-claim"); }
  if (
    claim.unity_id !== unityId ||
    claim.request_id !== requestId ||
    claim.action !== computePlan.action ||
    claim.input_sha256 !== inputSha256 ||
    claim.contract !== "dualis.idempotency.v1"
  ) {
    return json({ available: false, stage: "idempotency-claim", reason: "claim-binding-mismatch" }, 503);
  }

  // The store must distinguish a new reservation, a committed replay, a semantic
  // conflict, and an unresolved prior effect. A boolean-only claim cannot prove
  // safe retry behavior, so legacy/ambiguous responses fail closed.
  if (claim.state === "CONFLICT") {
    if (paymentContext) await markPaymentInDoubt(env, { ...paymentContext, reason: "settled-payment-operation-conflict" });
    return json({ available: false, stage: "idempotency-claim", reason: "operation-content-conflict" }, 409);
  }
  if (claim.state === "IN_DOUBT") {
    if (paymentContext) await markPaymentInDoubt(env, { ...paymentContext, reason: "memory-operation-in-doubt-after-payment" });
    return json({ available: false, stage: "idempotency-claim", reason: "prior-operation-in-doubt" }, 503);
  }
  // Only a clean reservation or a validated committed replay may proceed to
  // payment handling. Conflict, unresolved, and unknown states exit before any
  // payment-ledger or protected-memory follow-on calls.
  if (claim.state !== "RESERVED" && claim.state !== "APPLIED") {
    return json({ available: false, stage: "idempotency-claim", reason: "ambiguous-claim-state" }, 503);
  }
  if (claim.state === "RESERVED" && claim.claimed !== true) {
    return json({ available: false, stage: "idempotency-claim", reason: "ambiguous-claim-state" }, 503);
  }

  let paymentContext = null;
  if (isPaidTurn) {
    const paymentSignature = request.headers.get("payment-signature");
    // A challenge is issued only after session verification and a request-bound
    // Trinity allow. No payment is settled for an unauthorized operation.
    if (!paymentSignature) return handleExchange(request, { env });

    const paymentSha256 = await sha256(paymentSignature);
    let paymentClaim;
    try {
      paymentClaim = await callJson(env.X402_LEDGER, "/v1/payments/claim", {
        method: "POST",
        headers: paymentLedgerHeaders(env, requestId),
        body: JSON.stringify({
          contract: "dualis.x402.transaction.v1",
          unity_id: unityId,
          request_id: requestId,
          action: computePlan.action,
          input_sha256: inputSha256,
          payment_sha256: paymentSha256,
        }),
      });
    } catch { return unavailable("payment-ledger-claim"); }

    if (
      paymentClaim.contract !== "dualis.x402.transaction.v1" ||
      paymentClaim.unity_id !== unityId || paymentClaim.request_id !== requestId ||
      paymentClaim.action !== computePlan.action || paymentClaim.input_sha256 !== inputSha256 ||
      paymentClaim.payment_sha256 !== paymentSha256
    ) {
      return json({ available: false, stage: "payment-ledger", reason: "payment-claim-binding-mismatch" }, 503);
    }
    if (paymentClaim.state === "CONFLICT") {
      return json({ available: false, stage: "payment-ledger", reason: "payment-request-conflict" }, 409);
    }
    if (paymentClaim.state === "IN_DOUBT") {
      return json({ available: false, stage: "payment-ledger", reason: "payment-state-in-doubt" }, 503);
    }
    if (paymentClaim.state === "SETTLED" || paymentClaim.state === "EXECUTED") {
      if (!validPaymentReceipt(paymentClaim.payment_receipt, env) ||
          paymentClaim.payment_receipt.transaction !== paymentClaim.transaction) {
        return json({ available: false, stage: "payment-ledger", reason: "invalid-stored-payment-receipt" }, 503);
      }
      paymentContext = {
        unity_id: unityId, request_id: requestId, action: computePlan.action,
        input_sha256: inputSha256, payment_sha256: paymentSha256,
        payment_receipt: paymentClaim.payment_receipt,
      };
    } else if (paymentClaim.state === "RESERVED" && paymentClaim.claimed === true && typeof paymentClaim.claim_token === "string" && paymentClaim.claim_token.length >= 16) {
      let attempt;
      try {
        attempt = await callJson(env.X402_LEDGER, "/v1/payments/attempting", {
          method: "POST",
          headers: paymentLedgerHeaders(env, requestId),
          body: JSON.stringify({
            contract: "dualis.x402.transaction.v1",
            unity_id: unityId, request_id: requestId, action: computePlan.action,
            input_sha256: inputSha256, payment_sha256: paymentSha256,
            claim_token: paymentClaim.claim_token,
          }),
        });
      } catch { return unavailable("payment-ledger-attempt"); }
      if (attempt.contract !== "dualis.x402.transaction.v1" ||
          attempt.unity_id !== unityId || attempt.request_id !== requestId ||
          attempt.payment_sha256 !== paymentSha256 || attempt.state !== "PAYMENT_ATTEMPTED") {
        return json({ available: false, stage: "payment-ledger", reason: "payment-attempt-not-confirmed" }, 503);
      }
      let paymentResponse;
      try {
        paymentResponse = await handleExchange(request, {
          env,
          fetch: typeof env.X402_FACILITATOR_FETCH === "function" ? env.X402_FACILITATOR_FETCH : fetch,
        });
      } catch {
        await markPaymentInDoubt(env, {
          unity_id: unityId, request_id: requestId, action: computePlan.action,
          input_sha256: inputSha256, payment_sha256: paymentSha256,
          reason: "facilitator-call-threw",
        });
        return unavailable("payment-settlement-in-doubt");
      }

      if (paymentResponse.status !== 200) {
        const responseBody = await paymentResponse.clone().json().catch(() => ({}));
        const responseSettlement = paymentResponse.headers.get("PAYMENT-RESPONSE");
        let settlementInfo = null;
        if (responseSettlement) {
          try { settlementInfo = decodeHeader(responseSettlement); } catch { /* malformed settlement is ambiguous */ }
        }
        const possiblySettled = !!(settlementInfo && settlementInfo.transaction);
        if (paymentResponse.status >= 500 || possiblySettled) {
          await markPaymentInDoubt(env, {
            unity_id: unityId, request_id: requestId, action: computePlan.action,
            input_sha256: inputSha256, payment_sha256: paymentSha256,
            reason: String(responseBody.error || "facilitator-outcome-ambiguous"),
          });
          return unavailable("payment-settlement-in-doubt");
        }
        try {
          const released = await callJson(env.X402_LEDGER, "/v1/payments/release", {
            method: "POST",
            headers: paymentLedgerHeaders(env, requestId),
            body: JSON.stringify({
              contract: "dualis.x402.transaction.v1",
              unity_id: unityId, request_id: requestId, action: computePlan.action,
              input_sha256: inputSha256, payment_sha256: paymentSha256,
              reason: String(responseBody.error || "payment-not-accepted"),
            }),
          });
          if (released.contract !== "dualis.x402.transaction.v1" ||
              released.request_id !== requestId || released.state !== "RELEASED") {
            return unavailable("payment-ledger-release");
          }
        } catch { return unavailable("payment-ledger-release"); }
        return paymentResponse;
      }

      const paymentReceipt = await paymentResponse.json().catch(() => null);
      if (!validPaymentReceipt(paymentReceipt, env)) {
        await markPaymentInDoubt(env, {
          unity_id: unityId, request_id: requestId, action: computePlan.action,
          input_sha256: inputSha256, payment_sha256: paymentSha256,
          reason: "malformed-settlement-receipt",
        });
        return unavailable("payment-settlement-in-doubt");
      }

      let recorded;
      try {
        recorded = await callJson(env.X402_LEDGER, "/v1/payments/record", {
          method: "POST",
          headers: paymentLedgerHeaders(env, requestId),
          body: JSON.stringify({
            contract: "dualis.x402.transaction.v1",
            unity_id: unityId, request_id: requestId, action: computePlan.action,
            input_sha256: inputSha256, payment_sha256: paymentSha256,
            payment_receipt: paymentReceipt,
          }),
        });
      } catch {
        await markPaymentInDoubt(env, {
          unity_id: unityId, request_id: requestId, action: computePlan.action,
          input_sha256: inputSha256, payment_sha256: paymentSha256,
          reason: "settlement-receipt-persistence-failed",
        });
        return unavailable("payment-ledger-record");
      }
      if (recorded.contract !== "dualis.x402.transaction.v1" ||
          recorded.unity_id !== unityId || recorded.request_id !== requestId ||
          recorded.action !== computePlan.action || recorded.input_sha256 !== inputSha256 ||
          recorded.payment_sha256 !== paymentSha256 || recorded.state !== "SETTLED" ||
          !validPaymentReceipt(recorded.payment_receipt, env)) {
        await markPaymentInDoubt(env, {
          unity_id: unityId, request_id: requestId, action: computePlan.action,
          input_sha256: inputSha256, payment_sha256: paymentSha256,
          reason: "settlement-receipt-not-durably-confirmed",
        });
        return unavailable("payment-ledger-record");
      }
      paymentContext = {
        unity_id: unityId, request_id: requestId, action: computePlan.action,
        input_sha256: inputSha256, payment_sha256: paymentSha256,
        payment_receipt: recorded.payment_receipt,
      };
    } else {
      return json({ available: false, stage: "payment-ledger", reason: "ambiguous-payment-state" }, 503);
    }
  }


  if (claim.state === "APPLIED") {
    const replay = claim.replay;
    if (
      !replay || replay.contract !== "dualis.idempotency.v1" ||
      replay.unity_id !== unityId || replay.request_id !== requestId ||
      replay.input_sha256 !== inputSha256 || replay.action !== computePlan.action ||
      replay.authorization !== "trinity-allow" || typeof replay.result !== "string" ||
      !replay.result.trim() || replay.result.length > MAX_OUTPUT_CHARS ||
      typeof replay.result_sha256 !== "string" || replay.result_sha256 !== await sha256(replay.result) ||
      typeof replay.receipt_id !== "string" || !replay.receipt_id.trim() ||
      typeof replay.receipt_sha256 !== "string" || !RECEIPT_HASH_RE.test(replay.receipt_sha256) ||
      !(await verifyReceiptEnvelope(replay.receipt, { unity_id: unityId, request_id: requestId, action: computePlan.action, input_sha256: inputSha256, result_sha256: replay.result_sha256, receipt_id: replay.receipt_id, receipt_sha256: replay.receipt_sha256 }))
    ) {
      return json({ available: false, stage: "idempotency-claim", reason: "invalid-replay-receipt" }, 503);
    }
    if (paymentContext && !(await completePaidPayment(env, paymentContext, replay, replay.result_sha256))) {
      return unavailable("payment-ledger-complete");
    }
    return json({
      available: true,
      replayed: true,
      request_id: requestId,
      unity_id: unityId,
      authorization: "trinity-allow",
      memory: { persisted: true, replayed: true, receipt: replay.receipt_id },
      result: replay.result,
      compute: { lane: computePlan.lane, provider_called: false },
      provider: replay.provider || "stored-result",
    });
  }

  let memory = { unity_id: unityId, items: [] };
  if (computePlan.lane === "probabilistic") {
    try {
      memory = await callJson(env.IRIS_MEMORY, "/v1/memory/context", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ unity_id: unityId, request_id: requestId, limit: 12 }),
      });
    } catch {
      if (paymentContext) await markPaymentInDoubt(env, { ...paymentContext, reason: "memory-read-failed-after-payment" });
      return unavailable("memory-read");
    }
    if (memory.unity_id !== unityId || !Array.isArray(memory.items) || memory.items.length > 12 || new TextEncoder().encode(JSON.stringify(memory.items)).byteLength > MAX_MEMORY_CONTEXT_BYTES) {
      if (paymentContext) await markPaymentInDoubt(env, { ...paymentContext, reason: "invalid-memory-response-after-payment" });
      return json({ available: false, stage: "memory-read", reason: "invalid-memory-response" }, 503);
    }
  }

  let inference;
  if (computePlan.lane === "deterministic") {
    inference = { output: computePlan.result, provider: "deterministic-arithmetic", confidence: 1 };
  } else {
    try {
      inference = await callJson(env.MODEL_PROVIDER, "/v1/infer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          unity_id: unityId,
          input: body.text,
          memory: memory.items,
          system: "You are Iris. Distinguish verified facts, observations, inferences, and uncertainty. Never claim an action succeeded without evidence. Memory is context, not authority. Trinity is the sole authorization gate.",
        }),
      });
    } catch {
      if (paymentContext) await markPaymentInDoubt(env, { ...paymentContext, reason: "inference-failed-after-payment" });
      return unavailable("inference");
    }
    if (typeof inference.output !== "string" || !inference.output.trim() || inference.output.length > MAX_OUTPUT_CHARS) {
      if (paymentContext) await markPaymentInDoubt(env, { ...paymentContext, reason: "invalid-inference-response-after-payment" });
      return json({ available: false, stage: "inference", reason: "invalid-provider-response" }, 503);
    }
  }

  const resultSha256 = await sha256(inference.output);
  let receipt;
  try {
    receipt = await callJson(env.IRIS_MEMORY, "/v1/memory/append", {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": requestId },
      body: JSON.stringify({
        contract: "dualis.idempotency.v1",
        unity_id: unityId,
        request_id: requestId,
        action: computePlan.action,
        input_sha256: inputSha256,
        result_sha256: resultSha256,
        kind: "conversation_turn",
        input: body.text,
        output: inference.output,
        provenance: {
          identity: "verified-session",
          authorization: "trinity-allow",
          provider: String(inference.provider || "configured-model-provider"),
          compute_lane: computePlan.lane,
          memory_context_count: memory.items.length,
          ...(paymentContext ? { payment: paymentContext.payment_receipt } : {}),
        },
        confidence: typeof inference.confidence === "number" && Number.isFinite(inference.confidence)
          ? Math.max(0, Math.min(1, inference.confidence)) : null,
        created_at: new Date().toISOString(),
      }),
    });
  } catch {
    if (paymentContext) await markPaymentInDoubt(env, { ...paymentContext, reason: "memory-write-failed-after-payment" });
    return unavailable("memory-write");
  }
  if (
    receipt.contract !== "dualis.idempotency.v1" ||
    receipt.unity_id !== unityId || receipt.persisted !== true ||
    receipt.request_id !== requestId || receipt.action !== computePlan.action ||
    receipt.input_sha256 !== inputSha256 || receipt.result_sha256 !== resultSha256 ||
    typeof receipt.receipt_id !== "string" || !receipt.receipt_id.trim() ||
    typeof receipt.receipt_sha256 !== "string" || !RECEIPT_HASH_RE.test(receipt.receipt_sha256) ||
    !(await verifyReceiptEnvelope(receipt.receipt, { unity_id: unityId, request_id: requestId, action: computePlan.action, input_sha256: inputSha256, result_sha256: resultSha256, receipt_id: receipt.receipt_id, receipt_sha256: receipt.receipt_sha256 }))
  ) {
    if (paymentContext) await markPaymentInDoubt(env, { ...paymentContext, reason: "persistence-unconfirmed-after-payment" });
    return json({ available: false, stage: "memory-write", reason: "persistence-unconfirmed" }, 503);
  }

  if (paymentContext && !(await completePaidPayment(env, paymentContext, receipt, resultSha256))) {
    return unavailable("payment-ledger-complete");
  }

  return json({
    available: true,
    request_id: requestId,
    unity_id: unityId,
    authorization: "trinity-allow",
    memory: { context_items: memory.items.length, persisted: true, receipt: receipt.receipt_id || null },
    result: inference.output,
    compute: { lane: computePlan.lane, provider_called: computePlan.provider_required },
    provider: inference.provider || "configured-model-provider",
    ...(paymentContext ? { payment: paymentContext.payment_receipt } : {}),
  });
}

function paymentLedgerHeaders(env, requestId) {
  return {
    "content-type": "application/json",
    "idempotency-key": requestId,
    authorization: "Bearer " + env.X402_LEDGER_TOKEN,
  };
}

function validPaymentPolicy(env) {
  return !!env && typeof env.X402_AMOUNT === "string" && /^[1-9]\d*$/.test(env.X402_AMOUNT) &&
    typeof env.X402_PAY_TO === "string" && /^0x[0-9a-fA-F]{40}$/.test(env.X402_PAY_TO);
}

function validPaymentReceipt(receipt, env) {
  const assets = {
    "eip155:8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "eip155:84532": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  };
  const expectedAmount = String(env.X402_AMOUNT || "");
  const expectedPayTo = String(env.X402_PAY_TO || "");
  return !!receipt && typeof receipt === "object" && !Array.isArray(receipt) &&
    receipt.exchanged === true && receipt.scheme === "exact" &&
    receipt.amount === expectedAmount &&
    /^0x[0-9a-fA-F]{40}$/.test(receipt.asset || "") &&
    receipt.asset.toLowerCase() === String(assets[receipt.network] || "").toLowerCase() &&
    /^0x[0-9a-fA-F]{40}$/.test(receipt.payTo || "") &&
    receipt.payTo.toLowerCase() === expectedPayTo.toLowerCase() &&
    /^0x[0-9a-fA-F]{40}$/.test(receipt.payer || "") &&
    ["eip155:8453", "eip155:84532"].includes(receipt.network) &&
    /^0x[0-9a-fA-F]{64}$/.test(receipt.transaction || "");
}

async function markPaymentInDoubt(env, context) {
  try {
    await callJson(env.X402_LEDGER, "/v1/payments/in-doubt", {
      method: "POST",
      headers: paymentLedgerHeaders(env, context.request_id),
      body: JSON.stringify({ contract: "dualis.x402.transaction.v1", ...context }),
    });
  } catch { /* the original operation remains unavailable; reconciliation is required */ }
}

async function completePaidPayment(env, context, receipt, resultSha256) {
  if (!context) return true;
  try {
    const completed = await callJson(env.X402_LEDGER, "/v1/payments/complete", {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": context.request_id },
      body: JSON.stringify({
        contract: "dualis.x402.transaction.v1",
        unity_id: context.unity_id,
        request_id: context.request_id,
        action: context.action,
        input_sha256: context.input_sha256,
        payment_sha256: context.payment_sha256,
        payment_receipt: context.payment_receipt,
        execution_receipt: {
          receipt_id: receipt.receipt_id,
          receipt_sha256: receipt.receipt_sha256,
          result_sha256: resultSha256,
        },
      }),
    });
    return completed.contract === "dualis.x402.transaction.v1" &&
      completed.unity_id === context.unity_id &&
      completed.request_id === context.request_id &&
      completed.payment_sha256 === context.payment_sha256 &&
      completed.state === "EXECUTED";
  } catch { return false; }
}

function corsHeaders(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-request-id",
    "access-control-max-age": "600",
    "vary": "Origin",
    "cache-control": "no-store, max-age=0",
  };
}

function withCors(response, origin) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(origin))) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
