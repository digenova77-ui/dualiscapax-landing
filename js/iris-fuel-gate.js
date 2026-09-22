/**
 * Two triggers, one mouth.
 * HERE + BOOK + short LOOK are free.
 * Depth (xAI, grind, runtime work) burns Fuel.
 * Ledger never gifts credits.
 */
(function (w) {
  var VERSION = "iris-fuel-gate-2026-09-22";
  var HERE = /^(?:iris[, ]+)?(what(?:'s| is) this|where am i|what page|what can i do here|explain this|what am i looking at)\b/i;
  var DEPTH = /\b(simulate|fold|compute|prove|derive|optimize|generate a|write me a|build me|train|render|debug this|step the engine|run the runtime)\b/i;

  function balance() {
    if (w.DCFuel && typeof DCFuel.balance === "function") {
      var n = Number(DCFuel.balance());
      return isFinite(n) ? n : 0;
    }
    if (w.FuelLedger && typeof FuelLedger.balance === "function") {
      var m = Number(FuelLedger.balance());
      return isFinite(m) ? m : 0;
    }
    return 0;
  }

  function byok() {
    return !!(w.DCByok && DCByok.present && DCByok.present());
  }

  function grade(text) {
    var raw = String(text || "").trim();
    var page = w.IrisPage && IrisPage.here ? IrisPage.here() : (w.IrisHere && IrisHere.here ? IrisHere.here() : null);
    if (!raw || HERE.test(raw) || (w.IrisPage && IrisPage.hereish && IrisPage.hereish(raw)) || (w.IrisHere && IrisHere.isHereAsk && IrisHere.isHereAsk(raw))) {
      return { lane: "HERE", burn: 0, grant: "HERE", page: page };
    }
    if (w.IrisBook && IrisBook.lookup && IrisBook.lookup(raw)) {
      return { lane: "BOOK", burn: 0, grant: "MEASURE", page: page };
    }
    if (DEPTH.test(raw)) {
      return { lane: "DEPTH", burn: 1, grant: "FUEL", page: page };
    }
    return { lane: "LOOK", burn: 0, grant: "LOOK", page: page };
  }

  function deny() {
    return {
      ok: false,
      grant: "FUEL",
      lane: "DEPTH",
      burn: 0,
      spoken: "Looking is free. Depth needs Fuel. Forty passes are twenty Canadian on Pay.",
      href: "/pay.html",
      label: "Pay Fuel"
    };
  }

  function admit(text) {
    var g = grade(text);
    if (g.lane !== "DEPTH") return { ok: true, paid: false, grade: g };
    if (byok()) return { ok: true, paid: false, byok: true, grade: g };
    if (balance() >= 1) {
      if (w.DCFuel && DCFuel.burn) {
        try { DCFuel.burn(1, "iris-depth"); } catch (e) {}
      } else if (w.FuelLedger && FuelLedger.burn) {
        try { FuelLedger.burn(1, "iris-depth"); } catch (e2) {}
      }
      return { ok: true, paid: true, grade: g };
    }
    return { ok: false, paid: false, grade: g, deny: deny() };
  }

  w.IrisFuel = {
    version: VERSION,
    grade: grade,
    admit: admit,
    deny: deny,
    balance: balance,
    CAD_PER_PACK: { 20: 40, 50: 120, 120: 320 }
  };
})(window);
