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

function validReceipt(receipt, requestId, digest, principal, action) {
  return !!(
    receipt &&
    receipt.contract === RECEIPT_CONTRACT &&
    receipt.request_id === requestId &&
    receipt.unity_id === principal &&
    receipt.id === "rct_" + requestId &&
    typeof receipt.sha256 === "string" &&
    /^[0-9a-f]{64}$/.test(receipt.sha256) &&
    receipt.sha256 === digest &&
    typeof receipt.action === "string" &&
    receipt.action === action &&
    receipt.action === receipt.action.trim() &&
    typeof receipt.issued_at === "string" &&
    Number.isFinite(Date.parse(receipt.issued_at))
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
    if (!["/v1/requests/claim", "/v1/requests/get", "/v1/context/read", "/v1/requests/revoke", "/v1/inference/begin", "/v1/inference/complete", "/v1/inference/unknown"].includes(url.pathname)) {
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
    const revokeId = path === "/v1/requests/revoke" && body && (body.id || body.request_id);
    const requestId = path === "/v1/requests/revoke" && typeof revokeId === "string"
      ? (revokeId.startsWith("rct_") ? revokeId.slice(4) : revokeId)
      : body && body.request_id;
    if (typeof requestId !== "string" || !requestId || requestId.length > 240) {
      return json(400, { ok: false, reason: "invalid-request-id" });
    }
    const key = "request:" + requestId;

    if (path.startsWith("/v1/inference/")) {
      const principal = body && body.principal;
      const digest = body && body.input_sha256;
      if (typeof principal !== "string" || !principal ||
          typeof digest !== "string" || !/^[0-9a-f]{64}$/.test(digest)) {
        return json(400, { ok: false, reason: "invalid-inference-claim" });
      }
      const inferenceKey = "inference:" + requestId;
      const outcome = await this.state.storage.transaction(async (txn) => {
        const requestRecord = await txn.get(key);
        if (!requestRecord || requestRecord.revoked === true ||
            requestRecord.principal !== principal || requestRecord.input_sha256 !== digest) {
          return { kind: "receipt-mismatch" };
        }
        const current = await txn.get(inferenceKey);
        if (path === "/v1/inference/begin") {
          if (!current) {
            const record = {
              request_id: requestId, principal, input_sha256: digest,
              state: "RUNNING", started_at: new Date().toISOString(), attempt_count: 1,
            };
            await txn.put(inferenceKey, record);
            return { kind: "started", record };
          }
          if (current.principal !== principal || current.input_sha256 !== digest) return { kind: "conflict" };
          if (current.state === "SUCCEEDED") return { kind: "succeeded", record: current };
          if (current.state === "UNKNOWN") return { kind: "unknown", record: current };
          return { kind: "already-running", record: current };
        }
        if (!current || current.principal !== principal || current.input_sha256 !== digest) return { kind: "not-started" };
        if (path === "/v1/inference/complete") {
          if (current.state === "SUCCEEDED") return { kind: "succeeded", record: current };
          if (current.state !== "RUNNING") return { kind: "terminal", record: current };
          const encoded = JSON.stringify(body.output);
          if (typeof encoded !== "string" || new TextEncoder().encode(encoded).byteLength > MAX_BODY_BYTES) return { kind: "invalid-output" };
          const record = { ...current, state: "SUCCEEDED", output: body.output, completed_at: new Date().toISOString() };
          await txn.put(inferenceKey, record);
          return { kind: "succeeded", record };
        }
        if (current.state === "SUCCEEDED") return { kind: "succeeded", record: current };
        if (current.state === "UNKNOWN") return { kind: "unknown", record: current };
        const record = { ...current, state: "UNKNOWN", unknown_at: new Date().toISOString(), reason: "provider-outcome-ambiguous" };
        await txn.put(inferenceKey, record);
        return { kind: "unknown", record };
      });
      if (outcome.kind === "receipt-mismatch") return json(403, { ok: false, reason: "receipt-mismatch" });
      if (outcome.kind === "conflict") return json(409, { ok: false, reason: "inference-conflict" });
      if (outcome.kind === "not-started") return json(409, { ok: false, reason: "inference-not-started" });
      if (outcome.kind === "invalid-output") return json(413, { ok: false, reason: "output-too-large" });
      if (outcome.kind === "terminal") return json(409, { ok: false, reason: "inference-terminal", state: outcome.record.state });
      if (outcome.kind === "already-running") return json(409, { ok: false, reason: "inference-already-running", state: "RUNNING" });
      if (outcome.kind === "unknown") return json(409, { ok: false, reason: "inference-outcome-unknown", state: "UNKNOWN" });
      if (outcome.kind === "succeeded") return json(200, { ok: true, state: "SUCCEEDED", replay: path === "/v1/inference/begin" || outcome.record.completed_at !== undefined, output: outcome.record.output });
      return json(200, { ok: true, state: "RUNNING", claimed: true, attempt_count: 1 });
    }

    if (path === "/v1/requests/get") {
      const record = await this.state.storage.get(key);
      return json(200, record
        ? { ok: true, found: true, receipt: record.receipt, revoked: record.revoked === true, request_id: requestId, action: record.action, principal: record.principal, input_sha256: record.input_sha256 }
        : { ok: true, found: false, request_id: requestId });
    }

    if (path === "/v1/requests/revoke") {
      const outcome = await this.state.storage.transaction(async (txn) => {
        const record = await txn.get(key);
        if (!record) return { kind: "missing" };
        if (record.revoked === true) return { kind: "replay", receipt_id: record.receipt.id };
        await txn.put(key, { ...record, revoked: true });
        return { kind: "revoked", receipt_id: record.receipt.id };
      });
      if (outcome.kind === "missing") return json(404, { ok: false, reason: "not-issued" });
      return json(200, { ok: true, revoked: true, replay: outcome.kind === "replay", id: outcome.receipt_id, request_id: requestId });
    }

    if (path === "/v1/context/read") {
      const principal = body && body.principal;
      if (typeof principal !== "string" || !principal) return json(400, { ok: false, reason: "invalid-principal" });
      const requested = Number(body.limit);
      const limit = Number.isInteger(requested) ? Math.min(10, Math.max(1, requested)) : 5;
      const requestIds = await this.state.storage.get("principal:" + principal) || [];
      const records = await Promise.all(requestIds.filter((id) => id !== requestId).map((id) => this.state.storage.get("request:" + id)));
      const items = records
        .filter((record) => record && record.principal === principal)
        .sort((a, b) => String(b.claimed_at).localeCompare(String(a.claimed_at)))
        .slice(0, limit)
        .map((record) => ({ request_id: record.request_id, action: record.action, input_sha256: record.input_sha256, receipt_id: record.receipt.id, claimed_at: record.claimed_at }));
      return json(200, { ok: true, principal, count: items.length, items });
    }

    if (path !== "/v1/requests/claim") return json(404, { ok: false, reason: "not-found" });
    const principal = body.principal;
    const action = body.action;
    const digest = body.input_sha256;
    const receipt = body.receipt;
    if (typeof principal !== "string" || !principal || typeof action !== "string" || !action ||
        typeof digest !== "string" || !/^[0-9a-f]{64}$/.test(digest) ||
        !validReceipt(receipt, requestId, digest, principal, action)) {
      return json(400, { ok: false, reason: "invalid-claim" });
    }

    const outcome = await this.state.storage.transaction(async (txn) => {
      const prior = await txn.get(key);
      if (prior) {
        if (prior.principal === principal && prior.action === action && prior.input_sha256 === digest) {
          return { kind: "replay", receipt: prior.receipt, revoked: prior.revoked === true };
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
      const principalKey = "principal:" + principal;
      const previousIds = await txn.get(principalKey) || [];
      const nextIds = [requestId, ...previousIds.filter((id) => id !== requestId)].slice(0, 100);
      await txn.put(principalKey, nextIds);
      return { kind: "claimed", receipt };
    });

    if (outcome.kind === "conflict") {
      return json(409, { ok: false, reason: "duplicate-request", request_id: requestId });
    }
    if (outcome.kind === "replay") {
      return json(200, { ok: true, replay: true, revoked: outcome.revoked === true, receipt: outcome.receipt });
    }
    return json(200, { ok: true, claimed: true, receipt: outcome.receipt });
  }
}
