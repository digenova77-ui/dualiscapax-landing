const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
function load(overrides = {}) {
  const window = Object.assign({ location: { pathname: "/ai/app.html" } }, overrides);
  vm.runInNewContext(fs.readFileSync("js/iris-session.js", "utf8"), { window, Date, Promise, String }, { filename: "iris-session.js" });
  return window.IrisSession;
}
(async function () {
  const missing = load();
  const noEngine = await missing.think("hello");
  assert.equal(noEngine.lane, "ERROR");
  assert.equal(missing.state(), "idle");
  const working = load({ DCLMLook: { run: async () => ({ grant: "BOOK", lane: "BOOK", spoken: "Grounded answer." }) } });
  const answer = await working.think("question");
  assert.equal(answer.spoken, "Grounded answer.");
  assert.equal(working.snapshot().last.spoken, "Grounded answer.");
  assert.equal(working.state(), "idle");
  const failing = load({ DCLMLook: { run: async () => { throw new Error("private internal detail"); } } });
  const failed = await failing.think("question");
  assert.equal(failed.lane, "ERROR");
  assert.match(failed.spoken, /try again/i);
  assert.doesNotMatch(failed.spoken, /private internal detail/);
  assert.equal(failing.state(), "idle");
  console.log("IrisSession tests: 3 passed");
})().catch((error) => { console.error(error); process.exitCode = 1; });
