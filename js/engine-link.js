/**
 * Abstract layer. Coin learnings that land without a mint.
 * Receipt hash is the address-space slot. Claim <= evidence.
 * States: ESCROW | PURE | SPENT | HOLE
 * Not an issuer. Not a checkout. Not FPGA.
 */
(function (w) {
  var VERSION = "engine-link-2026-09-23";
  var STORE = "dc-engine-slots";
  var SIT = "dc-unity-sitting";
  var slots = {};
  var last = null;

  try {
    slots = JSON.parse(localStorage.getItem(STORE) || "{}") || {};
  } catch (e) {
    slots = {};
  }

  function persist() {
    try { localStorage.setItem(STORE, JSON.stringify(slots)); } catch (e) {}
  }

  function sitting() {
    try {
      var raw = localStorage.getItem(SIT);
      if (raw) return String(raw).slice(0, 48);
    } catch (e) {}
    if (w.UnityID && UnityID.public) {
      try { return String(UnityID.public()).slice(0, 48); } catch (e) {}
    }
    return "guest-local";
  }

  function hole(why, extra) {
    var out = {
      status: "HOLE",
      state: "HOLE",
      why: why || "NO_EVIDENCE",
      sitting: sitting(),
      issued: false,
      version: VERSION
    };
    if (extra) for (var k in extra) out[k] = extra[k];
    last = out;
    return out;
  }

  function envelope(rec, receipt) {
    if (!rec || rec.q == null || rec.p == null || rec.h == null || rec.residual == null) {
      return hole("MISSING_FIELDS", { rec: rec || null });
    }
    if (!receipt) return hole("NO_RECEIPT", { rec: rec });
    var id = "slot:" + String(receipt).slice(0, 16);
    if (slots[id] && slots[id].state === "SPENT") {
      return hole("DOUBLE_CLAIM", { id: id, receipt: receipt });
    }
    var env = {
      status: rec.status || "OK",
      state: "PURE",
      id: id,
      kind: "kernel-step",
      q: rec.q,
      p: rec.p,
      h: rec.h,
      residual: rec.residual,
      det: rec.det == null ? 1 : rec.det,
      route: rec.route || "",
      latency_ms: rec.latency_ms,
      receipt: receipt,
      sitting: sitting(),
      issued: false,
      note: "one harmonic step on this device; not a mint; not a universe",
      version: VERSION
    };
    slots[id] = { state: "PURE", at: Date.now(), sitting: env.sitting };
    persist();
    last = env;
    if (w.CosmicFactory && CosmicFactory.tick) {
      try { CosmicFactory.tick("engine-link", { id: id, residual: env.residual }); } catch (e) {}
    }
    return env;
  }

  function spend(id) {
    if (!id || !slots[id]) return hole("UNKNOWN_SLOT");
    if (slots[id].state === "SPENT") return hole("DOUBLE_CLAIM", { id: id });
    slots[id].state = "SPENT";
    persist();
    return { status: "OK", state: "SPENT", id: id, sitting: sitting(), issued: false };
  }

  function step() {
    if (!w.CosmicRuntime || !CosmicRuntime.step) {
      return Promise.resolve(hole("RUNTIME_MISSING"));
    }
    var st = CosmicRuntime.state ? CosmicRuntime.state() : { q: 1, p: 0 };
    var rec = CosmicRuntime.step(st.q, st.p, 0.001);
    if (!rec) return Promise.resolve(hole("STEP_EMPTY"));
    if (typeof CosmicRuntime.seal !== "function") {
      return Promise.resolve(envelope(rec, "no-seal"));
    }
    return CosmicRuntime.seal(rec).then(function (sealed) {
      var hexed = sealed && sealed.hex ? sealed.hex : (rec.receipt || "");
      return envelope(rec, hexed);
    }).catch(function () {
      return hole("SEAL_FAIL", { rec: rec });
    });
  }

  function spoken(env) {
    env = env || last;
    if (!env) return "I have not run a step yet. Tap Run one step.";
    if (env.state === "HOLE") {
      return "Hole. " + (env.why || "no evidence") + ". I will not pretend the engine ran.";
    }
    var r = typeof env.residual === "number" ? env.residual.toExponential(3) : String(env.residual);
    var prefix = String(env.receipt || "").slice(0, 12);
    return "One kernel step on this phone. q " + Number(env.q).toFixed(4) +
      ", p " + Number(env.p).toFixed(4) +
      ", H " + Number(env.h).toFixed(4) +
      ", residual " + r +
      ", receipt " + (prefix || "missing") +
      ". That hash is the slot. eFuse is the protocol in the repo. This is compute, not a mint.";
  }

  function paint(env) {
    var card = document.getElementById("engine-probe");
    if (!card) return;
    var line = document.getElementById("engine-line");
    var meta = document.getElementById("engine-meta");
    if (line) line.textContent = spoken(env);
    if (meta) {
      if (!env || env.state === "HOLE") {
        meta.textContent = env ? ("HOLE · " + env.why) : "no step yet";
      } else {
        meta.textContent = env.id + " · " + env.state + " · sitting " + env.sitting;
      }
    }
    card.setAttribute("data-state", env && env.state ? env.state : "idle");
  }

  function bind() {
    var btn = document.getElementById("engine-step");
    if (!btn || btn.dataset.engineLink) return;
    btn.dataset.engineLink = "1";
    btn.addEventListener("click", function () {
      btn.disabled = true;
      step().then(function (env) {
        paint(env);
        var mute = false;
        try { mute = localStorage.getItem("dc-iris-mute") === "1"; } catch (e) {}
        if (!mute && w.IrisAV && IrisAV.speak) IrisAV.speak(spoken(env));
        else {
          var hint2 = document.getElementById("hint");
          if (hint2) hint2.textContent = spoken(env);
        }
      }).then(function () { btn.disabled = false; }, function () { btn.disabled = false; });
    });
  }

  w.EngineLink = {
    version: VERSION,
    sitting: sitting,
    step: step,
    spend: spend,
    spoken: spoken,
    last: function () { return last; },
    slots: function () { return JSON.parse(JSON.stringify(slots)); },
    hole: hole
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})(window);
