const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadBrowserScript(path, extra = {}) {
  const context = { console, Promise, Date, ...extra };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path, "utf8"), context, { filename: path });
  return context;
}

async function testMissingIrisProviderFailsClosed() {
  const w = loadBrowserScript("js/iris-session.js");
  const result = await w.IrisSession.think("compute the Diamond");
  assert.equal(result.status, "UNAVAILABLE");
  assert.equal(result.grant, "NONE");
  assert.equal(result.lane, "UNAVAILABLE");
  assert.match(result.spoken, /no response was generated/i);
  assert.notEqual(result.spoken, "compute the Diamond");
}

function testFuelBurnMustBeConfirmed() {
  const denied = loadBrowserScript("js/iris-fuel-gate.js", {
    DCFuel: { balance: () => 1, burn: () => ({ ok: false, balance: 1 }) }
  });
  const refused = denied.IrisFuel.admit("compute the Diamond");
  assert.equal(refused.ok, false);
  assert.equal(refused.reason, "FUEL_BURN_NOT_CONFIRMED");

  const accepted = loadBrowserScript("js/iris-fuel-gate.js", {
    DCFuel: { balance: () => 1, burn: () => ({ ok: true, balance: 0, burned: 1 }) }
  });
  const granted = accepted.IrisFuel.admit("compute the Diamond");
  assert.equal(granted.ok, true);
  assert.equal(granted.paid, true);
  assert.equal(granted.burn.burned, 1);

  const missing = loadBrowserScript("js/iris-fuel-gate.js", {
    DCFuel: { balance: () => 1 }
  });
  assert.equal(missing.IrisFuel.admit("compute the Diamond").ok, false);
}

(async () => {
  await testMissingIrisProviderFailsClosed();
  testFuelBurnMustBeConfirmed();
  console.log("Diamond Derivative regression checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
