const CONTRACT = "dualis.x402.transaction.v1";
const MAX_BODY_BYTES = 16 * 1024;
const REQUEST_ID_RE = /^[A-Za-z0-9._:-]{8,128}$/;
const UNITY_ID_RE = /^[A-Za-z0-9_-]{8,128}$/;
const DIGEST_RE = /^[a-f0-9]{64}$/;
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const TX_RE = /^0x[0-9a-fA-F]{64}$/;

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: {
    "cache-control": "no-store, max-age=0",
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'",
  },
});

function operationOf(body) {
  return {
    contract: body.contract,
    unity_id: body.unity_id,
    request_id: body.request_id,
    action: body.action,
    input_sha256: body.input_sha256,
  };
}

function validOperation(body) {
  return !!body && body.contract === CONTRACT &&
    typeof body.unity_id === "string" && UNITY_ID_RE.test(body.unity_id) &&
    typeof body.request_id === "string" && REQUEST_ID_RE.test(body.request_id) &&
    typeof body.action === "string" && /^[a-z][a-z0-9._:-]{1,127}$/.test(body.action) &&
    typeof body.input_sha256 === "string" && DIGEST_RE.test(body.input_sha256) &&
    typeof body.payment_sha256 === "string" && DIGEST_RE.test(body.payment_sha256);
}

function validPaymentPolicy(env) {
  return !!env && typeof env.X402_AMOUNT === "string" && /^[1-9]\d*$/.test(env.X402_AMOUNT) &&
    typeof env.X402_PAY_TO === "string" && ADDRESS_RE.test(env.X402_PAY_TO);
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
    ADDRESS_RE.test(receipt.asset || "") &&
    receipt.asset.toLowerCase() === String(assets[receipt.network] || "").toLowerCase() &&
    ADDRESS_RE.test(receipt.payTo || "") &&
    receipt.payTo.toLowerCase() === expectedPayTo.toLowerCase() &&
    ADDRESS_RE.test(receipt.payer || "") &&
    ["eip155:8453", "eip155:84532"].includes(receipt.network) &&
    TX_RE.test(receipt.transaction || "");
}

function baseReply(body, state, extra = {}) {
  return {
    contract: CONTRACT,
    unity_id: body.unity_id,
    request_id: body.request_id,
    action: body.action,
    input_sha256: body.input_sha256,
    payment_sha256: body.payment_sha256,
    state,
    ...extra,
  };
}

export class PaymentTransaction {
  constructor(state, env = {}) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    if (request.method !== "POST") return json({ error: "method-not-allowed" }, 405);
    const path = new URL(request.url).pathname;
    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) return json({ error: "body-too-large" }, 413);
    let body;
    try { body = JSON.parse(bodyText); } catch { return json({ error: "invalid-json" }, 400); }
    if (!validOperation(body)) return json({ error: "invalid-operation-binding" }, 400);
    if (path !== "/v1/payments/claim" && path !== "/v1/payments/attempting" &&
        path !== "/v1/payments/record" && path !== "/v1/payments/release" &&
        path !== "/v1/payments/in-doubt" && path !== "/v1/payments/complete") {
      return json({ error: "not-found" }, 404);
    }

    const outcome = await this.state.storage.transaction(async (txn) => {
      const key = "transaction";
      const current = await txn.get(key);
      const operation = operationOf(body);
      const now = Date.now();

      if (path.endsWith("/claim")) {
        if (!current) {
          const claimToken = crypto.randomUUID();
          const record = {
            operation, payment_sha256: body.payment_sha256, state: "RESERVED",
            claim_token: claimToken, lease_until: now + 30_000, created_at: now, updated_at: now,
          };
          await txn.put(key, record);
          return baseReply(body, "RESERVED", { claimed: true, claim_token: claimToken });
        }
        if (JSON.stringify(current.operation) !== JSON.stringify(operation)) {
          return baseReply(body, "CONFLICT");
        }
        if (current.state === "PAYMENT_ATTEMPTED" || current.state === "IN_DOUBT") {
          return baseReply(body, "IN_DOUBT");
        }
        if (current.state === "RELEASED" ||
            (current.state === "RESERVED" && current.lease_until <= now)) {
          const claimToken = crypto.randomUUID();
          const record = {
            ...current, payment_sha256: body.payment_sha256, state: "RESERVED",
            claim_token: claimToken, lease_until: now + 30_000, updated_at: now,
          };
          delete record.payment_receipt;
          delete record.execution_receipt;
          delete record.transaction;
          await txn.put(key, record);
          return baseReply(body, "RESERVED", { claimed: true, claim_token: claimToken });
        }
        if (current.payment_sha256 !== body.payment_sha256) return baseReply(body, "CONFLICT");
        if (current.state === "RESERVED") return baseReply(body, "RESERVED", { claimed: false });
        if (current.state === "SETTLED" || current.state === "EXECUTED") {
          return baseReply(body, current.state, {
            payment_receipt: current.payment_receipt,
            transaction: current.transaction,
            ...(current.execution_receipt ? { execution_receipt: current.execution_receipt } : {}),
          });
        }
        return baseReply(body, "IN_DOUBT");
      }

      if (!current || JSON.stringify(current.operation) !== JSON.stringify(operation) ||
          current.payment_sha256 !== body.payment_sha256) {
        return baseReply(body, "CONFLICT");
      }

      if (path.endsWith("/attempting")) {
        if (current.state !== "RESERVED" || typeof body.claim_token !== "string" ||
            body.claim_token !== current.claim_token || current.lease_until <= now) {
          return baseReply(body, current.state === "PAYMENT_ATTEMPTED" ? "IN_DOUBT" : "CONFLICT");
        }
        const record = { ...current, state: "PAYMENT_ATTEMPTED", updated_at: now };
        delete record.claim_token;
        delete record.lease_until;
        await txn.put(key, record);
        return baseReply(body, "PAYMENT_ATTEMPTED");
      }

      if (path.endsWith("/record")) {
        if (!validPaymentReceipt(body.payment_receipt, this.env)) return baseReply(body, "CONFLICT", { reason: "invalid-payment-receipt" });
        if (current.state === "SETTLED" || current.state === "EXECUTED") {
          return current.payment_receipt.transaction === body.payment_receipt.transaction
            ? baseReply(body, current.state, { payment_receipt: current.payment_receipt, transaction: current.transaction })
            : baseReply(body, "CONFLICT");
        }
        if (current.state !== "PAYMENT_ATTEMPTED") return baseReply(body, current.state === "IN_DOUBT" ? "IN_DOUBT" : "CONFLICT");
        const record = {
          ...current, state: "SETTLED", payment_receipt: body.payment_receipt,
          transaction: body.payment_receipt.transaction, updated_at: now,
        };
        await txn.put(key, record);
        return baseReply(body, "SETTLED", { payment_receipt: record.payment_receipt, transaction: record.transaction });
      }

      if (path.endsWith("/release")) {
        if (current.state === "RELEASED") return baseReply(body, "RELEASED");
        if (current.state !== "PAYMENT_ATTEMPTED") return baseReply(body, current.state === "IN_DOUBT" ? "IN_DOUBT" : "CONFLICT");
        const record = { ...current, state: "RELEASED", updated_at: now, release_reason: String(body.reason || "payment-not-accepted").slice(0, 160) };
        delete record.payment_receipt;
        delete record.transaction;
        await txn.put(key, record);
        return baseReply(body, "RELEASED");
      }

      if (path.endsWith("/in-doubt")) {
        if (current.state === "EXECUTED") return baseReply(body, "EXECUTED");
        const record = { ...current, state: "IN_DOUBT", updated_at: now, doubt_reason: String(body.reason || "unresolved").slice(0, 160) };
        await txn.put(key, record);
        return baseReply(body, "IN_DOUBT");
      }

      if (path.endsWith("/complete")) {
        const execution = body.execution_receipt;
        if (!execution || typeof execution.receipt_id !== "string" || !execution.receipt_id ||
            !DIGEST_RE.test(execution.receipt_sha256 || "") || !DIGEST_RE.test(execution.result_sha256 || "")) {
          return baseReply(body, "CONFLICT", { reason: "invalid-execution-receipt" });
        }
        if (current.state === "EXECUTED") {
          const same = current.execution_receipt.receipt_id === execution.receipt_id &&
            current.execution_receipt.receipt_sha256 === execution.receipt_sha256 &&
            current.execution_receipt.result_sha256 === execution.result_sha256;
          return same ? baseReply(body, "EXECUTED", { transaction: current.transaction }) : baseReply(body, "CONFLICT");
        }
        if (current.state !== "SETTLED") return baseReply(body, current.state === "IN_DOUBT" ? "IN_DOUBT" : "CONFLICT");
        const record = { ...current, state: "EXECUTED", execution_receipt: execution, updated_at: now };
        await txn.put(key, record);
        return baseReply(body, "EXECUTED", { transaction: current.transaction });
      }

      return baseReply(body, "CONFLICT");
    });
    return json(outcome);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ service: "dualis-x402-ledger", available: !!env.TRANSACTIONS && typeof env.LEDGER_TOKEN === "string" && env.LEDGER_TOKEN.length >= 32 && validPaymentPolicy(env) });
    }
    if (!env.TRANSACTIONS || typeof env.LEDGER_TOKEN !== "string" || env.LEDGER_TOKEN.length < 32 || !validPaymentPolicy(env)) {
      return json({ available: false, reason: "ledger-not-configured" }, 503);
    }
    if (request.headers.get("authorization") !== "Bearer " + env.LEDGER_TOKEN) {
      return json({ available: false, reason: "unauthorized" }, 401);
    }
    if (request.method !== "POST") return json({ error: "method-not-allowed" }, 405);
    const rawLength = request.headers.get("content-length");
    if (rawLength !== null && (!/^\d+$/.test(rawLength) || Number(rawLength) > MAX_BODY_BYTES)) {
      return json({ error: "body-too-large" }, 413);
    }
    let body;
    try { body = await request.clone().json(); } catch { return json({ error: "invalid-json" }, 400); }
    if (!validOperation(body)) return json({ error: "invalid-operation-binding" }, 400);
    const id = env.TRANSACTIONS.idFromName(body.unity_id + ":" + body.request_id);
    const stub = env.TRANSACTIONS.get(id);
    return stub.fetch(new Request("https://ledger.internal" + url.pathname, request));
  },
};
