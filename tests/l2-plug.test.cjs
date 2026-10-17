const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const { TextEncoder } = require("node:util");

function load(storageFails = false) {
  const values = new Map();
  const localStorage = {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => { if (storageFails) throw new Error("STORAGE_BLOCKED"); values.set(key, String(value)); },
    removeItem: (key) => { if (storageFails) throw new Error("STORAGE_BLOCKED"); values.delete(key); }
  };
  const window = {};
  const context = { window, localStorage, crypto: webcrypto, TextEncoder, Date, Promise, String, Number, RegExp, JSON, Array, Object, Math, isFinite };
  vm.runInNewContext(fs.readFileSync("js/l2-plug.js", "utf8"), context, { filename: "l2-plug.js" });
  return { plug: window.DCL2, values };
}

(async function () {
  const { plug } = load();
  const csv = '"Name","Amount, CAD"\n"Office, West",$17.50\n"two\nlines",20';
  const sheet = await plug.plugFile({ name: "budget.csv", size: Buffer.byteLength(csv), lastModified: 1, text: async () => csv });
  assert.equal(sheet.status, "PLUGGED");
  assert.equal(sheet.headers.length, 2);
  assert.equal(sheet.headers[1], "Amount, CAD");
  assert.equal(sheet.numbers, 2);

  const json = '{"amount":17.5,"label":"2025","items":[2]}';
  const jsonRow = await plug.plugFile({ name: "budget.json", size: Buffer.byteLength(json), lastModified: 1, text: async () => json });
  assert.equal(jsonRow.numbers, 2, "count JSON numeric values, not digits inside strings");

  const workbook = await plug.plugFile({ name: "accounts.xlsx", size: 1024, lastModified: 2 });
  assert.equal(workbook.analysis, "METADATA_ONLY");
  assert.match(workbook.note, /Cell values were not parsed/i);
  assert.equal(workbook.numbers, 0);

  const malformed = "name,amount\n\"Office,17.50";
  const malformedRow = await plug.plugFile({ name: "broken.csv", size: Buffer.byteLength(malformed), lastModified: 3, text: async () => malformed });
  assert.equal(malformedRow.status, "REFUSED");
  assert.equal(malformedRow.reason, "INVALID_TABLE");

  const hugeText = await plug.plugFile({ name: "huge.csv", size: 5 * 1024 * 1024 + 1, lastModified: 3, text: async () => "x" });
  assert.equal(hugeText.status, "REFUSED");
  assert.equal(hugeText.reason, "FILE_TOO_LARGE");

  const hugeWorkbook = await plug.plugFile({ name: "huge.xlsx", size: 25 * 1024 * 1024 + 1, lastModified: 4 });
  assert.equal(hugeWorkbook.status, "REFUSED");
  assert.equal(hugeWorkbook.reason, "FILE_TOO_LARGE");

  const normal = load();
  const cleared = normal.plug.clear();
  assert.equal(cleared, true, "clear reports successful cleanup");
  const blocked = load(true);
  const memoryRow = await blocked.plug.plugFile({ name: "small.csv", size: 9, lastModified: 6, text: async () => "a,b,1,2" });
  assert.equal(memoryRow.storage, "MEMORY_ONLY", "storage failure must be visible instead of crashing");
  assert.equal(memoryRow.status, "REFUSED", "persistent seating must fail closed without browser storage");
  assert.equal(memoryRow.reason, "STORAGE_UNAVAILABLE");
  assert.equal(blocked.plug.clear(), false, "clear must report a failed storage operation");
  console.log("L2 playground file tests: 15 assertions passed");
})().catch((error) => { console.error(error); process.exitCode = 1; });
