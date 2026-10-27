/**
 * Canonical Fuel ledger — staging-first, private service.
 * Runtime routes require FUEL_LEDGER_SERVICE_TOKEN; grants additionally require FUEL_LEDGER_GRANT_TOKEN. Never expose to browsers.
 * Balance is derived from append-only entries; never trust client-supplied balances.
 */
const MAX_BODY_BYTES = 16384;
const TYPES = new Set(["grant", "reserve", "charge", "release", "adjustment", "refund_reversal"]);
const RAILS = new Set(["stripe", "crypto", "operator", "runtime"]);

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
function validId(value, max = 200) {
  return typeof value === "string" && value.length > 0 && value.length <= max && /^[A-Za-z0-9._:-]+$/.test(value);
}
function db(env) { return env && env.DB; }
function unitsOk(value) { return Number.isSafeInteger(value) && value > 0 && value <= 100000000; }
async function balance(database, principal) {
  const row = await database.prepare(
    "SELECT COALESCE(SUM(units_delta), 0) AS units FROM fuel_ledger_entries WHERE principal_id = ?1"
  ).bind(principal).first();
  return Number(row && row.units || 0);
}
function result(status, reason, extra = {}) { return json(status, { ok: status >= 200 && status < 300, ...(reason ? { reason } : {}), ...extra }); }

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return result(405, "method-not-allowed");
    if (!env.FUEL_LEDGER_SERVICE_TOKEN) return result(503, "service-token-unavailable");
    if (request.headers.get("authorization") !== "Bearer " + env.FUEL_LEDGER_SERVICE_TOKEN) return result(401, "service-auth-required");
    const database = db(env);
    if (!database || typeof database.prepare !== "function" || typeof database.batch !== "function") return result(503, "d1-unavailable");
    let body;
    try { body = await request.json(); } catch { return result(400, "invalid-json"); }
    if (new TextEncoder().encode(JSON.stringify(body)).byteLength > MAX_BODY_BYTES) return result(413, "body-too-large");
    const path = new URL(request.url).pathname;

    try {
      if (path === "/v1/ledger/health") {
        await database.prepare("SELECT 1 AS ok").first();
        return result(200, null, { service: "fuel-ledger", storage: "d1", writes_enabled: true });
      }

      if (path === "/v1/ledger/balance") {
        if (!validId(body.principal_id)) return result(400, "invalid-principal");
        return result(200, null, { principal_id: body.principal_id, units: await balance(database, body.principal_id) });
      }

      if (path === "/v1/ledger/grant") {
        if (!env.FUEL_LEDGER_GRANT_TOKEN || request.headers.get("x-ledger-grant-token") !== env.FUEL_LEDGER_GRANT_TOKEN) return result(401, "settlement-adapter-auth-required");
        if (!validId(body.principal_id) || !validId(body.idempotency_key) || !unitsOk(body.units) ||
            !RAILS.has(body.source_rail) || !validId(body.source_ref) || !validId(body.settlement_ref)) {
          return result(400, "invalid-grant");
        }
        // The caller must be a private settlement adapter, not a browser. This Worker
        // does not independently verify Stripe/crypto settlement; adapters must do so.
        const entryId = "fle_" + body.idempotency_key;
        const insert = database.prepare(
          "INSERT INTO fuel_ledger_entries (entry_id, principal_id, entry_type, units_delta, idempotency_key, source_rail, source_ref, sku, currency, amount_minor, pricing_version, metadata_json, created_at) " +
          "VALUES (?1, ?2, 'grant', ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12) ON CONFLICT(idempotency_key) DO NOTHING"
        ).bind(entryId, body.principal_id, body.units, body.idempotency_key, body.source_rail, body.settlement_ref,
          typeof body.sku === "string" ? body.sku : null, typeof body.currency === "string" ? body.currency : null,
          Number.isSafeInteger(body.amount_minor) && body.amount_minor >= 0 ? body.amount_minor : null,
          typeof body.pricing_version === "string" ? body.pricing_version : null,
          JSON.stringify({ settlement_ref: body.settlement_ref, adapter_source_ref: body.source_ref }), Date.now());
        const inserted = await insert.run();
        const existing = await database.prepare("SELECT * FROM fuel_ledger_entries WHERE idempotency_key = ?1").bind(body.idempotency_key).first();
        if (!existing || existing.principal_id !== body.principal_id || existing.entry_type !== "grant" ||
            existing.units_delta !== body.units || existing.source_ref !== body.settlement_ref) {
          return result(409, "idempotency-conflict");
        }
        return result(200, null, { granted: true, replay: !(inserted && inserted.meta && inserted.meta.changes === 1), entry_id: existing.entry_id,
          principal_id: body.principal_id, balance_units: await balance(database, body.principal_id) });
      }

      if (path === "/v1/ledger/reserve") {
        if (!validId(body.principal_id) || !validId(body.request_id) || !validId(body.idempotency_key) ||
            !unitsOk(body.units) || !validId(body.action) || typeof body.input_sha256 !== "string" ||
            !/^[0-9a-f]{64}$/.test(body.input_sha256) || !validId(body.trinity_receipt_id)) {
          return result(400, "invalid-reservation");
        }
        const reservationId = "res_" + body.idempotency_key;
        // One conditional INSERT makes the balance check and debit a single SQLite write
        // statement. SQLite/D1 serializes writers; concurrent reservations cannot both
        // spend the same balance. Verify any idempotency collision before treating as replay.
        await database.prepare(
          "INSERT INTO fuel_ledger_entries (entry_id, principal_id, entry_type, units_delta, idempotency_key, request_id, reservation_id, source_rail, source_ref, metadata_json, created_at) " +
          "SELECT ?1, ?2, 'reserve', -?3, ?4, ?5, ?6, 'runtime', ?7, ?8, ?9 " +
          "WHERE (SELECT COALESCE(SUM(units_delta), 0) FROM fuel_ledger_entries WHERE principal_id = ?2) >= ?3 " +
          "ON CONFLICT(idempotency_key) DO NOTHING"
        ).bind("fle_" + body.idempotency_key, body.principal_id, body.units, body.idempotency_key,
          body.request_id, reservationId, body.request_id,
          JSON.stringify({ action: body.action, input_sha256: body.input_sha256, trinity_receipt_id: body.trinity_receipt_id }),
          Date.now()).run();
        const existing = await database.prepare("SELECT * FROM fuel_ledger_entries WHERE idempotency_key = ?1").bind(body.idempotency_key).first();
        if (existing) {
          let meta = {};
          try { meta = JSON.parse(existing.metadata_json || "{}"); } catch {}
          if (existing.principal_id !== body.principal_id || existing.entry_type !== "reserve" ||
              existing.units_delta !== -body.units || existing.request_id !== body.request_id ||
              meta.input_sha256 !== body.input_sha256 || meta.trinity_receipt_id !== body.trinity_receipt_id) {
            return result(409, "idempotency-conflict");
          }
          return result(200, null, { reserved: true, replay: true, reservation_id: existing.reservation_id,
            principal_id: body.principal_id, balance_units: await balance(database, body.principal_id) });
        }
        return result(402, "insufficient-fuel", { principal_id: body.principal_id, balance_units: await balance(database, body.principal_id) });
      }

      if (path === "/v1/ledger/settle") {
        if (!validId(body.principal_id) || !validId(body.reservation_id) || !validId(body.idempotency_key) ||
            !["charge", "release"].includes(body.outcome) || !validId(body.outcome_ref)) return result(400, "invalid-settlement");
        const reservation = await database.prepare(
          "SELECT * FROM fuel_ledger_entries WHERE reservation_id = ?1 AND entry_type = 'reserve' AND principal_id = ?2"
        ).bind(body.reservation_id, body.principal_id).first();
        if (!reservation) return result(404, "reservation-not-found");
        // Release is allowed only when the caller has confirmed safe failure. The private
        // runtime/reconciler must enforce this policy; UNKNOWN provider outcomes stay reserved.
        if (body.outcome === "release" && body.safe_failure !== true) return result(409, "safe-failure-proof-required");
        const delta = body.outcome === "release" ? -reservation.units_delta : 0;
        const entryType = body.outcome;
        const entryId = "fle_" + body.idempotency_key;
        const inserted = await database.prepare(
          "INSERT INTO fuel_ledger_entries (entry_id, principal_id, entry_type, units_delta, idempotency_key, request_id, reservation_id, source_rail, source_ref, metadata_json, created_at) " +
          "SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, 'runtime', ?8, ?9, ?10 " +
          "WHERE NOT EXISTS (SELECT 1 FROM fuel_ledger_entries WHERE reservation_id = ?7 AND entry_type IN ('charge','release')) " +
          "ON CONFLICT(idempotency_key) DO NOTHING"
        ).bind(entryId, body.principal_id, entryType, delta, body.idempotency_key, reservation.request_id,
          body.reservation_id, body.outcome_ref, JSON.stringify({ outcome: body.outcome }), Date.now()).run();
        const existing = await database.prepare("SELECT * FROM fuel_ledger_entries WHERE idempotency_key = ?1").bind(body.idempotency_key).first();
        if (existing && existing.principal_id === body.principal_id && existing.entry_type === entryType &&
            existing.reservation_id === body.reservation_id && existing.units_delta === delta) {
          return result(200, null, { settled: true, outcome: entryType,
            replay: !(inserted && inserted.meta && inserted.meta.changes === 1),
            reservation_id: body.reservation_id, balance_units: await balance(database, body.principal_id) });
        }
        const priorTerminal = await database.prepare(
          "SELECT entry_type FROM fuel_ledger_entries WHERE reservation_id = ?1 AND entry_type IN ('charge','release') LIMIT 1"
        ).bind(body.reservation_id).first();
        if (priorTerminal) return result(409, "reservation-already-settled");
        return result(503, "settlement-not-confirmed");
      }
      return result(404, "not-found");
    } catch {
      // Never leak SQL errors, bindings, or request contents.
      return result(503, "ledger-storage-error");
    }
  },
};
