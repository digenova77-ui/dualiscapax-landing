/**
 * Iris multi-orb cluster — factory sleeve.
 * One conductor + four satellites in locked hall colors.
 * Motion only. Does not open chat, checkout, or a sixth room.
 * Mounts only if a host asks. Apex lander is not auto-wired.
 *
 * Colors lock (AGENT/NOW.md):
 * 01 #ffb830  02 #3b82f6  03 #00e5ff  04 #c084fc  05 #00ffaa
 */
(function (w) {
  "use strict";

  var COLORS = ["#ffb830", "#3b82f6", "#00e5ff", "#c084fc", "#00ffaa"];
  var NAMES = ["fiduciary", "edge", "iris", "research", "unity"];
  var KEY = "dc_iris_orb_room";

  function reduced() {
    return !!(w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function lastRoom() {
    try {
      var n = parseInt(w.sessionStorage.getItem(KEY) || "2", 10);
      if (n >= 0 && n < 5) return n;
    } catch (e) {}
    return 2; /* Iris conductor default */
  }

  function remember(i) {
    try { w.sessionStorage.setItem(KEY, String(i)); } catch (e) {}
  }

  function Cluster() {
    this.host = null;
    this.canvas = null;
    this.ctx = null;
    this.raf = 0;
    this.t0 = 0;
    this.focus = lastRoom();
    this.open = false; /* closed: tap cycles focus, never opens a product */
  }

  Cluster.prototype.mount = function (target) {
    if (reduced()) return null;
    var host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) return null;
    this.host = host;
    var canvas = host.tagName === "CANVAS" ? host : document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = ((canvas.className || "") + " iris-orb-cluster").trim();
    if (canvas.parentNode !== host && host.tagName !== "CANVAS") host.insertBefore(canvas, host.firstChild);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.size();
    var self = this;
    w.addEventListener("resize", function () { self.size(); });
    canvas.addEventListener("click", function () {
      self.focus = (self.focus + 1) % 5;
      remember(self.focus);
    });
    this.t0 = performance.now();
    if (!this.raf) this.loop();
    return canvas;
  };

  Cluster.prototype.size = function () {
    if (!this.canvas || !this.host) return;
    var r = this.host.getBoundingClientRect();
    var dpr = Math.min(w.devicePixelRatio || 1, 2);
    var wdt = Math.max(160, r.width || 280);
    var hgt = Math.max(160, r.height || 280);
    this.canvas.width = Math.floor(wdt * dpr);
    this.canvas.height = Math.floor(hgt * dpr);
    this.canvas.style.width = wdt + "px";
    this.canvas.style.height = hgt + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = wdt;
    this.H = hgt;
  };

  Cluster.prototype.loop = function () {
    var self = this;
    this.raf = w.requestAnimationFrame(function (now) {
      self.draw(now);
      self.loop();
    });
  };

  Cluster.prototype.draw = function (now) {
    var ctx = this.ctx;
    if (!ctx) return;
    var W = this.W || 280;
    var H = this.H || 280;
    var t = (now - this.t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    var cx = W * 0.5;
    var cy = H * 0.5;
    var R = Math.min(W, H) * 0.32;
    var i;
    for (i = 0; i < 5; i++) {
      var ang = t * 0.22 + (i * Math.PI * 2) / 5;
      var orbit = R * (0.72 + 0.08 * Math.sin(t * 0.9 + i));
      var x = cx + Math.cos(ang) * orbit;
      var y = cy + Math.sin(ang) * orbit * 0.86;
      var on = i === this.focus;
      var rad = on ? Math.min(W, H) * 0.09 : Math.min(W, H) * 0.045;
      var g = ctx.createRadialGradient(x - rad * 0.2, y - rad * 0.25, rad * 0.1, x, y, rad);
      g.addColorStop(0, on ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)");
      g.addColorStop(0.35, COLORS[i]);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.fillStyle = g;
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  Cluster.prototype.stop = function () {
    if (this.raf) w.cancelAnimationFrame(this.raf);
    this.raf = 0;
  };

  Cluster.prototype.focusName = function () {
    return NAMES[this.focus] || "iris";
  };

  w.IrisOrbCluster = {
    version: "iris-orb-cluster-2026-09-21-closed",
    colors: COLORS,
    names: NAMES,
    open: false,
    create: function () { return new Cluster(); },
    mount: function (target) {
      var c = new Cluster();
      c.mount(target);
      return c;
    }
  };
})(typeof window !== "undefined" ? window : this);
