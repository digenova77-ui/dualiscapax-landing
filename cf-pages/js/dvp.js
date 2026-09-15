/**
 * DVP-1.0c. Listens to DSAP.listen. Never wraps place.
 */
(function (w) {
  if (w.DVP && w.DVP.version === "DVP-1.0c") return;
  var canvas, ctx, raf, seats = [], amp = [], gold = 0, alive = false;
  function mk() {
    seats = []; amp = [];
    for (var i = 0; i < 64; i++) {
      seats.push({ a: (i / 64) * Math.PI * 2, r: 0.34 + (i % 5) * 0.012 });
      amp.push(0);
    }
  }
  function size() {
    if (!canvas) return;
    var d = Math.min(2, w.devicePixelRatio || 1);
    canvas.width = canvas.clientWidth * d;
    canvas.height = canvas.clientHeight * d;
  }
  function draw() {
    if (!ctx || !canvas) return;
    var W = canvas.width, H = canvas.height;
    ctx.fillStyle = "rgba(5,7,12,0.18)";
    ctx.fillRect(0, 0, W, H);
    var cx = W * 0.5, cy = H * 0.46, R = Math.min(cx, cy) * 0.78;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,183,3," + (0.18 + gold * 0.5) + ")";
    ctx.fill();
    ctx.strokeStyle = "rgba(62,232,255," + (0.14 + gold * 0.25) + ")";
    ctx.lineWidth = Math.max(1, W / 900);
    ctx.beginPath();
    for (var i = 0; i < 64; i++) {
      var s = seats[i], rr = R * (s.r + amp[i] * 0.08);
      var x = cx + Math.cos(s.a) * rr, y = cy + Math.sin(s.a) * rr * 0.72;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
    for (var j = 0; j < 64; j++) {
      var s = seats[j], rr = R * (s.r + amp[j] * 0.08);
      var x = cx + Math.cos(s.a) * rr, y = cy + Math.sin(s.a) * rr * 0.72;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.6, (2.2 + amp[j] * 4) * (W / 900)), 0, Math.PI * 2);
      ctx.fillStyle = amp[j] > 0.2 ? "rgba(255,183,3," + (0.35 + amp[j] * 0.5) + ")" : "rgba(62,232,255," + (0.28 + amp[j]) + ")";
      ctx.fill();
      amp[j] *= 0.91;
    }
    gold *= 0.94;
    raf = requestAnimationFrame(draw);
  }
  function pulse(kind, i) {
    if (!alive) return;
    i = ((i % 64) + 64) % 64;
    amp[i] = 1;
    if (kind === "whistle") gold = 1;
    amp[(i + 8) % 64] = Math.max(amp[(i + 8) % 64], 0.45);
  }
  function mount(el) {
    canvas = typeof el === "string" ? document.getElementById(el) : el;
    if (!canvas) return null;
    ctx = canvas.getContext("2d");
    mk(); size();
    w.addEventListener("resize", size);
    if (raf) cancelAnimationFrame(raf);
    alive = true; draw();
    if (w.DSAP && w.DSAP.listen) w.DSAP.listen(pulse);
    return w.DVP;
  }
  w.DVP = { version: "DVP-1.0c", mount: mount, pulse: pulse, seats: 64 };
})(window);
