/**
 * Deterministic in-memory adapter for the staging IRIS_MEMORY contract.
 * Test fixture only; this does not claim cross-isolate durability.
 */
export function memoryBinding() {
  const records = new Map();
  return {
    fetch: async (input, init = {}) => {
      const path = new URL(input).pathname;
      let body = {};
      try { body = JSON.parse(init.body || "{}"); } catch {}
      if (path === "/v1/requests/claim") {
        const prior = records.get(body.request_id);
        if (prior) {
          if (prior.input_sha256 !== body.input_sha256) {
            return new Response(JSON.stringify({ ok: false, reason: "duplicate-request" }), { status: 409 });
          }
          return new Response(JSON.stringify({ ok: true, replay: true, receipt: prior.receipt }), { status: 200 });
        }
        if (!body.request_id || !body.input_sha256 || !body.receipt) {
          return new Response(JSON.stringify({ ok: false, reason: "invalid-claim" }), { status: 400 });
        }
        records.set(body.request_id, { input_sha256: body.input_sha256, receipt: body.receipt, principal: body.principal, action: body.action, claimed_at: new Date().toISOString(), request_id: body.request_id });
        return new Response(JSON.stringify({ ok: true, claimed: true, receipt: body.receipt }), { status: 200 });
      }
      if (path === "/v1/requests/revoke") {
        const id = body.id || body.request_id;
        for (const record of records.values()) {
          if (record.receipt.id === id || record.request_id === id) {
            record.receipt = { ...record.receipt, revoked: true };
            return new Response(JSON.stringify({ ok: true, id: record.receipt.id, request_id: record.request_id }), { status: 200 });
          }
        }
        return new Response(JSON.stringify({ ok: false, reason: "not-issued" }), { status: 404 });
      }
      if (path === "/v1/requests/get") {
        const record = records.get(body.request_id);
        return new Response(JSON.stringify(record
          ? { ok: true, found: true, receipt: record.receipt }
          : { ok: true, found: false }), { status: 200 });
      }
      if (path === "/v1/context/read") {
        const items = Array.from(records.values()).filter((record) => record.principal === body.principal && record.request_id !== body.request_id).sort((a, b) => String(b.claimed_at).localeCompare(String(a.claimed_at))).slice(0, Math.min(10, Math.max(1, Number(body.limit) || 5))).map((record) => ({ request_id: record.request_id, action: record.action, input_sha256: record.input_sha256, receipt_id: record.receipt.id, claimed_at: record.claimed_at }));
        return new Response(JSON.stringify({ ok: true, principal: body.principal, count: items.length, items }), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  };
}
