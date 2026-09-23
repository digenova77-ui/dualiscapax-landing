/**
 * Iris cluster — WebGL 2 raymarch when the device allows it.
 * Three spheres, one quaternion pose, DSAP.wave() as energy.
 * Canvas 2D fallback. Same mount/pose API. No Three.js.
 */
(function (w) {
  var VERSION = "iris-sphere-2026-09-22-gl3";
  var canvas, ctx, gl, prog, raf = 0, reduced = false, mode = "none";
  var energy = 0.2, speaking = false, listening = false, woken = false;
  var lookX = 0, lookY = 0, t0 = 0, last = 0;
  var q = { w: 1, x: 0, y: 0, z: 0 };
  var seats = [], amp = [];
  var u = {};
  var BODIES = [
    { id: "core", x: 0, y: 0, z: 0, r: 1, kind: "core" },
    { id: "hear", x: 1.18, y: 0.22, z: 0.42, r: 0.38, kind: "sat" },
    { id: "see", x: -0.92, y: 0.58, z: -0.62, r: 0.26, kind: "sat" }
  ];

  var VS = [
    "#version 300 es",
    "layout(location=0) in vec2 a;",
    "out vec2 v;",
    "void main(){ v=a; gl_Position=vec4(a,0.0,1.0); }"
  ].join("\n");

  var FS = [
    "#version 300 es",
    "precision highp float;",
    "in vec2 v;",
    "out vec4 o;",
    "uniform vec2 uRes;",
    "uniform float uTime,uEnergy,uSpeak,uListen;",
    "uniform vec2 uLook;",
    "uniform vec4 uQ;",
    "vec3 qrot(vec4 q, vec3 p){",
    "  return p+2.0*cross(q.xyz,cross(q.xyz,p)+q.w*p);",
    "}",
    "float sph(vec3 p, vec3 c, float r){ return length(p-c)-r; }",
    "vec4 scene(vec3 p){",
    "  vec3 a=qrot(uQ,vec3(0.0,0.0,0.0));",
    "  vec3 b=qrot(uQ,vec3(1.18,0.22,0.42));",
    "  vec3 c=qrot(uQ,vec3(-0.92,0.58,-0.62));",
    "  float re=0.62+uEnergy*0.08;",
    "  float d0=sph(p,a,re);",
    "  float d1=sph(p,b,0.24+uEnergy*0.04);",
    "  float d2=sph(p,c,0.17);",
    "  float d=d0; float id=0.0;",
    "  if(d1<d){d=d1;id=1.0;} if(d2<d){d=d2;id=2.0;}",
    "  return vec4(d,id,0.0,0.0);",
    "}",
    "vec3 nrm(vec3 p){",
    "  vec2 e=vec2(0.002,0.0);",
    "  return normalize(vec3(",
    "    scene(p+e.xyy).x-scene(p-e.xyy).x,",
    "    scene(p+e.yxy).x-scene(p-e.yxy).x,",
    "    scene(p+e.yyx).x-scene(p-e.yyx).x));",
    "}",
    "void main(){",
    "  vec2 uv=(v*vec2(uRes.x/uRes.y,1.0));",
    "  vec3 ro=vec3(uLook.x*0.35,uLook.y*0.28,3.15);",
    "  vec3 rd=normalize(vec3(uv*0.92,-1.35));",
    "  float t=0.0; vec4 hit=vec4(1e3,0.0,0.0,0.0);",
    "  for(int i=0;i<48;i++){",
    "    vec4 s=scene(ro+rd*t);",
    "    if(s.x<0.002){hit=vec4(t,s.y,0.0,1.0); break;}",
    "    t+=s.x; if(t>8.0) break;",
    "  }",
    "  vec3 bg=vec3(0.02,0.03,0.06)*0.0;",
    "  if(hit.w<0.5){ o=vec4(bg,0.0); return; }",
    "  vec3 p=ro+rd*hit.x; vec3 n=nrm(p);",
    "  vec3 l=normalize(vec3(-0.4,0.7,0.6));",
    "  float diff=max(0.0,dot(n,l));",
    "  float spec=pow(max(0.0,dot(reflect(-l,n),-rd)),24.0);",
    "  vec3 core=mix(vec3(0.22,0.74,0.97), vec3(1.0,0.72,0.02), uSpeak);",
    "  core=mix(core, vec3(0.20,0.83,0.60), uListen*(1.0-uSpeak));",
    "  vec3 sat=vec3(0.65,0.55,0.98);",
    "  vec3 col=hit.y<0.5?core:sat;",
    "  col=col*(0.22+0.78*diff)+vec3(1.0)*spec*0.35;",
    "  col+=core*uEnergy*0.18;",
    "  float rim=pow(1.0-max(0.0,dot(n,-rd)),2.2);",
    "  col+=mix(vec3(0.3,0.7,1.0),vec3(1.0,0.8,0.2),uSpeak)*rim*0.45;",
    "  o=vec4(col,0.96);",
    "}"
  ].join("\n");

  function qmul(a, b) {
    return {
      w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
      x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
      y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
      z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
    };
  }
  function qaxis(ax, ay, az, th) {
    var n = Math.sqrt(ax * ax + ay * ay + az * az) || 1;
    var s = Math.sin(th * 0.5);
    return { w: Math.cos(th * 0.5), x: (ax / n) * s, y: (ay / n) * s, z: (az / n) * s };
  }
  function qrot(v) {
    var p = { w: 0, x: v.x, y: v.y, z: v.z };
    var c = { w: q.w, x: -q.x, y: -q.y, z: -q.z };
    var r = qmul(qmul(q, p), c);
    return { x: r.x, y: r.y, z: r.z };
  }
  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      try { console.warn("IrisSphere shader", gl.getShaderInfoLog(sh)); } catch (e) {}
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }
  function bootGL() {
    try {
      gl = canvas.getContext("webgl2", { alpha: true, antialias: true, premultipliedAlpha: false });
    } catch (e) { gl = null; }
    if (!gl) return false;
    var vs = compile(gl.VERTEX_SHADER, VS);
    var fs = compile(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return false;
    prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    function loc(n) { return gl.getUniformLocation(prog, n); }
    u = {
      res: loc("uRes"), time: loc("uTime"), energy: loc("uEnergy"),
      speak: loc("uSpeak"), listen: loc("uListen"), look: loc("uLook"), q: loc("uQ")
    };
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    mode = "webgl2";
    return true;
  }
  function mkSeats() {
    seats = []; amp = [];
    var i, a, y, r;
    for (i = 0; i < 48; i++) {
      a = (i / 48) * Math.PI * 2;
      y = 1 - (2 * ((i + 0.5) / 48));
      r = Math.sqrt(Math.max(0, 1 - y * y));
      seats.push({ x: Math.cos(a) * r, y: y, z: Math.sin(a) * r, i: i });
      amp.push(0);
    }
  }
  function size() {
    if (!canvas) return;
    var parent = canvas.parentElement || canvas;
    var wdt = parent.clientWidth || canvas.clientWidth || 180;
    var hgt = parent.clientHeight || canvas.clientHeight || 180;
    if (hgt < 80) hgt = wdt;
    var dpr = Math.min(w.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(wdt * dpr);
    canvas.height = Math.floor(hgt * dpr);
    canvas.style.width = wdt + "px";
    canvas.style.height = hgt + "px";
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
  }
  function tapWave() {
    if (!w.DSAP || !DSAP.wave) return;
    var bins = DSAP.wave();
    if (!bins || !bins.length) return;
    var i, sum = 0, d;
    for (i = 0; i < bins.length; i++) {
      d = Math.abs(bins[i] - 128) / 128;
      sum += d;
      amp[i % 48] = Math.max(amp[i % 48] || 0, d);
    }
    energy = Math.max(0.14, Math.min(1, (sum / bins.length) * 2.4));
  }
  function stepQ(dt) {
    if (reduced) return;
    var spin = 0.42 + energy * 0.9;
    q = qmul(q, qaxis(0.16, 1, 0.22, spin * dt));
    q = qmul(q, qaxis(0.7, 0.1, 0.3, 0.12 * dt));
    if (lookX || lookY) q = qmul(qaxis(1, 0, 0, lookY * 0.014), qmul(qaxis(0, 1, 0, lookX * 0.018), q));
  }
  function drawGL(now) {
    if (!gl || !prog) return;
    tapWave();
    var t = t0 ? (now - t0) / 1000 : 0;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1f(u.time, t);
    gl.uniform1f(u.energy, energy);
    gl.uniform1f(u.speak, speaking ? 1 : 0);
    gl.uniform1f(u.listen, listening ? 1 : 0);
    gl.uniform2f(u.look, lookX, lookY);
    gl.uniform4f(u.q, q.x, q.y, q.z, q.w);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function project(v, cx, cy, R) {
    var zc = 2.35;
    var s = zc / (zc - v.z);
    return { x: cx + v.x * R * s, y: cy + v.y * R * 0.9 * s, z: v.z, s: s };
  }
  function drawBall(p, radius, kind) {
    var depth = (p.z + 1) * 0.5;
    var hx = p.x - radius * 0.32;
    var hy = p.y - radius * 0.38;
    var glow = ctx.createRadialGradient(p.x, p.y + radius * 0.15, radius * 0.2, p.x, p.y, radius * 2.1);
    glow.addColorStop(0, kind === "core"
      ? (speaking ? "rgba(255,183,3,0.28)" : "rgba(56,189,248,0.2)")
      : "rgba(167,139,250,0.16)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * 2.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(p.x + radius * 0.08, p.y + radius * 0.72, radius * 0.72, radius * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0," + (0.18 + (1 - depth) * 0.22) + ")";
    ctx.fill();
    var body = ctx.createRadialGradient(hx, hy, radius * 0.08, p.x, p.y, radius);
    if (kind === "core") {
      if (speaking) {
        body.addColorStop(0, "rgba(255,244,210,0.98)");
        body.addColorStop(0.35, "rgba(255,196,64,0.95)");
        body.addColorStop(1, "rgba(40,16,4,0.96)");
      } else if (listening) {
        body.addColorStop(0, "rgba(220,255,236,0.96)");
        body.addColorStop(0.4, "rgba(52,211,153,0.9)");
        body.addColorStop(1, "rgba(6,40,28,0.95)");
      } else {
        body.addColorStop(0, "rgba(236,248,255,0.96)");
        body.addColorStop(0.38, "rgba(56,189,248,0.88)");
        body.addColorStop(1, "rgba(8,16,42,0.96)");
      }
    } else {
      body.addColorStop(0, "rgba(246,240,255,0.95)");
      body.addColorStop(0.45, "rgba(167,139,250,0.82)");
      body.addColorStop(1, "rgba(24,12,48,0.94)");
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hx, hy, radius * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255," + (0.18 + depth * 0.22) + ")";
    ctx.fill();
  }
  function draw2d() {
    if (!ctx || !canvas) return;
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    var cx = W * 0.5, cy = H * 0.5;
    var R = Math.min(W, H) * (0.28 + energy * 0.04);
    var worlds = [], i, b, v, p;
    for (i = 0; i < BODIES.length; i++) {
      b = BODIES[i];
      v = qrot({ x: b.x, y: b.y, z: b.z });
      p = project(v, cx, cy, R);
      worlds.push({ kind: b.kind, r: b.r * R * p.s, p: p, z: v.z });
    }
    worlds.sort(function (a, c) { return a.z - c.z; });
    for (i = 0; i < worlds.length; i++) drawBall(worlds[i].p, worlds[i].r, worlds[i].kind);
  }
  function draw(now) {
    raf = w.requestAnimationFrame(draw);
    if (!canvas) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    if (!t0) t0 = now;
    tapWave();
    stepQ(dt);
    if (mode === "webgl2") drawGL(now);
    else draw2d();
  }
  function mount(target) {
    reduced = !!(w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) return null;
    canvas = host.tagName === "CANVAS" ? host : host.querySelector("canvas") || document.createElement("canvas");
    canvas.id = canvas.id || "iris-sphere";
    canvas.className = (canvas.className + " iris-sphere-plate").trim();
    canvas.setAttribute("aria-label", "Iris three-sphere cluster");
    if (canvas.parentNode !== host && host.tagName !== "CANVAS") {
      host.innerHTML = "";
      host.appendChild(canvas);
    }
    mkSeats();
    if (!bootGL()) {
      gl = null;
      ctx = canvas.getContext("2d", { alpha: true });
      mode = "canvas2d";
    }
    size();
    w.addEventListener("resize", size);
    if (!raf) raf = w.requestAnimationFrame(draw);
    return canvas;
  }
  function lookAt(x, y) {
    lookX = Math.max(-1, Math.min(1, x || 0));
    lookY = Math.max(-1, Math.min(1, y || 0));
  }
  w.IrisSphere = {
    version: VERSION,
    cluster: 3,
    mount: mount,
    pose: function () { return { w: q.w, x: q.x, y: q.y, z: q.z, cluster: 3, mode: mode }; },
    mode: function () { return mode; },
    setEnergy: function (n) { energy = Math.max(0, Math.min(1, n)); },
    setSpeaking: function (on) { speaking = !!on; if (speaking) energy = Math.max(energy, 0.55); },
    setListening: function (on) { listening = !!on; },
    setWoken: function (on) { woken = !!on; },
    lookAt: lookAt,
    pulse: function (i) { i = ((i % 48) + 48) % 48; amp[i] = 1; amp[(i + 8) % 48] = Math.max(amp[(i + 8) % 48], 0.45); },
    canvas: function () { return canvas; }
  };
})(window);
