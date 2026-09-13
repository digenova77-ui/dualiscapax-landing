/* DualisCapax bore engine — dual-pipe fly-through.
 * Friction finds holes. Affinity binds. Smash to one.
 */
(function () {
  var canvas = document.getElementById("bore");
  var streamEl = document.getElementById("iris-stream");
  var probeEl = document.getElementById("iris-probe");
  var portsEl = document.getElementById("ports");
  var readZ = document.getElementById("read-z");
  var readPhase = document.getElementById("read-phase");
  var readStation = document.getElementById("read-station");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var STATIONS = [
    { id: "sec-01", code: "01", name: "Pharma primes", z: 14 },
    { id: "sec-02", code: "02", name: "School boards", z: 22 },
    { id: "sec-03", code: "03", name: "Municipal / utility", z: 30 },
    { id: "sec-04", code: "04", name: "Athletic telemetry", z: 38 },
    { id: "sec-05", code: "05", name: "Food service logistics", z: 46 },
    { id: "sec-06", code: "06", name: "Industrial SCADA", z: 54 },
    { id: "sec-07", code: "07", name: "Corporate counsel", z: 62 },
    { id: "sec-08", code: "08", name: "Air-gapped defense", z: 70 },
    { id: "sec-09", code: "09", name: "Healthcare networks", z: 78 },
    { id: "sec-10", code: "10", name: "SR&ED / grants", z: 86 }
  ];
  var LOOP = 96;

  var state = {
    z: 0.15,
    speed: reduced ? 0 : 4.8,
    lookX: 0,
    lookY: 0,
    t: 0,
    station: null,
    phase: "MOUTH"
  };

  function log(obj) {
    if (!streamEl) return;
    try { streamEl.textContent = JSON.stringify(obj); } catch (e) {}
  }

  function phaseOf(z) {
    var u = z % LOOP;
    if (u < 8) return "MOUTH";
    if (u < 40) return "DUAL";
    if (u < 52) return "SMASH";
    return "ONE";
  }

  function nearestStation(z) {
    var u = z % LOOP;
    var best = STATIONS[0];
    var d = 1e9;
    for (var i = 0; i < STATIONS.length; i++) {
      var dd = Math.abs(STATIONS[i].z - u);
      if (dd < d) { d = dd; best = STATIONS[i]; }
    }
    return d < 3.2 ? best : null;
  }

  function paintStation(sec, src) {
    state.station = sec;
    document.querySelectorAll(".port").forEach(function (el) {
      el.classList.toggle("on", !!(sec && el.getAttribute("data-id") === sec.id));
    });
    document.querySelectorAll(".iris-probe button").forEach(function (el) {
      el.classList.toggle("on", !!(sec && el.getAttribute("data-id") === sec.id));
    });
    if (readStation) readStation.textContent = sec ? (sec.code + " " + sec.name) : "— mouth";
    log({ t: Date.now(), src: src || "bore", phase: state.phase, z: +state.z.toFixed(2), station: sec ? sec.code : "MOUTH", access: "CLOSED", earned_cad: 0 });
  }

  function flyTo(sec) {
    if (!sec) return;
    var u = state.z % LOOP;
    var target = sec.z;
    if (target < u - 2) target += LOOP;
    state.z += (target - u);
    state.speed = reduced ? 0 : 2.2;
    paintStation(sec, "port");
    try { history.replaceState(null, "", "#" + sec.id); } catch (e) {}
  }

  STATIONS.forEach(function (sec) {
    if (portsEl) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "port";
      b.setAttribute("data-id", sec.id);
      b.innerHTML = "<b>" + sec.name + "</b><span class=\"tag\">SEC-" + sec.code + " · z " + sec.z + "</span>";
      b.addEventListener("click", function () { flyTo(sec); });
      portsEl.appendChild(b);
    }
    if (probeEl) {
      var p = document.createElement("button");
      p.type = "button";
      p.setAttribute("data-id", sec.id);
      p.textContent = sec.code;
      p.title = sec.name;
      p.addEventListener("click", function () { flyTo(sec); });
      probeEl.appendChild(p);
    }
  });

  var look = document.getElementById("door-look");
  var desks = document.getElementById("door-desks");
  if (look) look.addEventListener("click", function () { location.href = "playground.html"; });
  if (desks) desks.addEventListener("click", function () {
    var m = document.getElementById("matrix");
    if (m) m.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  });

  if (!canvas || reduced) {
    log({ t: Date.now(), src: "boot", phase: "STILL", access: "CLOSED", earned_cad: 0, motion: "reduced" });
    paintStation(null, "boot");
    if (!canvas) return;
  }

  var gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" })
         || canvas.getContext("experimental-webgl");
  if (!gl) {
    log({ t: Date.now(), src: "boot", err: "NO_WEBGL", access: "CLOSED" });
    return;
  }

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  var VS = [
    "attribute vec2 a;",
    "void main(){ gl_Position = vec4(a,0.0,1.0); }"
  ].join("\n");

  var FS = [
    "precision highp float;",
    "uniform vec2  uR;",
    "uniform float uT;",
    "uniform float uZ;",
    "uniform vec2  uLook;",
    "uniform float uSmash;",
    "",
    "float hash(vec3 p){",
    "  p = fract(p * 0.3183099 + vec3(0.1,0.2,0.3));",
    "  p *= 17.0;",
    "  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));",
    "}",
    "float noise(vec3 x){",
    "  vec3 i = floor(x); vec3 f = fract(x);",
    "  f = f*f*(3.0-2.0*f);",
    "  return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),",
    "                 mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),",
    "             mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),",
    "                 mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);",
    "}",
    "mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }",
    "float smin(float a, float b, float k){",
    "  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);",
    "  return mix(b, a, h) - k * h * (1.0 - h);",
    "}",
    "",
    "float sepAt(float z){",
    "  float u = mod(z, 96.0);",
    "  float dual = 1.0 - smoothstep(36.0, 50.0, u);",
    "  dual *= 1.0 - smoothstep(8.0, 0.0, u);",
    "  return 0.92 * dual;",
    "}",
    "",
    "vec2 map(vec3 p){",
    "  float z = p.z;",
    "  float twist = z * 0.28;",
    "  vec2 q = rot(twist) * p.xy;",
    "  float sep = sepAt(z);",
    "  vec2 aPos = vec2(sep, 0.0);",
    "  vec2 bPos = vec2(-sep, 0.0);",
    "  float ra = 0.58 + 0.04 * sin(z * 0.7 + uT * 0.6);",
    "  float dA = length(q - aPos) - ra;",
    "  float dB = length(q - bPos) - ra;",
    "  float voidd = smin(dA, dB, 0.22 + 0.12 * (1.0 - sep));",
    "  float ribs = 0.018 * smoothstep(0.12, 0.0, abs(fract(z * 0.22) - 0.5));",
    "  float bolts = 0.0;",
    "  float ang = atan(q.y, q.x);",
    "  float ba = abs(fract((ang / 6.28318) * 10.0) - 0.5);",
    "  bolts = 0.012 * smoothstep(0.08, 0.0, ba) * smoothstep(0.12, 0.0, abs(fract(z * 0.22) - 0.5));",
    "  float wall = -voidd - 0.002 + ribs + bolts;",
    "  float which = dA < dB ? 1.0 : 2.0;",
    "  if (sep < 0.12) which = 3.0;",
    "  return vec2(wall, which);",
    "}",
    "",
    "vec3 nrm(vec3 p){",
    "  vec2 e = vec2(0.0016, 0.0);",
    "  return normalize(vec3(",
    "    map(p+e.xyy).x - map(p-e.xyy).x,",
    "    map(p+e.yxy).x - map(p-e.yxy).x,",
    "    map(p+e.yyx).x - map(p-e.yyx).x",
    "  ));",
    "}",
    "",
    "float drip(vec3 p){",
    "  float zc = floor(p.z * 0.35);",
    "  float id = hash(vec3(zc, 2.1, 7.7));",
    "  float fall = fract(uT * 0.17 + id);",
    "  vec2 q = rot(p.z * 0.28) * p.xy;",
    "  vec2 pos = vec2(0.0, 0.42 - fall * 0.95);",
    "  pos.x += (id - 0.5) * 0.5;",
    "  return length(q - pos) - (0.012 + 0.01 * (1.0 - fall));",
    "}",
    "",
    "void main(){",
    "  vec2 uv = (gl_FragCoord.xy - 0.5 * uR) / uR.y;",
    "  vec3 ro = vec3(uLook.x * 0.18, uLook.y * 0.12, uZ);",
    "  vec3 rd = normalize(vec3(uv + uLook * 0.12, 1.35));",
    "  float t = 0.0; float hit = 0.0; vec2 h = vec2(1.0, 0.0);",
    "  for (int i = 0; i < 56; i++){",
    "    vec3 p = ro + rd * t;",
    "    h = map(p);",
    "    float dd = min(h.x, drip(p));",
    "    if (dd < 0.0014){ hit = 1.0; break; }",
    "    t += clamp(abs(dd), 0.012, 0.28);",
    "    if (t > 18.0) break;",
    "  }",
    "  vec3 col = vec3(0.012, 0.02, 0.04);",
    "  vec3 p = ro + rd * t;",
    "  if (hit > 0.5){",
    "    vec3 n = nrm(p);",
    "    vec3 l1 = normalize(vec3(0.25, 0.55, 0.7));",
    "    vec3 l2 = normalize(vec3(-0.4, 0.1, 0.5));",
    "    float nd = max(0.0, dot(n, l1));",
    "    float sp = pow(max(0.0, dot(reflect(-l1, n), -rd)), 28.0);",
    "    float rim = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);",
    "    vec3 metal = vec3(0.07, 0.10, 0.14);",
    "    vec3 A = vec3(0.12, 0.32, 0.78);",
    "    vec3 B = vec3(0.48, 0.68, 0.76);",
    "    vec3 C = vec3(0.07, 0.62, 0.46);",
    "    vec3 pipe = h.y < 1.5 ? A : (h.y < 2.5 ? B : C);",
    "    float wet = 0.35 + 0.65 * noise(p * 3.2);",
    "    col = metal + pipe * (0.22 + 0.55 * nd) * wet;",
    "    col += vec3(0.75, 0.85, 1.0) * sp * 0.45;",
    "    col += pipe * rim * 0.35;",
    "    col += C * uSmash * rim * 0.55;",
    "    if (drip(p) < 0.02) col += vec3(0.55, 0.85, 1.0) * 0.35;",
    "    float fog = 1.0 - exp(-t * 0.13);",
    "    vec3 bore = mix(A, C, uSmash) * 0.08;",
    "    col = mix(col, bore, fog);",
    "  } else {",
    "    float glow = 0.04 / (0.18 + dot(uv, uv));",
    "    col += mix(vec3(0.05, 0.16, 0.42), vec3(0.04, 0.35, 0.26), uSmash) * glow;",
    "  }",
    "  float vig = smoothstep(1.35, 0.18, length(uv));",
    "  col *= vig;",
    "  col = pow(max(col, 0.0), vec3(0.92));",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  var vs = compile(gl.VERTEX_SHADER, VS);
  var fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, "a");
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  var uR = gl.getUniformLocation(prog, "uR");
  var uT = gl.getUniformLocation(prog, "uT");
  var uZ = gl.getUniformLocation(prog, "uZ");
  var uLook = gl.getUniformLocation(prog, "uLook");
  var uSmash = gl.getUniformLocation(prog, "uSmash");

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    var cap = w < 700 ? 0.62 : 0.82;
    canvas.width = Math.max(2, Math.floor(w * dpr * cap));
    canvas.height = Math.max(2, Math.floor(h * dpr * cap));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener("resize", resize);

  var dragging = false, lx = 0, ly = 0;
  canvas.addEventListener("pointerdown", function (e) {
    dragging = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointerup", function () { dragging = false; });
  canvas.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    state.lookX += (e.clientX - lx) * 0.003;
    state.lookY += (e.clientY - ly) * 0.003;
    state.lookX = Math.max(-1.2, Math.min(1.2, state.lookX));
    state.lookY = Math.max(-0.8, Math.min(0.8, state.lookY));
    lx = e.clientX; ly = e.clientY;
  });
  window.addEventListener("wheel", function (e) {
    if (reduced) return;
    state.speed = Math.max(0.4, Math.min(14, state.speed + (e.deltaY > 0 ? 0.35 : -0.35)));
  }, { passive: true });

  var last = performance.now();
  var lastHud = 0;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    state.t += dt;
    if (!reduced) state.z += state.speed * dt;
    state.phase = phaseOf(state.z);
    var smash = state.phase === "SMASH" || state.phase === "ONE" ? (state.phase === "ONE" ? 1 : 0.55) : 0.05;
    var st = nearestStation(state.z);
    if (st !== state.station) paintStation(st, "ring");

    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uT, state.t);
    gl.uniform1f(uZ, state.z);
    gl.uniform2f(uLook, state.lookX, state.lookY);
    gl.uniform1f(uSmash, smash);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (now - lastHud > 180) {
      lastHud = now;
      if (readZ) readZ.textContent = "z " + (state.z % LOOP).toFixed(1);
      if (readPhase) readPhase.textContent = state.phase;
    }
    requestAnimationFrame(frame);
  }

  var raw = (location.hash || "").replace(/^#/, "").toLowerCase();
  if (raw) {
    for (var i = 0; i < STATIONS.length; i++) {
      if (STATIONS[i].id === raw) { flyTo(STATIONS[i]); break; }
    }
  } else {
    paintStation(null, "boot");
  }
  log({ t: Date.now(), src: "boot", phase: "MOUTH", access: "CLOSED", earned_cad: 0, engine: "bore-sdf" });
  requestAnimationFrame(frame);
})();
