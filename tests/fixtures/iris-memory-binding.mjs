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
        records.set(body.request_id, { input_sha256: body.input_sha256, receipt: body.receipt });
        return new Response(JSON.stringify({ ok: true, claimed: true, receipt: body.receipt }), { status: 200 });
      }
      if (path === "/v1/requests/get") {
        const record = records.get(body.request_id);
        return new Response(JSON.stringify(record
          ? { ok: true, found: true, receipt: record.receipt }
          : { ok: true, found: false }), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  };
}
