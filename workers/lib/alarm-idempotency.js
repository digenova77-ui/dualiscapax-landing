/** Alarm idempotency for a future Durable Object.
 *  Alarms are at-least-once (up to 6 retries). Treat alarm() like a webhook.
 *  Not used by stripe-fulfill — Stripe retries webhooks; do not dual-retry Fuel.
 *
 *  Key = durable name for this wake (e.g. ice:period-end:gameId:stamp).
 *  ctx.storage.put of "alarm:done:" + key is the claim.
 *  SQL objects can pass sql.exec ON CONFLICT instead — same pattern as D1.
 */

export function alarmDoneKey(workId) {
  return "alarm:done:" + String(workId || "");
}

/** Claim this alarm work once. Returns { idempotent } if already done. */
export async function claimAlarm(storage, workId, record) {
  if (!storage || !workId) return { used: false };
  const key = alarmDoneKey(workId);
  const seen = await storage.get(key);
  if (seen) {
    return { used: true, idempotent: true, record: seen };
  }
  const row = Object.assign({ workId: workId, at: Date.now(), status: "done" }, record || {});
  await storage.put(key, row);
  return { used: true, idempotent: false, record: row, key: key };
}

/** SQL-backed object: write-once row. Same Dualis law as fuel_credits. */
export function alarmClaimSql(sql, workId) {
  if (!sql || !workId) return { used: false };
  sql.exec(
    "CREATE TABLE IF NOT EXISTS alarm_claims (work_id TEXT PRIMARY KEY, at INTEGER NOT NULL)"
  );
  const before = sql.exec("SELECT work_id FROM alarm_claims WHERE work_id = ?", workId).toArray();
  if (before.length) return { used: true, idempotent: true };
  sql.exec("INSERT OR IGNORE INTO alarm_claims (work_id, at) VALUES (?, ?)", workId, Date.now());
  const after = sql.exec("SELECT work_id FROM alarm_claims WHERE work_id = ?", workId).toArray();
  return { used: true, idempotent: after.length > 0 && before.length > 0, workId: workId };
}

/** Example alarm() body — copy into a DO, do not bind on fulfill. */
export async function runAlarmOnce(ctx, workId, fn) {
  const claimed = await claimAlarm(ctx.storage, workId);
  if (!claimed.used) return { ok: false, reason: "no_storage" };
  if (claimed.idempotent) return { ok: true, idempotent: true };
  await fn();
  return { ok: true, idempotent: false };
}
