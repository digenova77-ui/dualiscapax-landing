function wordOf(r) {
  if (!r) return "";
  const copy = {};
  for (const k of Object.keys(r).sort()) {
    if (k === "finger" || k === "prev") continue;
    copy[k] = r[k];
  }
  return JSON.stringify(copy);
}
function finger16(prev) {
  const s = wordOf(prev);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h & 0xffff;
}
function verifyReceiptChain(receipts) {
  if (!Array.isArray(receipts) || receipts.length === 0) return { ok: true, length: 0, reason: "empty" };
  for (let i = 0; i < receipts.length; i++) {
    const cur = receipts[i];
    if (!cur || !cur.id || !String(cur.id).startsWith("rcpt:")) return { ok: false, length: i, reason: "bad id" };
    if (i === 0) {
      if (cur.finger != null && cur.finger !== 0) return { ok: false, length: 0, reason: "first finger must be 0" };
      continue;
    }
    const prev = receipts[i - 1];
    if (cur.prev !== prev.id) return { ok: false, length: i, reason: "prev mismatch" };
    const expected = finger16(prev);
    if (cur.finger !== expected) return { ok: false, length: i, reason: "finger mismatch", expected };
  }
  return { ok: true, length: receipts.length, last: receipts[receipts.length - 1].id };
}
const a = { id: "rcpt:1", finger: 0, body: "alpha" };
const b = { id: "rcpt:2", prev: "rcpt:1", finger: finger16(a), body: "beta" };
const good = verifyReceiptChain([a, b]);
const bad = verifyReceiptChain([a, { ...b, body: "changed" }]);
if (!good.ok || bad.ok) {
  console.error({ good, bad });
  process.exit(1);
}
console.log(JSON.stringify({ good, bad_body: bad }, null, 2));
