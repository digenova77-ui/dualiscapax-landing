/**
 * Dualis portable runtime.
 * Invited software layer. If they can run code, they can run us.
 * Android / Apple / Windows / Linux browsers + Node.
 * Books stay on the device. Operators do not see them. Models may compute after bind.
 */
(function (root) {
  var VERSION = "runtime-2026-09-01";
  var SECRET = /(password|passwd|secret|token|apikey|api_key|bearer|authorization|private[_-]?key)/i;

  function now() {
    return new Date().toISOString();
  }

  function detectHost() {
    var ua = "";
    if (typeof navigator !== "undefined" && navigator.userAgent) ua = navigator.userAgent;
    var plat = "";
    if (typeof process !== "undefined" && process.platform) plat = process.platform;
    if (/Android/i.test(ua)) return "android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
    if (plat === "win32" || /Windows/i.test(ua)) return "windows";
    if (plat === "darwin" || /Mac OS X/i.test(ua)) return "macos";
    if (plat === "linux" || /Linux/i.test(ua)) return "linux";
    return "unknown";
  }

  function hole(reason, extra) {
    var row = {
      status: "HOLE",
      reason: reason || "HOLE_NOT_ZERO",
      host: detectHost(),
      operators_see: false,
      models_may_compute: false,
      scientific_validation: false,
      ts: now()
    };
    if (extra) Object.keys(extra).forEach(function (k) { row[k] = extra[k]; });
    return row;
  }

  function outboundOk(payload) {
    if (!payload || typeof payload !== "object") return false;
    if (payload.raw || payload.books || payload.cells || payload.file_text) return false;
    var blob = JSON.stringify(payload);
    if (SECRET.test(blob)) return false;
    return true;
  }

  async function invite(opts) {
    opts = opts || {};
    if (!opts.invite) return hole("NO_INVITE");
    var host = detectHost();
    var plug = null;
    if (root.DCL2 && typeof root.DCL2.load === "function") plug = root.DCL2.load();
    if (!plug || plug.status !== "PLUGGED") {
      return hole("NO_PLUG", { host: host, next: "Seat a sheet on this device first." });
    }
    if (!root.DCAgreement || typeof root.DCAgreement.bind !== "function") {
      return hole("NO_AGREEMENT", { host: host });
    }
    var bound = await root.DCAgreement.bind({
      invite: true,
      booksHash: plug.hash,
      host: host,
      source: plug.name || plug.domain || "device"
    });
    if (!bound || bound.status !== "BOUND") return bound || hole("BIND_FAILED");
    return {
      status: "SEATED",
      host: host,
      v: VERSION,
      bind: root.DCAgreement.receipt(bound),
      numbers: plug.numbers || 0,
      residual_unit: plug.residual_unit || "SEED",
      operators_see: false,
      models_may_compute: true,
      scientific_validation: false,
      ts: now()
    };
  }

  function modelEnvelope(session) {
    if (!session || session.status !== "SEATED") return hole("NO_SESSION");
    var receipt = session.bind || {};
    var env = {
      grant: session.numbers > 0 ? "MEASURE" : "SEED",
      id: receipt.id,
      year: receipt.year,
      source: receipt.source,
      stamp: receipt.stamp,
      status: receipt.status,
      hash: receipt.hash,
      agreement_hash: receipt.agreement_hash,
      books_hash: receipt.books_hash,
      host: session.host,
      numbers: session.numbers,
      residual_unit: session.residual_unit,
      operators_see: false,
      models_may_compute: true,
      scientific_validation: false
    };
    if (!outboundOk(env)) return hole("OUTBOUND_REFUSED");
    return env;
  }

  var api = {
    version: VERSION,
    law: "INVITED_LAYER_NOT_IMPLANT",
    host: detectHost,
    invite: invite,
    modelEnvelope: modelEnvelope,
    outboundOk: outboundOk,
    hole: hole
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.DCRuntime = api;
})(typeof window !== "undefined" ? window : globalThis);
