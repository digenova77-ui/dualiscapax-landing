/** Identity jacket helpers.
 *  Stripe outbound POST uses Idempotency-Key = atom.
 *  Webhook fulfill uses D1: events.event_id + entitlements.session_id + grants.atom.
 */

const TTL = 60 * 60 * 24 * 400;

export function dualisAtom(parts) {
  const sku = parts && parts.sku ? String(parts.sku) : "";
  const host = parts && parts.host ? String(parts.host) : "";
  const window = parts && parts.window ? String(parts.window) : "";
  const payer = parts && parts.payer ? String(parts.payer) : "";
  if (sku && host && window && payer) return `dc:${sku}:${host}:${window}:${payer}`;
  if (parts && parts.sessionId) return `cs:${parts.sessionId}`;
  return null;
}

export function idempotencyKey(eventId, sessionId) {
  if (eventId) return { kind: "event", key: "event:" + eventId, eventId: eventId, sessionId: sessionId || null };
  if (sessionId) return { kind: "session", key: "session:" + sessionId, eventId: null, sessionId: sessionId };
  return null;
}

function parseRecord(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return { raw: raw };
  }
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

function grantInsert(db, row, now) {
  return db
    .prepare(
      "INSERT INTO grants (atom, event_id, session_id, sku, created_at) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(atom) DO NOTHING"
    )
    .bind(row.atom, row.event_id, row.session_id || null, row.sku || null, now);
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

/** One TX: claim evt_ + entitlement + optional fuel lot + optional atom grant.
 *  Replay if any INSERT reports changes===0.
 *  Do not UPDATE a running total in this batch.
 */
export async function claimGrantD1(db, eventRow, entRow, fuelRow, grantRow) {
  if (!db || !eventRow || !eventRow.event_id) return { used: false };
  const now = eventRow.created_at || Math.floor(Date.now() / 1000);
  const stmts = [eventInsert(db, eventRow, now)];
  const hasEnt = Boolean(entRow && entRow.session_id);
  const hasFuel =
    Boolean(fuelRow && fuelRow.session_id && fuelRow.event_id && Number(fuelRow.units) > 0);
  const hasGrant = Boolean(grantRow && grantRow.atom && grantRow.event_id);
  if (hasEnt) stmts.push(entitlementInsert(db, entRow, now));
  if (hasFuel) stmts.push(fuelInsert(db, fuelRow, now));
  if (hasGrant) stmts.push(grantInsert(db, grantRow, now));
  const results = await db.batch(stmts);
  const ev = metaChanges(results && results[0]);
  let idx = 1;
  const en = hasEnt ? metaChanges(results && results[idx++]) : null;
  const fu = hasFuel ? metaChanges(results && results[idx++]) : null;
  const gr = hasGrant ? metaChanges(results && results[idx++]) : null;
  const replay = ev === 0 || (hasEnt && en === 0) || (hasFuel && fu === 0) || (hasGrant && gr === 0);
  const sid = (entRow && entRow.session_id) || (fuelRow && fuelRow.session_id) || eventRow.session_id;
  const atom = hasGrant ? grantRow.atom : null;
  if (replay) {
    const existing = sid
      ? await db.prepare("SELECT * FROM entitlements WHERE session_id = ?1").bind(sid).first()
      : null;
    const lots = sid
      ? await db.prepare("SELECT * FROM fuel_credits WHERE session_id = ?1").bind(sid).first()
      : null;
    const grant = atom
      ? await db.prepare("SELECT * FROM grants WHERE atom = ?1").bind(atom).first()
      : sid
        ? await db.prepare("SELECT * FROM grants WHERE session_id = ?1").bind(sid).first()
        : null;
    return {
      used: true,
      idempotent: true,
      entitlement: existing || null,
      fuel: lots || null,
      grant: grant || null,
      store: "d1",
      event_changes: ev,
      entitlement_changes: en,
      fuel_changes: fu,
      grant_changes: gr
    };
  }
  return {
    used: true,
    idempotent: false,
    store: "d1",
    event_changes: ev,
    entitlement_changes: en,
    fuel_changes: fu,
    grant_changes: gr
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
  // KV is observation/cache only. Cannot mint authoritative grant.
  // Fail closed on first-write race: no put-if-absent primitive → refuse mint.
  if (!kv || !key) {
    return { used: false, authority_effect: "NONE", reason: "KV_UNBOUND" };
  }
  const seen = await kv.get(key);
  if (seen) {
    return {
      used: true,
      idempotent: true,
      authoritative: false,
      authority_effect: "NONE",
      store: "kv",
      record: parseRecord(seen),
      note: "KV replay observation only — not an authoritative grant"
    };
  }
  return {
    used: false,
    idempotent: false,
    authoritative: false,
    authority_effect: "NONE",
    store: "kv",
    reason: "KV_CANNOT_MINT_GRANT",
    note: "Refuse independent KV mint; D1 claimGrant required"
  };
}

/** Check event:evt_ and session:cs_ before any KV mutate.
 *  Replay if either key exists so completed + async_payment_succeeded share one grant.
 */
export async function claimDualKv(kv, eventId, sessionId, record) {
  // Dual-key race (get-then-put) cannot be made atomic on KV alone.
  // Fail closed: observe prior keys; never mint authoritative grant from KV.
  if (!kv) {
    return { used: false, authority_effect: "NONE", reason: "KV_UNBOUND" };
  }
  const eventKey = eventId ? "event:" + eventId : null;
  const sessionKey = sessionId ? "session:" + sessionId : null;
  if (eventKey) {
    const ev = await kv.get(eventKey);
    if (ev) {
      return {
        used: true,
        idempotent: true,
        authoritative: false,
        authority_effect: "NONE",
        store: "kv",
        via: "event",
        record: parseRecord(ev),
        note: "KV observation only"
      };
    }
  }
  if (sessionKey) {
    const se = await kv.get(sessionKey);
    if (se) {
      return {
        used: true,
        idempotent: true,
        authoritative: false,
        authority_effect: "NONE",
        store: "kv",
        via: "session",
        record: parseRecord(se),
        note: "KV observation only"
      };
    }
  }
  return {
    used: false,
    idempotent: false,
    authoritative: false,
    authority_effect: "NONE",
    store: "kv",
    reason: "KV_CANNOT_MINT_GRANT",
    eventKey: eventKey,
    sessionKey: sessionKey,
    note: "Refuse KV first-write mint; require D1 atomic claimGrant"
  };
}

export async function finalizeKv(kv, key, record) {
  if (!kv || !key) return;
  await kv.put(key, JSON.stringify(record), { expirationTtl: TTL });
}

export { TTL };
