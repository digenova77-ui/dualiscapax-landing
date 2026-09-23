/** Quiet star dust. The room is night. It is not a planetarium. */
(function (w) {
  var VERSION = "iris-sky-2026-09-23";
  var canvas, ctx, raf = 0, stars = [], reduced = false;

  function place() {
    if (canvas.parentNode === document.body) return;
    canvas.id = "iris-sky";
    canvas.setAttribute("aria-hidden", "true");
    document.body.insertBefore(canvas, document.body.firstChild);
  }

  function size() {
    if (!canvas) return;
    var dpr = Math.min(1.5, w.devicePixelRatio || 1);
    canvas.width = Math.floor(w.innerWidth * dpr);
    canvas.height = Math.floor(w.innerHeight * dpr);
    canvas.style.cssText = "position:fixed;inset:0;z-index:0;pointer-events:none;width:100%;height:100%;opacity:.55";
  }

  function seed() {
    stars = [];
    var n = Math.min(110, Math.floor((w.innerWidth * w.innerHeight) / 14000));
    var i, r;
    for (i = 0; i < n; i++) {
      r = Math.random();
      stars.push({
        x: Math.random(),
        y: Math.random(),
        s: r > 0.92 ? 1.6 : r > 0.7 ? 1.15 : 0.7,
        a: 0.18 + Math.random() * 0.35,
        tw: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.0008
      });
    }
  }

  function draw(now) {
    raf = w.requestAnimationFrame(draw);
    if (!ctx || !canvas) return;
    var W = canvas.width, H = canvas.height, i, s, tw, x, y;
    ctx.clearRect(0, 0, W, H);
    var g = ctx.createRadialGradient(W * 0.5, H * 0.18, 20, W * 0.5, H * 0.4, H * 0.85);
    g.addColorStop(0, "rgba(12,28,48,0.35)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (i = 0; i < stars.length; i++) {
      s = stars[i];
      if (!reduced) s.x = (s.x + s.drift + 1) % 1;
      tw = reduced ? s.a : s.a * (0.72 + 0.28 * Math.sin((now || 0) / 900 + s.tw));
      x = s.x * W; y = s.y * H;
      ctx.beginPath();
      ctx.arc(x, y, s.s, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(226,240,255," + tw + ")";
      ctx.fill();
    }
  }

  function mount() {
    if (canvas) return canvas;
    reduced = !!(w.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d", { alpha: true });
    place();
    size();
    seed();
    w.addEventListener("resize", function () { size(); seed(); });
    if (!raf) raf = w.requestAnimationFrame(draw);
    document.documentElement.setAttribute("data-sky", "dust");
    return canvas;
  }

  w.IrisSky = { version: VERSION, mount: mount };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})(window);
