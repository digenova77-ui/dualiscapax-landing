/** Identity jacket helpers.
 *  Idempotency key = Stripe event.id (evt_…). session.id is secondary.
 *  Stripe webhooks do not send an Idempotency-Key header.
 */

const TTL = 60 * 60 * 24 * 400;

export function idempotencyKey(eventId, sessionId) {
  if (eventId) return { kind: "event", key: "event:" + eventId, eventId: eventId, sessionId: sessionId || null };
  if (sessionId) return { kind: "session", key: "session:" + sessionId, eventId: null, sessionId: sessionId };
  return null;
}

export async function claimD1(db, row) {
  if (!db || !row || !row.event_id) return { used: false };
  const now = row.created_at || Math.floor(Date.now() / 1000);
  const ins = await db
    .prepare(
      "INSERT INTO events (event_id, event_type, session_id, payload_hash, created_at) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(event_id) DO NOTHING"
    )
    .bind(row.event_id, row.event_type || "checkout", row.session_id || null, row.payload_hash || "", now)
    .run();
  const changes = ins && ins.meta && typeof ins.meta.changes === "number" ? ins.meta.changes : 0;
  if (changes === 0) {
    const existing = row.session_id
      ? await db.prepare("SELECT * FROM entitlements WHERE session_id = ?1").bind(row.session_id).first()
      : null;
    return { used: true, idempotent: true, entitlement: existing || null };
  }
  return { used: true, idempotent: false };
}

export async function putEntitlementD1(db, row) {
  if (!db || !row || !row.session_id) return;
  const now = row.created_at || Math.floor(Date.now() / 1000);
  await db
    .prepare(
      "INSERT INTO entitlements (session_id, token_id, email, tier, sku, amount_cad_cents, currency, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9) ON CONFLICT(session_id) DO NOTHING"
    )
    .bind(
      row.session_id,
      row.token_id || row.event_id || row.session_id,
      row.email || "unbound@local",
      row.tier || "GRANTED",
      row.sku || "unresolved",
      row.amount_cad_cents || null,
      row.currency || "cad",
      row.status || "granted",
      now
    )
    .run();
}

export async function claimKv(kv, key, record) {
  if (!kv || !key) return { used: false };
  const seen = await kv.get(key);
  if (seen) {
    try {
      return { used: true, idempotent: true, record: JSON.parse(seen) };
    } catch (e) {
      return { used: true, idempotent: true, record: { raw: seen } };
    }
  }
  const pending = Object.assign({}, record || {}, { status: "pending" });
  await kv.put(key, JSON.stringify(pending), { expirationTtl: TTL });
  return { used: true, idempotent: false, record: pending };
}

export async function finalizeKv(kv, key, record) {
  if (!kv || !key) return;
  await kv.put(key, JSON.stringify(record), { expirationTtl: TTL });
}

export { TTL };
