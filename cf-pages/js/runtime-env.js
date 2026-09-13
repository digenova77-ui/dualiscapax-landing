/* Client runtime — reads this device only. Not a portfolio. */
(function (w) {
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function fuelBal() {
    try {
      if (w.DCFuel && typeof DCFuel.balance === "function") return Number(DCFuel.balance()) || 0;
    } catch (e) {}
    return 0;
  }

  function snapshot() {
    var row = (w.DCOnboard && DCOnboard.load && DCOnboard.load()) || read("dc.onboard.v7", {}) || {};
    var layers = (w.DCContract && DCContract.layers) ? DCContract.layers() : null;
    var view = (w.DCContract && DCContract.publicView) ? DCContract.publicView() : { bound: false };
    var chain = (w.DCAudit && DCAudit.chain) ? DCAudit.chain() : read("dc_audit_chain_v1", []);
    var filled = 0;
    var lamps = [];
    if (layers) {
      ["L1", "L2", "L3", "L4", "L5"].forEach(function (id) {
        var ok = !!(layers[id] && layers[id].ok);
        if (ok) filled += 1;
        lamps.push({ id: id, name: layers[id] ? layers[id].name : id, ok: ok });
      });
    }
    var seat = view.seat || row.seat || "visitor";
    var state = view.state || (view.bound ? "BOUND_LOCAL" : "LOOK");
    return {
      seat: seat,
      state: state,
      bound: !!view.bound,
      layers_on: filled,
      layers_max: 5,
      lamps: lamps,
      fuel: fuelBal(),
      audits: chain.length,
      tip: chain.length ? chain[chain.length - 1].receipt : null,
      terms: view.terms_hash || null,
      buy_open: false,
      earned_cad: 0,
      look_click: "closed",
      window: "90-day look not open on this site"
    };
  }

  function paintGauge(canvas, snap) {
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(w.devicePixelRatio || 1, 2);
    var size = canvas.clientWidth || 180;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cx = size / 2, cy = size / 2, r = size * 0.38;
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(142,180,200,.22)";
    ctx.lineWidth = 8;
    ctx.stroke();
    var t = snap.layers_max ? snap.layers_on / snap.layers_max : 0;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + t * Math.PI * 2);
    ctx.strokeStyle = snap.bound ? "#8eb4c8" : "#d6b25e";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.fillStyle = "#e8eef6";
    ctx.font = "700 1.35rem ui-sans-serif,system-ui";
    ctx.textAlign = "center";
    ctx.fillText(snap.layers_on + " / " + snap.layers_max, cx, cy + 6);
    ctx.fillStyle = "rgba(232,238,246,.55)";
    ctx.font = "600 .62rem ui-sans-serif,system-ui";
    ctx.fillText(snap.bound ? "device locked" : "looking", cx, cy + 26);
  }

  w.DCRuntime = { snapshot: snapshot, paintGauge: paintGauge };
})(window);
