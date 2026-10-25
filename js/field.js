/**
 * DualisField — local particle field.
 *
 * No CDN. No framework. Pointer events pass through.
 * Stops when the user prefers reduced motion or the tab is hidden.
 */
(function (root) {
  var VERSION = "field-2026-10-25";

  function create(count, width, height) {
    var particles = new Array(count);
    for (var i = 0; i < count; i++) {
      particles[i] = {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35
      };
    }
    return particles;
  }

  function step(particles, width, height, pointer) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (pointer) {
        var dx = p.x - pointer.x;
        var dy = p.y - pointer.y;
        var dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < 110) {
          var force = (110 - dist) / 110;
          p.vx += (dx / dist) * force * 0.08;
          p.vy += (dy / dist) * force * 0.08;
        }
      }
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x += width;
      if (p.x > width) p.x -= width;
      if (p.y < 0) p.y += height;
      if (p.y > height) p.y -= height;
    }
    return particles;
  }

  function links(particles, distance) {
    var pairs = [];
    var limit = typeof distance === "number" ? distance : 120;
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var a = particles[i];
        var b = particles[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        if (dx * dx + dy * dy <= limit * limit) pairs.push([i, j]);
      }
    }
    return pairs;
  }

  function push(particles, x, y, width, height) {
    particles.push({
      x: Math.max(0, Math.min(width, x)),
      y: Math.max(0, Math.min(height, y)),
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2
    });
    if (particles.length > 140) particles.shift();
    return particles;
  }

  function mount(canvas) {
    if (!canvas || !canvas.getContext) return null;
    var reduce = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ctx = canvas.getContext("2d");
    var pointer = null;
    var running = !reduce;
    function resize() {
      var dpr = Math.min(root.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function countFor() {
      var area = canvas.clientWidth * canvas.clientHeight;
      return Math.max(24, Math.min(90, Math.floor(area / 18000)));
    }
    resize();
    var particles = create(countFor(), canvas.clientWidth, canvas.clientHeight);
    function frame() {
      if (!running) return;
      step(particles, canvas.clientWidth, canvas.clientHeight, pointer);
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      var pairs = links(particles, 120);
      ctx.strokeStyle = "rgba(99, 247, 221, 0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var n = 0; n < pairs.length; n++) {
        var a = particles[pairs[n][0]];
        var b = particles[pairs[n][1]];
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
      ctx.fillStyle = "rgba(99, 247, 221, 0.55)";
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        ctx.fillRect(p.x, p.y, 1.6, 1.6);
      }
      root.requestAnimationFrame(frame);
    }
    root.addEventListener("resize", function () {
      resize();
      particles = create(countFor(), canvas.clientWidth, canvas.clientHeight);
    });
    root.addEventListener("pointermove", function (event) {
      var rect = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    });
    root.addEventListener("click", function (event) {
      var rect = canvas.getBoundingClientRect();
      push(particles, event.clientX - rect.left, event.clientY - rect.top, canvas.clientWidth, canvas.clientHeight);
    });
    root.document.addEventListener("visibilitychange", function () {
      var hidden = root.document.hidden;
      if (hidden) running = false;
      else if (!reduce) { running = true; frame(); }
    });
    if (running) frame();
    return { version: VERSION, count: particles.length };
  }

  var api = { version: VERSION, create: create, step: step, links: links, push: push, mount: mount };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.DualisField = api;
  if (typeof document !== "undefined") {
    var canvas = document.getElementById("field");
    if (canvas) mount(canvas);
  }
})(typeof window !== "undefined" ? window : globalThis);
