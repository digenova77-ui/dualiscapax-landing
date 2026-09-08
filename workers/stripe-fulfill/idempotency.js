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

function eventInsert(db, row, now) {
  return db
    .prepare(
      "INSERT INTO events (event_id, event_type, session_id, payload_hash, created_at) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(event_id) DO NOTHING"
    )
    .bind(row.event_id, row.event_type || "checkout", row.session_id || null, row.payload_hash || "", now);
}

function entitlementInsert(db, row, now) {
  return db
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
    );
}

function fuelInsert(db, row, now) {
  return db
    .prepare(
      "INSERT INTO fuel_credits (session_id, event_id, email, units, sku, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6) ON CONFLICT(session_id) DO NOTHING"
    )
    .bind(
      row.session_id,
      row.event_id,
      row.email || "unbound@local",
      row.units,
      row.sku || null,
      now
    );
}

export async function claimD1(db, row) {
  if (!db || !row || !row.event_id) return { used: false };
  const now = row.created_at || Math.floor(Date.now() / 1000);
  const ins = await eventInsert(db, row, now).run();
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
  await entitlementInsert(db, row, now).run();
}

function metaChanges(result) {
  return result && result.meta && typeof result.meta.changes === "number" ? result.meta.changes : 0;
}

/** One TX: claim evt_ + write entitlement + optional write-once fuel lot.
 *  Replay if events.changes===0 OR entitlements.changes===0 OR fuel_credits.changes===0.
 *  Do not UPDATE a running total in this batch.
 */
export async function claimGrantD1(db, eventRow, entRow, fuelRow) {
  if (!db || !eventRow || !eventRow.event_id) return { used: false };
  const now = eventRow.created_at || Math.floor(Date.now() / 1000);
  const stmts = [eventInsert(db, eventRow, now)];
  const hasEnt = Boolean(entRow && entRow.session_id);
  const hasFuel =
    Boolean(fuelRow && fuelRow.session_id && fuelRow.event_id && Number(fuelRow.units) > 0);
  if (hasEnt) stmts.push(entitlementInsert(db, entRow, now));
  if (hasFuel) stmts.push(fuelInsert(db, fuelRow, now));
  const results = await db.batch(stmts);
  const ev = metaChanges(results && results[0]);
  let idx = 1;
  const en = hasEnt ? metaChanges(results && results[idx++]) : null;
  const fu = hasFuel ? metaChanges(results && results[idx++]) : null;
  const replay = ev === 0 || (hasEnt && en === 0) || (hasFuel && fu === 0);
  const sid = (entRow && entRow.session_id) || (fuelRow && fuelRow.session_id) || eventRow.session_id;
  if (replay) {
    const existing = sid
      ? await db.prepare("SELECT * FROM entitlements WHERE session_id = ?1").bind(sid).first()
      : null;
    const lots = sid
      ? await db.prepare("SELECT * FROM fuel_credits WHERE session_id = ?1").bind(sid).first()
      : null;
    return {
      used: true,
      idempotent: true,
      entitlement: existing || null,
      fuel: lots || null,
      store: "d1",
      event_changes: ev,
      entitlement_changes: en,
      fuel_changes: fu
    };
  }
  return {
    used: true,
    idempotent: false,
    store: "d1",
    event_changes: ev,
    entitlement_changes: en,
    fuel_changes: fu
  };
}

export async function fuelBalanceD1(db, email) {
  if (!db || !email) return 0;
  const row = await db
    .prepare("SELECT COALESCE(SUM(units), 0) AS units FROM fuel_credits WHERE email = ?1")
    .bind(String(email).toLowerCase())
    .first();
  return Number(row && row.units) || 0;
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
