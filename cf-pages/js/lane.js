/* DualisCapax lane — max 3D dual-pipe fly-through + desks + haptic + audio.
 * Friction and affinity start together. Smash to one. House first. Equal desks.
 */
(function () {
  var canvas = document.getElementById("bore");
  var streamEl = document.getElementById("iris-stream");
  var probeEl = document.getElementById("iris-probe");
  var cardsEl = document.getElementById("cards");
  var modal = document.getElementById("modal");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var SECTORS = [
    {id:"sec-01",code:"01",name:"Pharma primes",z:14,img:"https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",thesis:"Trial and reactor telemetry in. Yield and thermal offset next. Audit last.",steps:[["Days 1-15","Ingress and baseline."],["Days 16-45","Yield load-balance."],["Days 46-75","Thermal peak-shave."],["Days 76-90","Regulatory audit."]]},
    {id:"sec-02",code:"02",name:"School boards",z:22,img:"https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",thesis:"Dispatch and meters in. Routes and HVAC next. Trustee audit last.",steps:[["Days 1-15","Dispatch and meter ingest."],["Days 16-45","Bus route optimization."],["Days 46-75","HVAC setback."],["Days 76-90","Trustee audit."]]},
    {id:"sec-03",code:"03",name:"Municipal / utility",z:30,img:"https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80",thesis:"SCADA in. Off-peak pumping next. Treasury audit last.",steps:[["Days 1-15","SCADA ingest."],["Days 16-45","Off-peak pumping."],["Days 46-75","Transformer cycles."],["Days 76-90","Treasury audit."]]},
    {id:"sec-04",code:"04",name:"Athletic telemetry",z:38,img:"https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",thesis:"Load in. Fatigue balance next. Zero-PII audit last.",steps:[["Days 1-15","Training-load ingest."],["Days 16-45","Fatigue balance."],["Days 46-75","Chiller stagger."],["Days 76-90","Zero-PII audit."]]},
    {id:"sec-05",code:"05",name:"Food service",z:46,img:"https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80",thesis:"POS and meters in. Staging next. CPA audit last.",steps:[["Days 1-15","POS and meter ingest."],["Days 16-45","Labor staging."],["Days 46-75","Oven peak-shave."],["Days 76-90","CPA audit."]]},
    {id:"sec-06",code:"06",name:"Industrial SCADA",z:54,img:"https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1200&q=80",thesis:"Vibration in. Wear next. Plant audit last.",steps:[["Days 1-15","Sensor ingest."],["Days 16-45","Wear balance."],["Days 46-75","Compressor stagger."],["Days 76-90","Plant audit."]]},
    {id:"sec-07",code:"07",name:"Corporate counsel",z:62,img:"https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",thesis:"Contracts in. Drift next. GC audit last.",steps:[["Days 1-15","Repository ingest."],["Days 16-45","Clause drift."],["Days 46-75","Fee optimization."],["Days 76-90","GC audit."]]},
    {id:"sec-08",code:"08",name:"Air-gapped defense",z:70,img:"https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",thesis:"Air-gap ledger in. State checks next. Procurement audit last.",steps:[["Days 1-15","Ledger validation."],["Days 16-45","State checks."],["Days 46-75","Thermal suppress."],["Days 76-90","Procurement audit."]]},
    {id:"sec-09",code:"09",name:"Healthcare networks",z:78,img:"https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",thesis:"Bed and device ingest. Suite balance next. Board audit last.",steps:[["Days 1-15","Telemetry ingest."],["Days 16-45","Suite load-balance."],["Days 46-75","Peak shave."],["Days 76-90","Board audit."]]},
    {id:"sec-10",code:"10",name:"SR&ED / grants",z:86,img:"https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",thesis:"Timesheets in. Categorize next. Contingency filing last.",steps:[["Days 1-15","Timesheet ingest."],["Days 16-45","Activity categorize."],["Days 46-75","Discrepancy audit."],["Days 76-90","Contingency filing."]]}
  ];
  var LOOP = 96;

  var state = { z: 0.2, speed: reduced ? 0 : 5.4, lookX: 0, lookY: 0, fov: 1.28, t: 0, station: null, phase: "MOUTH", zoom: 0 };
  var lastStation = "";

  function log(obj) { if (streamEl) try { streamEl.textContent = JSON.stringify(obj); } catch (e) {} }
  function phaseOf(z) {
    var u = z % LOOP;
    if (u < 8) return "MOUTH";
    if (u < 40) return "DUAL";
    if (u < 52) return "SMASH";
    return "ONE";
  }
  function nearest(z) {
    var u = z % LOOP, best = null, d = 1e9;
    for (var i = 0; i < SECTORS.length; i++) {
      var dd = Math.abs(SECTORS[i].z - u);
      if (dd < d) { d = dd; best = SECTORS[i]; }
    }
    return d < 2.8 ? best : null;
  }
  function buzz(pat) {
    if (reduced || !navigator.vibrate) return;
    try { navigator.vibrate(pat); } catch (e) {}
  }

  var audio = { ctx: null, ready: false, f: null, a: null, rumble: null, gain: null };
  function bootAudio() {
    if (audio.ready || reduced) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      audio.ctx = new AC();
      var master = audio.ctx.createGain();
      master.gain.value = 0.07;
      master.connect(audio.ctx.destination);
      audio.gain = master;
      function drone(freq, type, pan) {
        var o = audio.ctx.createOscillator();
        var g = audio.ctx.createGain();
        var p = audio.ctx.createStereoPanner();
        o.type = type; o.frequency.value = freq;
        g.gain.value = 0.22; p.pan.value = pan;
        o.connect(g); g.connect(p); p.connect(master);
        o.start();
        return { o: o, g: g, p: p };
      }
      audio.f = drone(98, "sawtooth", -0.55);
      audio.a = drone(146.8, "triangle", 0.55);
      audio.rumble = drone(42, "sine", 0);
      audio.rumble.g.gain.value = 0.12;
      audio.ready = true;
      if (audio.ctx.state === "suspended") audio.ctx.resume();
    } catch (e) {}
  }
  function ping() {
    if (!audio.ready || !audio.ctx) return;
    var o = audio.ctx.createOscillator();
    var g = audio.ctx.createGain();
    o.type = "sine"; o.frequency.value = 660;
    g.gain.setValueAtTime(0.0001, audio.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, audio.ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.ctx.currentTime + 0.28);
    o.connect(g); g.connect(audio.gain);
    o.start(); o.stop(audio.ctx.currentTime + 0.3);
  }
  function driveAudio() {
    if (!audio.ready) return;
    var smash = state.phase === "SMASH" || state.phase === "ONE";
    try {
      audio.f.o.frequency.setTargetAtTime(smash ? 110 : 98, audio.ctx.currentTime, 0.2);
      audio.a.o.frequency.setTargetAtTime(smash ? 165 : 146.8, audio.ctx.currentTime, 0.2);
      audio.gain.gain.setTargetAtTime(smash ? 0.1 : 0.07, audio.ctx.currentTime, 0.15);
    } catch (e) {}
  }

  function paintStation(sec, src) {
    state.station = sec;
    document.querySelectorAll(".card").forEach(function (el) {
      el.classList.toggle("on", !!(sec && el.getAttribute("data-id") === sec.id));
    });
    document.querySelectorAll(".iris-probe button").forEach(function (el) {
      el.classList.toggle("on", !!(sec && el.getAttribute("data-id") === sec.id));
    });
    var rs = document.getElementById("read-station");
    if (rs) rs.textContent = sec ? (sec.code + " " + sec.name) : "— mouth";
    log({ t: Date.now(), src: src || "bore", phase: state.phase, z: +state.z.toFixed(2), station: sec ? sec.code : "MOUTH", access: "CLOSED", earned_cad: 0 });
    if (sec && sec.id !== lastStation) {
      lastStation = sec.id;
      buzz([18, 40, 28]);
      ping();
    }
    if (!sec) lastStation = "";
  }
  function flyTo(sec) {
    if (!sec) return;
    var u = state.z % LOOP;
    var target = sec.z;
    if (target < u - 2) target += LOOP;
    state.z += (target - u);
    state.speed = reduced ? 0 : 2.4;
    state.zoom = 0.55;
    paintStation(sec, "desk");
    try { history.replaceState(null, "", "#" + sec.id); } catch (e) {}
  }
  function openModal() {
    if (!modal) return;
    if (!state.station) {
      var m = document.getElementById("matrix");
      if (m) m.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      return;
    }
    var k = document.getElementById("modal-kicker");
    var t = document.getElementById("modal-title");
    var ol = document.getElementById("steps");
    if (k) k.textContent = "SEC-" + state.station.code + " · 90-day binding pilot";
    if (t) t.textContent = "Four-step onboarding — " + state.station.name;
    if (ol) {
      ol.innerHTML = "";
      state.station.steps.forEach(function (st, i) {
        var li = document.createElement("li");
        li.innerHTML = "<strong>Step " + (i + 1) + " · " + st[0] + "</strong><span>" + st[1] + "</span>";
        ol.appendChild(li);
      });
    }
    modal.hidden = false;
    buzz(12);
  }

  SECTORS.forEach(function (sec) {
    if (cardsEl) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "card"; b.setAttribute("data-id", sec.id);
      b.innerHTML = "<img src=\"" + sec.img + "\" alt=\"\"/><b>" + sec.name + "</b><span>SEC-" + sec.code + " · z " + sec.z + "</span>";
      b.addEventListener("click", function () { flyTo(sec); });
      cardsEl.appendChild(b);
    }
    if (probeEl) {
      var p = document.createElement("button");
      p.type = "button"; p.setAttribute("data-id", sec.id); p.textContent = sec.code; p.title = sec.name;
      p.addEventListener("click", function () { flyTo(sec); });
      probeEl.appendChild(p);
    }
  });

  var look = document.getElementById("door-look");
  var desks = document.getElementById("door-desks");
  var onboard = document.getElementById("door-onboard");
  if (look) look.addEventListener("click", function () { location.href = "playground.html"; });
  if (desks) desks.addEventListener("click", function () {
    var m = document.getElementById("matrix");
    if (m) m.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  });
  if (onboard) onboard.addEventListener("click", openModal);
  var mx = document.getElementById("modal-x");
  if (mx) mx.addEventListener("click", function () { modal.hidden = true; });
  if (modal) modal.addEventListener("click", function (e) { if (e.target === modal) modal.hidden = true; });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal) modal.hidden = true; });

  if (!canvas) {
    log({ t: Date.now(), src: "boot", err: "NO_CANVAS", access: "CLOSED" });
    return;
  }

  var gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" })
        || canvas.getContext("experimental-webgl");
  if (!gl) {
    log({ t: Date.now(), src: "boot", err: "NO_WEBGL", access: "CLOSED" });
    canvas.style.display = "none";
    return;
  }

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(sh)); return null; }
    return sh;
  }

  var VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}";
  var FS = [
    "precision highp float;",
    "uniform vec2 uR; uniform float uT; uniform float uZ; uniform vec2 uLook;",
    "uniform float uSmash; uniform float uFov; uniform float uRing;",
    "float hash(vec3 p){p=fract(p*0.3183099+vec3(.1,.2,.3));p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}",
    "float noise(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}",
    "mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}",
    "float smin(float a,float b,float k){float h=clamp(0.5+0.5*(b-a)/k,0.0,1.0);return mix(b,a,h)-k*h*(1.0-h);}",
    "float sepAt(float z){float u=mod(z,96.0);float dual=1.0-smoothstep(36.0,50.0,u);dual*=1.0-smoothstep(8.0,0.0,u);return 0.98*dual;}",
    "float ringField(float z){float u=mod(z,96.0);float d=100.0;float rs[10];rs[0]=14.0;rs[1]=22.0;rs[2]=30.0;rs[3]=38.0;rs[4]=46.0;rs[5]=54.0;rs[6]=62.0;rs[7]=70.0;rs[8]=78.0;rs[9]=86.0;for(int i=0;i<10;i++){d=min(d,abs(u-rs[i]));}return d;}",
    "vec2 map(vec3 p){",
    "  float twist=p.z*0.34+uT*0.08;",
    "  vec2 q=rot(twist)*p.xy;",
    "  float sep=sepAt(p.z);",
    "  float ra=0.56+0.035*sin(p.z*0.85+uT*0.7);",
    "  float dA=length(q-vec2(sep,0.0))-ra;",
    "  float dB=length(q-vec2(-sep,0.0))-ra;",
    "  float voidd=smin(dA,dB,0.20+0.16*(1.0-sep));",
    "  float ribs=0.02*smoothstep(0.11,0.0,abs(fract(p.z*0.26)-0.5));",
    "  float ang=atan(q.y,q.x);",
    "  float ba=abs(fract((ang/6.28318)*12.0)-0.5);",
    "  float bolts=0.014*smoothstep(0.07,0.0,ba)*smoothstep(0.11,0.0,abs(fract(p.z*0.26)-0.5));",
    "  float rd=ringField(p.z);",
    "  float ring=0.03*smoothstep(0.55,0.0,rd)*smoothstep(0.22,0.08,length(q));",
    "  float wall=-voidd-0.002+ribs+bolts+ring;",
    "  float which=dA<dB?1.0:2.0; if(sep<0.12) which=3.0;",
    "  return vec2(wall,which);",
    "}",
    "vec3 nrm(vec3 p){vec2 e=vec2(0.0014,0.0);return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x,map(p+e.yxy).x-map(p-e.yxy).x,map(p+e.yyx).x-map(p-e.yyx).x));}",
    "float drip(vec3 p){float zc=floor(p.z*0.4);float id=hash(vec3(zc,2.1,7.7));float fall=fract(uT*0.19+id);vec2 q=rot(p.z*0.34)*p.xy;vec2 pos=vec2((id-0.5)*0.55,0.46-fall*1.05);return length(q-pos)-(0.011+0.01*(1.0-fall));}",
    "void main(){",
    "  vec2 uv=(gl_FragCoord.xy-0.5*uR)/uR.y;",
    "  vec3 ro=vec3(uLook.x*0.16,uLook.y*0.11,uZ);",
    "  vec3 rd=normalize(vec3(uv+uLook*0.10,uFov));",
    "  float t=0.0; float hit=0.0; vec2 h=vec2(1.0,0.0);",
    "  for(int i=0;i<72;i++){vec3 p=ro+rd*t;h=map(p);float dd=min(h.x,drip(p));if(dd<0.0012){hit=1.0;break;}t+=clamp(abs(dd),0.01,0.26);if(t>22.0)break;}",
    "  vec3 col=vec3(0.01,0.018,0.035); vec3 p=ro+rd*t;",
    "  if(hit>0.5){",
    "    vec3 n=nrm(p); vec3 l1=normalize(vec3(0.28,0.62,0.72));",
    "    float nd=max(0.0,dot(n,l1));",
    "    float sp=pow(max(0.0,dot(reflect(-l1,n),-rd)),32.0);",
    "    float rim=pow(1.0-max(0.0,dot(n,-rd)),3.2);",
    "    vec3 A=vec3(0.10,0.30,0.82); vec3 B=vec3(0.50,0.70,0.78); vec3 C=vec3(0.06,0.64,0.48);",
    "    vec3 pipe=h.y<1.5?A:(h.y<2.5?B:C);",
    "    float wet=0.32+0.68*noise(p*3.4);",
    "    col=vec3(0.06,0.08,0.12)+pipe*(0.20+0.58*nd)*wet;",
    "    col+=vec3(0.78,0.88,1.0)*sp*0.5; col+=pipe*rim*0.38; col+=C*uSmash*rim*0.62;",
    "    if(drip(p)<0.018) col+=vec3(0.55,0.88,1.0)*0.4;",
    "    if(ringField(p.z)<0.55) col+=vec3(0.2,0.9,0.6)*0.18*uRing;",
    "    float fog=1.0-exp(-t*0.11); col=mix(col,mix(A,C,uSmash)*0.07,fog);",
    "  } else {",
    "    float glow=0.045/(0.16+dot(uv,uv));",
    "    col+=mix(vec3(0.05,0.16,0.46),vec3(0.04,0.36,0.26),uSmash)*glow;",
    "  }",
    "  col*=smoothstep(1.4,0.16,length(uv));",
    "  col=pow(max(col,0.0),vec3(0.90));",
    "  gl_FragColor=vec4(col,1.0);",
    "}"
  ].join("\n");

  var vs = compile(gl.VERTEX_SHADER, VS);
  var fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, "a"); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return; }
  gl.useProgram(prog);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  var uR = gl.getUniformLocation(prog, "uR");
  var uT = gl.getUniformLocation(prog, "uT");
  var uZ = gl.getUniformLocation(prog, "uZ");
  var uLook = gl.getUniformLocation(prog, "uLook");
  var uSmash = gl.getUniformLocation(prog, "uSmash");
  var uFov = gl.getUniformLocation(prog, "uFov");
  var uRing = gl.getUniformLocation(prog, "uRing");

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    var cap = w < 700 ? 0.68 : 0.92;
    canvas.width = Math.max(2, Math.floor(w * dpr * cap));
    canvas.height = Math.max(2, Math.floor(h * dpr * cap));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize(); window.addEventListener("resize", resize);

  var dragging = false, lx = 0, ly = 0;
  function unlock() { bootAudio(); }
  canvas.addEventListener("pointerdown", function (e) {
    dragging = true; lx = e.clientX; ly = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    unlock();
  });
  canvas.addEventListener("pointerup", function () { dragging = false; });
  canvas.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    state.lookX = Math.max(-1.2, Math.min(1.2, state.lookX + (e.clientX - lx) * 0.003));
    state.lookY = Math.max(-0.8, Math.min(0.8, state.lookY + (e.clientY - ly) * 0.003));
    lx = e.clientX; ly = e.clientY;
  });
  window.addEventListener("wheel", function (e) {
    if (reduced) return;
    state.speed = Math.max(0.3, Math.min(16, state.speed + (e.deltaY > 0 ? 0.38 : -0.38)));
    state.fov = Math.max(0.82, Math.min(1.55, state.fov + (e.deltaY > 0 ? -0.02 : 0.02)));
  }, { passive: true });
  document.addEventListener("pointerdown", unlock, { once: true });

  var last = performance.now(), lastHud = 0, lastPhase = "MOUTH";
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    state.t += dt;
    if (!reduced) state.z += state.speed * dt;
    state.zoom += ((state.phase === "ONE" ? 0.35 : 0) - state.zoom) * 0.04;
    state.phase = phaseOf(state.z);
    if (state.phase !== lastPhase) {
      lastPhase = state.phase;
      if (state.phase === "SMASH") buzz([30, 50, 40, 50, 70]);
      driveAudio();
    }
    var smash = state.phase === "ONE" ? 1 : (state.phase === "SMASH" ? 0.62 : 0.06);
    var st = nearest(state.z);
    if (st !== state.station) paintStation(st, "ring");
    var fov = state.fov - state.zoom * 0.28;

    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uT, state.t);
    gl.uniform1f(uZ, state.z);
    gl.uniform2f(uLook, state.lookX, state.lookY);
    gl.uniform1f(uSmash, smash);
    gl.uniform1f(uFov, fov);
    gl.uniform1f(uRing, st ? 1.0 : 0.15);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (now - lastHud > 160) {
      lastHud = now;
      var rz = document.getElementById("read-z");
      var rp = document.getElementById("read-phase");
      if (rz) rz.textContent = "z " + (state.z % LOOP).toFixed(1);
      if (rp) rp.textContent = state.phase;
    }
    requestAnimationFrame(frame);
  }

  var raw = (location.hash || "").replace(/^#/, "").toLowerCase();
  if (raw) {
    for (var i = 0; i < SECTORS.length; i++) if (SECTORS[i].id === raw) { flyTo(SECTORS[i]); break; }
  } else paintStation(null, "boot");
  log({ t: Date.now(), src: "boot", phase: "MOUTH", access: "CLOSED", earned_cad: 0, engine: "lane-sdf" });
  requestAnimationFrame(frame);
})();
