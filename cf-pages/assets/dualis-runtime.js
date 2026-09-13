/** Dualis runtime — serial rail + parallel rooms. WebGPU if live, canvas else. */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var hudM = document.getElementById('s-mode');
  var hudN = document.getElementById('s-n');
  function setHud(mode, n) {
    if (hudM) hudM.textContent = mode;
    if (hudN) hudN.textContent = String(n);
  }

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;width:100%;height:100%';
  document.body.prepend(canvas);

  var mx = -9999, my = -9999, down = false, invert = 0;
  window.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
  window.addEventListener('pointerdown', function (e) {
    down = true; mx = e.clientX; my = e.clientY; invert = 1;
    try { if (navigator.vibrate) navigator.vibrate(10); } catch (err) {}
  }, { passive: true });
  window.addEventListener('pointerup', function () { down = false; invert = -1; }, { passive: true });

  var NS = 220, NP = 180;
  var serial = [], rooms = [];
  var W = 0, H = 0, t = 0;

  function rail(u, w, h) {
    var x = w * 0.12 + u * w * 0.76;
    var y = h * 0.42 + Math.sin(u * Math.PI * 2.0) * h * 0.08;
    return { x: x, y: y };
  }

  function seed() {
    serial = []; rooms = [];
    for (var i = 0; i < NS; i++) {
      var u = i / NS;
      var p = rail(u, W, H);
      serial.push({ u: u, x: p.x, y: p.y, vx: 0, vy: 0 });
    }
    var cols = ['#9ec5ff', '#7ee0c9', '#c4b5fd'];
    for (var r = 0; r < 3; r++) {
      for (var j = 0; j < NP; j++) {
        rooms.push({
          r: r, x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
          col: cols[r]
        });
      }
    }
  }

  function step() {
    t += 0.004;
    var inv = invert !== 0 ? invert : 1;
    if (invert !== 0 && !down) {
      invert *= 0.96;
      if (Math.abs(invert) < 0.02) invert = 0;
    }
    for (var i = 0; i < serial.length; i++) {
      var s = serial[i];
      s.u = (s.u + 0.00055 * inv + 1) % 1;
      var p = rail(s.u, W, H);
      s.x += (p.x - s.x) * 0.12;
      s.y += (p.y - s.y) * 0.12;
    }
    for (var k = 0; k < rooms.length; k++) {
      var q = rooms[k];
      var lane = H * (0.28 + q.r * 0.18);
      q.vy += (lane - q.y) * 0.0009;
      q.vx += Math.sin(t * 1.4 + q.r + q.x * 0.01) * 0.02;
      if (down) {
        var dx = mx - q.x, dy = my - q.y;
        var d2 = dx * dx + dy * dy + 40;
        q.vx += dx * 0.012 / Math.sqrt(d2);
        q.vy += dy * 0.012 / Math.sqrt(d2);
      } else {
        var near = serial[Math.floor(q.r * 70 + (k % 40)) % serial.length];
        if (near) {
          q.vx += (near.x - q.x) * 0.00015;
          q.vy += (near.y - q.y) * 0.00015;
        }
      }
      q.vx *= 0.985; q.vy *= 0.985;
      q.x += q.vx * inv; q.y += q.vy * inv;
      if (q.x < -6) q.x = W + 6; if (q.x > W + 6) q.x = -6;
      if (q.y < -6) q.y = H + 6; if (q.y > H + 6) q.y = -6;
    }
  }

  function bootCanvas() {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }
    function draw() {
      step();
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < serial.length; i++) {
        var s = serial[i];
        ctx.fillStyle = 'rgba(232,241,255,0.55)';
        ctx.beginPath(); ctx.arc(s.x, s.y, 1.15, 0, Math.PI * 2); ctx.fill();
      }
      for (var k = 0; k < rooms.length; k++) {
        var q = rooms[k];
        ctx.fillStyle = q.col;
        ctx.globalAlpha = 0.28;
        ctx.beginPath(); ctx.arc(q.x, q.y, 1.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(draw);
    }
    window.addEventListener('resize', resize);
    resize();
    setHud('canvas-serial-parallel', NS + NP * 3);
    requestAnimationFrame(draw);
  }

  async function bootGPU() {
    if (!navigator.gpu) throw new Error('no gpu');
    var adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('no adapter');
    var device = await adapter.requestDevice();
    var ctxg = canvas.getContext('webgpu');
    if (!ctxg) throw new Error('no webgpu ctx');
    var format = navigator.gpu.getPreferredCanvasFormat();
    function configure() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * 2; canvas.height = H * 2;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctxg.configure({ device: device, format: format, alphaMode: 'premultiplied' });
    }
    configure();
    window.addEventListener('resize', configure);
    var shader = device.createShaderModule({
      code: [
        'struct Uniforms { time: f32, w: f32, h: f32, down: f32, mx: f32, my: f32, inv: f32, _pad: f32 }',
        '@group(0) @binding(0) var<uniform> u: Uniforms;',
        'struct VSOut { @builtin(position) pos: vec4f, @location(0) col: vec4f }',
        '@vertex fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> VSOut {',
        '  let kind = ii / 220u;',
        '  let idx = ii % 220u;',
        '  let uu = (f32(idx) / 220.0 + u.time * 0.04 * u.inv);',
        '  var p = vec2f(u.w * 0.12 + fract(uu) * u.w * 0.76, u.h * 0.42 + sin(fract(uu) * 6.28318) * u.h * 0.08);',
        '  var col = vec4f(0.91, 0.95, 1.0, 0.7);',
        '  if (kind > 0u) {',
        '    let lane = 0.28 + f32(kind - 1u) * 0.18;',
        '    let a = u.time * 0.7 + f32(ii) * 0.13;',
        '    p = vec2f(fract(f32(ii) * 0.017 + u.time * 0.03) * u.w, lane * u.h + sin(a) * 28.0);',
        '    if (kind == 1u) { col = vec4f(0.62, 0.77, 1.0, 0.45); }',
        '    else if (kind == 2u) { col = vec4f(0.49, 0.88, 0.79, 0.45); }',
        '    else { col = vec4f(0.77, 0.71, 0.99, 0.45); }',
        '    if (u.down > 0.5) { p = mix(p, vec2f(u.mx, u.my), 0.18); }',
        '  }',
        '  let quad = array<vec2f, 6>(vec2f(-1,-1), vec2f(1,-1), vec2f(-1,1), vec2f(-1,1), vec2f(1,-1), vec2f(1,1));',
        '  let o = quad[vi] * 2.2;',
        '  var out: VSOut;',
        '  out.pos = vec4f(((p.x + o.x) / u.w) * 2.0 - 1.0, 1.0 - ((p.y + o.y) / u.h) * 2.0, 0.0, 1.0);',
        '  out.col = col;',
        '  return out;',
        '}',
        '@fragment fn fs(@location(0) col: vec4f) -> @location(0) vec4f { return col; }'
      ].join('\n')
    });
    var pipe = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module: shader, entryPoint: 'vs' },
      fragment: { module: shader, entryPoint: 'fs', targets: [{ format: format, blend: { color: { srcFactor: 'src-alpha', dstFactor: 'one' }, alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' } } }] },
      primitive: { topology: 'triangle-list' }
    });
    var ubuf = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    var bg = device.createBindGroup({ layout: pipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: ubuf } }] });
    var time0 = performance.now();
    function frame() {
      var now = (performance.now() - time0) / 1000;
      var inv = invert === 0 ? 1 : invert;
      if (invert !== 0 && !down) { invert *= 0.96; if (Math.abs(invert) < 0.02) invert = 0; }
      device.queue.writeBuffer(ubuf, 0, new Float32Array([now, W, H, down ? 1 : 0, mx, my, inv, 0]));
      var enc = device.createCommandEncoder();
      var pass = enc.beginRenderPass({
        colorAttachments: [{
          view: ctxg.getCurrentTexture().createView(),
          clearValue: { r: 0.02, g: 0.02, b: 0.02, a: 0 },
          loadOp: 'clear', storeOp: 'store'
        }]
      });
      pass.setPipeline(pipe);
      pass.setBindGroup(0, bg);
      pass.draw(6, 220 * 4);
      pass.end();
      device.queue.submit([enc.finish()]);
      requestAnimationFrame(frame);
    }
    setHud('webgpu-serial-parallel', 880);
    requestAnimationFrame(frame);
  }

  bootGPU().catch(function () { bootCanvas(); });
})();
