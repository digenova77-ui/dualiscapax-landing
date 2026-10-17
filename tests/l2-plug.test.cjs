const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const { TextEncoder } = require("node:util");

function load() {
  const values = new Map();
  const localStorage = {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
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

  const hugeText = await plug.plugFile({ name: "huge.csv", size: 5 * 1024 * 1024 + 1, lastModified: 3, text: async () => "x" });
  assert.equal(hugeText.status, "REFUSED");
  assert.equal(hugeText.reason, "FILE_TOO_LARGE");

  const hugeWorkbook = await plug.plugFile({ name: "huge.xlsx", size: 25 * 1024 * 1024 + 1, lastModified: 4 });
  assert.equal(hugeWorkbook.status, "REFUSED");
  assert.equal(hugeWorkbook.reason, "FILE_TOO_LARGE");
  console.log("L2 playground file tests: 12 assertions passed");
})().catch((error) => { console.error(error); process.exitCode = 1; });
