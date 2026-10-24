/**
 * Iris Memory staging service.
 *
 * Durable Object storage is the source of truth for idempotent request claims
 * and receipts. One named DO instance serializes claims for this staging lane.
 * Protect this service with IRIS_MEMORY_SERVICE_TOKEN; do not expose it publicly.
 */
const RECEIPT_CONTRACT = "dualis.receipt.v1";
const MAX_BODY_BYTES = 65536;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function validReceipt(receipt, requestId, digest) {
  return !!(
    receipt &&
    receipt.contract === RECEIPT_CONTRACT &&
    receipt.request_id === requestId &&
    receipt.id === "rct_" + requestId &&
    typeof receipt.sha256 === "string" &&
    /^[0-9a-f]{64}$/.test(receipt.sha256) &&
    receipt.sha256 === digest
  );
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return json(405, { ok: false, reason: "method-not-allowed" });
    if (!env.IRIS_MEMORY_SERVICE_TOKEN) return json(503, { ok: false, reason: "service-token-unavailable" });
    const auth = request.headers.get("authorization") || "";
    if (auth !== "Bearer " + env.IRIS_MEMORY_SERVICE_TOKEN) {
      return json(401, { ok: false, reason: "service-auth-required" });
    }
    const url = new URL(request.url);
    if (url.pathname !== "/v1/requests/claim" && url.pathname !== "/v1/requests/get") {
      return json(404, { ok: false, reason: "not-found" });
    }
    let body;
    try { body = await request.json(); } catch { return json(400, { ok: false, reason: "invalid-json" }); }
    if (new TextEncoder().encode(JSON.stringify(body)).byteLength > MAX_BODY_BYTES) {
      return json(413, { ok: false, reason: "body-too-large" });
    }
    const id = env.IRIS_MEMORY_STORE.idFromName("iris-memory-staging-global");
    return env.IRIS_MEMORY_STORE.get(id).fetch("https://memory-do" + url.pathname, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  },
};

export class IrisMemoryStore {
  constructor(state) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {});
  }

  async fetch(request) {
    if (request.method !== "POST") return json(405, { ok: false, reason: "method-not-allowed" });
    const path = new URL(request.url).pathname;
    let body;
    try { body = await request.json(); } catch { return json(400, { ok: false, reason: "invalid-json" }); }
    const requestId = body && body.request_id;
    if (typeof requestId !== "string" || !requestId || requestId.length > 240) {
      return json(400, { ok: false, reason: "invalid-request-id" });
    }
    const key = "request:" + requestId;

    if (path === "/v1/requests/get") {
      const record = await this.state.storage.get(key);
      return json(200, record
        ? { ok: true, found: true, receipt: record.receipt, request_id: requestId, action: record.action, principal: record.principal, input_sha256: record.input_sha256 }
        : { ok: true, found: false, request_id: requestId });
    }

    if (path !== "/v1/requests/claim") return json(404, { ok: false, reason: "not-found" });
    const principal = body.principal;
    const action = body.action;
    const digest = body.input_sha256;
    const receipt = body.receipt;
    if (typeof principal !== "string" || !principal || typeof action !== "string" || !action ||
        typeof digest !== "string" || !/^[0-9a-f]{64}$/.test(digest) ||
        !validReceipt(receipt, requestId, digest)) {
      return json(400, { ok: false, reason: "invalid-claim" });
    }

    const outcome = await this.state.storage.transaction(async (txn) => {
      const prior = await txn.get(key);
      if (prior) {
        if (prior.principal === principal && prior.action === action && prior.input_sha256 === digest) {
          return { kind: "replay", receipt: prior.receipt };
        }
        return { kind: "conflict" };
      }
      const record = {
        request_id: requestId,
        principal,
        action,
        input_sha256: digest,
        receipt,
        claimed_at: new Date().toISOString(),
      };
      await txn.put(key, record);
      return { kind: "claimed", receipt };
    });

    if (outcome.kind === "conflict") {
      return json(409, { ok: false, reason: "duplicate-request", request_id: requestId });
    }
    if (outcome.kind === "replay") {
      return json(200, { ok: true, replay: true, receipt: outcome.receipt });
    }
    return json(200, { ok: true, claimed: true, receipt: outcome.receipt });
  }
}
