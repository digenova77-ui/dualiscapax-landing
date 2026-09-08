/** Inbound webhook idempotency.
 *  Key = Stripe event.id (evt_…). session.id is secondary.
 *  Stripe retries resend the same event.id. There is no inbound Idempotency-Key header.
 */

const TTL = 60 * 60 * 24 * 400;

export function idempotencyKey(eventId, sessionId) {
  if (eventId && String(eventId).slice(0, 4) === "evt_") return String(eventId);
  if (eventId) return String(eventId);
  if (sessionId) return "session:" + String(sessionId);
  return null;
}

function db(env) {
  return (env && (env.DB || env.FULFILL_DB || env.FULFILLMENTS)) || null;
}

export async function claimEvent(env, { eventId, eventType, sessionId, payloadHash }) {
  const key = idempotencyKey(eventId, sessionId);
  if (!key) return { ok: false, reason: "missing_idempotency_key" };

  const database = db(env);
  if (database) {
    const now = Date.now();
    await database
      .prepare(
        "INSERT OR IGNORE INTO events (event_id, event_type, session_id, payload_hash, created_at) VALUES (?, ?, ?, ?, ?)"
      )
      .bind(key, eventType || "unknown", sessionId || null, payloadHash || null, now)
      .run();
    const row = await database.prepare("SELECT event_id, session_id, created_at FROM events WHERE event_id = ?").bind(key).first();
    const entitlement = sessionId
      ? await database.prepare("SELECT * FROM entitlements WHERE session_id = ?").bind(sessionId).first()
      : null;
    if (entitlement) {
      return { ok: true, idempotent: true, store: "d1", key, record: entitlement };
    }
    return { ok: true, idempotent: false, store: "d1", key, row };
  }

  if (env && env.FULFILL_KV) {
    const kvKey = "idemp:" + key;
    const existing = await env.FULFILL_KV.get(kvKey);
    if (existing) {
      try {
        return { ok: true, idempotent: true, store: "kv", key, record: JSON.parse(existing) };
      } catch {
        return { ok: true, idempotent: true, store: "kv", key, record: { raw: existing } };
      }
    }
    const pending = { status: "pending", event_id: eventId || null, session_id: sessionId || null, at: new Date().toISOString() };
    await env.FULFILL_KV.put(kvKey, JSON.stringify(pending), { expirationTtl: TTL });
    return { ok: true, idempotent: false, store: "kv", key, kvKey, pending: true };
  }

  return { ok: false, reason: "store_unbound", key };
}

export async function persistGrant(env, { key, sessionId, record }) {
  const database = db(env);
  if (database && sessionId && record) {
    const now = Date.now();
    const token = record.event_id || key || sessionId;
    const email = record.email || "unknown";
    await database
      .prepare(
        "INSERT OR IGNORE INTO entitlements (session_id, token_id, email, tier, sku, amount_cad_cents, currency, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        sessionId,
        String(token),
        email,
        (record.grant && record.grant.iris_tier_unlock) || record.sku || "UNRESOLVED",
        record.sku || "unresolved",
        record.amount_total == null ? null : record.amount_total,
        record.currency || "cad",
        "granted",
        now
      )
      .run();
  }
  if (env && env.FULFILL_KV && key) {
    const body = JSON.stringify({ ...record, status: "granted" });
    await env.FULFILL_KV.put("idemp:" + key, body, { expirationTtl: TTL });
    if (sessionId) await env.FULFILL_KV.put("session:" + sessionId, body, { expirationTtl: TTL });
    if (record.event_id) await env.FULFILL_KV.put("event:" + record.event_id, body, { expirationTtl: TTL });
  }
}
