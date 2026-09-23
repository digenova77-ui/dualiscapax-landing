/**
 * IrisGL — WebGL 2 call for the three-sphere cluster.
 * GLSL ES 3.00 raymarch. Reads DSAP.wave(). Not Three.js. Not Vulkan.
 * Fail closed: return null and let IrisSphere canvas 2D run.
 */
(function (w) {
  var VERSION = "iris-gl-2026-09-22-w2";
  var gl = null, canvas = null, prog = null, raf = 0, reduced = false;
  var energy = 0.2, speaking = 0, listening = 0, woken = 1;
  var lookX = 0, lookY = 0;
  var q = { w: 1, x: 0, y: 0, z: 0 };
  var u = {};
  var t0 = 0, last = 0;
  var wave16 = new Float32Array(16);

  var VERT = "#version 300 es\n" +
    "layout(location=0) in vec2 a;\n" +
    "out vec2 vUv;\n" +
    "void main(){ vUv=a*0.5+0.5; gl_Position=vec4(a,0.0,1.0); }\n";

  var FRAG = "#version 300 es\n" +
    "precision highp float;\n" +
    "in vec2 vUv;\n" +
    "out vec4 o;\n" +
    "uniform vec2 uRes;\n" +
    "uniform float uTime;\n" +
    "uniform float uEnergy;\n" +
    "uniform float uSpeak;\n" +
    "uniform float uListen;\n" +
    "uniform vec4 uQ;\n" +
    "uniform vec2 uLook;\n" +
    "uniform float uWave[16];\n" +
    "vec3 qrot(vec4 q, vec3 v){\n" +
    "  return v+2.0*cross(q.xyz,cross(q.xyz,v)+q.w*v);\n" +
    "}\n" +
    "float sph(vec3 p, vec3 c, float r){ return length(p-c)-r; }\n" +
    "float map(vec3 p, out float id){\n" +
    "  vec3 a=qrot(uQ,vec3(0.0,0.0,0.0));\n" +
    "  vec3 b=qrot(uQ,vec3(1.18,0.22,0.42));\n" +
    "  vec3 c=qrot(uQ,vec3(-0.92,0.58,-0.62));\n" +
    "  float r0=0.72+uEnergy*0.08;\n" +
    "  float d0=sph(p,a,r0);\n" +
    "  float d1=sph(p,b,0.28);\n" +
    "  float d2=sph(p,c,0.20);\n" +
    "  id=0.0; float d=d0;\n" +
    "  if(d1<d){ d=d1; id=1.0; }\n" +
    "  if(d2<d){ d=d2; id=2.0; }\n" +
    "  return d;\n" +
    "}\n" +
    "vec3 nrm(vec3 p){\n" +
    "  float id; vec2 e=vec2(0.002,0.0);\n" +
    "  return normalize(vec3(\n" +
    "    map(p+e.xyy,id)-map(p-e.xyy,id),\n" +
    "    map(p+e.yxy,id)-map(p-e.yxy,id),\n" +
    "    map(p+e.yyx,id)-map(p-e.yyx,id)));\n" +
    "}\n" +
    "void main(){\n" +
    "  vec2 uv=(vUv*2.0-1.0);\n" +
    "  uv.x*=uRes.x/max(1.0,uRes.y);\n" +
    "  vec3 ro=vec3(uLook.x*0.15,uLook.y*0.1,2.6);\n" +
    "  vec3 rd=normalize(vec3(uv,-1.6));\n" +
    "  float t=0.0; float id=0.0; float hit=0.0;\n" +
    "  for(int i=0;i<48;i++){\n" +
    "    vec3 p=ro+rd*t;\n" +
    "    float d=map(p,id);\n" +
    "    if(d<0.003){ hit=1.0; break; }\n" +
    "    t+=d; if(t>8.0) break;\n" +
    "  }\n" +
    "  vec3 col=vec3(0.02,0.02,0.04);\n" +
    "  if(hit>0.5){\n" +
    "    vec3 p=ro+rd*t;\n" +
    "    vec3 n=nrm(p);\n" +
    "    vec3 l=normalize(vec3(-0.4,0.7,0.6));\n" +
    "    float diff=clamp(dot(n,l),0.0,1.0);\n" +
    "    float spec=pow(clamp(dot(reflect(-l,n),-rd),0.0,1.0),24.0);\n" +
    "    float fres=pow(1.0-clamp(dot(n,-rd),0.0,1.0),2.4);\n" +
    "    vec3 base=mix(vec3(0.12,0.42,0.95),vec3(0.98,0.78,0.18),uSpeak);\n" +
    "    base=mix(base,vec3(0.18,0.85,0.55),uListen*(1.0-uSpeak));\n" +
    "    if(id>0.5) base=mix(vec3(0.55,0.42,0.95),base,0.25);\n" +
    "    float wv=uWave[int(clamp(floor((p.x+2.0)*3.0),0.0,15.0))];\n" +
    "    base+=vec3(1.0,0.8,0.3)*wv*0.35;\n" +
    "    col=base*(0.22+diff*0.85)+vec3(1.0)*spec*0.45+base*fres*0.25;\n" +
    "    float sh=smoothstep(0.2,1.6,p.y+1.1);\n" +
    "    col*=0.55+0.45*sh;\n" +
    "  } else {\n" +
    "    float g=exp(-dot(uv,uv)*1.4)*(0.12+uEnergy*0.2);\n" +
    "    col+=vec3(0.15,0.35,0.8)*g;\n" +
    "    if(uSpeak>0.5) col+=vec3(0.6,0.35,0.05)*g;\n" +
    "  }\n" +
    "  o=vec4(col,1.0);\n" +
    "}\n";

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

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      try { console.warn("IrisGL", gl.getShaderInfoLog(sh)); } catch (e) {}
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function link() {
    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      try { console.warn("IrisGL link", gl.getProgramInfoLog(p)); } catch (e) {}
      return null;
    }
    return p;
  }

  function loc(name) { return gl.getUniformLocation(prog, name); }

  function size() {
    if (!canvas || !gl) return;
    var parent = canvas.parentElement || canvas;
    var wdt = parent.clientWidth || canvas.clientWidth || 180;
    var hgt = parent.clientHeight || canvas.clientHeight || 180;
    if (hgt < 80) hgt = wdt;
    var dpr = Math.min(w.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(wdt * dpr);
    canvas.height = Math.floor(hgt * dpr);
    canvas.style.width = wdt + "px";
    canvas.style.height = hgt + "px";
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function tapWave() {
    if (!w.DSAP || !DSAP.wave) return;
    var bins = DSAP.wave();
    if (!bins || !bins.length) return;
    var i, acc = 0, step = Math.max(1, Math.floor(bins.length / 16));
    for (i = 0; i < 16; i++) {
      var d = Math.abs(bins[Math.min(bins.length - 1, i * step)] - 128) / 128;
      wave16[i] = d;
      acc += d;
    }
    energy = Math.max(energy * 0.82, Math.min(1, (acc / 16) * 2.2));
  }

  function draw(now) {
    raf = w.requestAnimationFrame(draw);
    if (!gl || !prog) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    if (!t0) t0 = now;
    tapWave();
    if (!reduced) {
      var spin = 0.42 + energy * 0.9;
      q = qmul(q, qaxis(0.16, 1, 0.22, spin * dt));
      q = qmul(q, qaxis(0.7, 0.1, 0.3, 0.12 * dt));
      if (lookX || lookY) q = qmul(qaxis(1, 0, 0, lookY * 0.014), qmul(qaxis(0, 1, 0, lookX * 0.018), q));
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.02, 0.02, 0.03, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1f(u.time, (now - t0) / 1000);
    gl.uniform1f(u.energy, energy);
    gl.uniform1f(u.speak, speaking);
    gl.uniform1f(u.listen, listening);
    gl.uniform4f(u.q, q.x, q.y, q.z, q.w);
    gl.uniform2f(u.look, lookX, lookY);
    gl.uniform1fv(u.wave, wave16);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function mount(target) {
    reduced = !!(w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (reduced) return null;
    var host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) return null;
    canvas = host.tagName === "CANVAS" ? host : host.querySelector("canvas") || document.createElement("canvas");
    canvas.id = canvas.id || "iris-gl";
    canvas.className = (canvas.className + " iris-sphere-plate iris-gl-plate").trim();
    canvas.setAttribute("aria-label", "Iris three-sphere cluster");
    if (canvas.parentNode !== host && host.tagName !== "CANVAS") {
      host.innerHTML = "";
      host.appendChild(canvas);
    }
    gl = canvas.getContext("webgl2", { alpha: false, antialias: true, powerPreference: "high-performance" });
    if (!gl) return null;
    prog = link();
    if (!prog) { gl = null; return null; }
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 3, -1, -1, 3
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    u.res = loc("uRes");
    u.time = loc("uTime");
    u.energy = loc("uEnergy");
    u.speak = loc("uSpeak");
    u.listen = loc("uListen");
    u.q = loc("uQ");
    u.look = loc("uLook");
    u.wave = loc("uWave[0]") || loc("uWave");
    size();
    w.addEventListener("resize", size);
    if (!raf) raf = w.requestAnimationFrame(draw);
    return canvas;
  }

  w.IrisGL = {
    version: VERSION,
    backend: "webgl2",
    cluster: 3,
    mount: mount,
    pose: function () { return { w: q.w, x: q.x, y: q.y, z: q.z, cluster: 3, backend: "webgl2" }; },
    setEnergy: function (n) { energy = Math.max(0, Math.min(1, n)); },
    setSpeaking: function (on) { speaking = on ? 1 : 0; if (on) energy = Math.max(energy, 0.55); },
    setListening: function (on) { listening = on ? 1 : 0; },
    setWoken: function (on) { woken = on ? 1 : 0; },
    lookAt: function (x, y) {
      lookX = Math.max(-1, Math.min(1, x || 0));
      lookY = Math.max(-1, Math.min(1, y || 0));
    },
    canvas: function () { return canvas; },
    live: function () { return !!gl; }
  };
})(window);
