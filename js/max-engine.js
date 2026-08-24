import * as THREE from 'three';

/**
 * DualisCapax Max Engine
 * - Pure WebGL geometry only (no JPEG/PNG/clipart)
 * - Dome occupies ~75% visual weight, biased upward
 * - Web Audio residual bed + optional narrator
 */
export function startMaxEngine(canvas, options = {}) {
  if (!canvas) return { destroy() {}, playNarration() {}, stopNarration() {} };

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight);
  renderer.setClearColor(0x030308, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030308, 0.03);

  const camera = new THREE.PerspectiveCamera(
    46,
    (canvas.clientWidth || innerWidth) / (canvas.clientHeight || innerHeight),
    0.1,
    120
  );
  camera.position.set(0, 0.05, 6.4);

  const root = new THREE.Group();
  // Dome only ~75% of full visual scale
  root.scale.setScalar(0.75);
  root.position.y = 0.35;
  scene.add(root);

  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.7, 3),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    })
  );
  root.add(shell);

  const shellGlow = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.66, 2),
    new THREE.MeshBasicMaterial({
      color: 0xa8b4ff,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  root.add(shellGlow);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.42, 1),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.55
    })
  );
  root.add(core);

  const rings = [];
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.2 + i * 0.35, 0.01 + i * 0.0015, 12, 220),
      new THREE.MeshBasicMaterial({
        color: i % 2 ? 0xffffff : 0xc5ceff,
        transparent: true,
        opacity: 0.28 - i * 0.04,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    ring.rotation.x = Math.PI / 2.15 + i * 0.12;
    ring.rotation.y = i * 0.55;
    root.add(ring);
    rings.push(ring);
  }

  const count = 1100;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 2.0 + Math.random() * 9;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55;
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dust = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.02,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    })
  );
  dust.scale.setScalar(0.75);
  dust.position.y = 0.25;
  scene.add(dust);

  const grid = new THREE.GridHelper(18, 28, 0x2a2a40, 0x151522);
  grid.position.y = -1.55;
  grid.material.transparent = true;
  grid.material.opacity = 0.28;
  scene.add(grid);

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = AudioCtx ? new AudioCtx() : null;
  let narratorBuffer = null;
  let narratorSource = null;
  let ambientNodes = [];

  function startAmbient() {
    if (!audioCtx || reduceMotion) return;
    const master = audioCtx.createGain();
    master.gain.value = 0.04;
    master.connect(audioCtx.destination);
    const makeDrone = (freq, type, gainVal) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.value = gainVal;
      osc.connect(g);
      g.connect(master);
      osc.start();
      ambientNodes.push(osc, g);
    };
    makeDrone(48, 'sine', 0.9);
    makeDrone(96.1, 'sine', 0.3);
    makeDrone(144.4, 'triangle', 0.07);
  }

  async function loadNarrator(url) {
    if (!audioCtx) return false;
    try {
      const res = await fetch(url, { cache: 'force-cache' });
      if (!res.ok) return false;
      const arr = await res.arrayBuffer();
      narratorBuffer = await audioCtx.decodeAudioData(arr);
      return true;
    } catch {
      return false;
    }
  }

  async function playNarration() {
    if (!audioCtx) return { ok: false, reason: 'no-audio' };
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    if (!narratorBuffer) {
      const ok = await loadNarrator(options.narratorUrl || '/assets/audio/narrator.mp3');
      if (!ok) return { ok: false, reason: 'missing-narrator-file' };
    }
    stopNarration();
    const src = audioCtx.createBufferSource();
    const g = audioCtx.createGain();
    g.gain.value = 0.95;
    src.buffer = narratorBuffer;
    src.connect(g);
    g.connect(audioCtx.destination);
    src.start(0);
    narratorSource = src;
    return { ok: true };
  }

  function stopNarration() {
    if (narratorSource) {
      try { narratorSource.stop(); } catch {}
      narratorSource = null;
    }
  }

  let mx = 0, my = 0, tx = 0, ty = 0;
  const onMove = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    tx = (x / innerWidth - 0.5) * 2;
    ty = (y / innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  const onResize = () => {
    const w = canvas.clientWidth || innerWidth;
    const h = canvas.clientHeight || innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  window.addEventListener('resize', onResize);

  const unlock = async () => {
    if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
    if (ambientNodes.length === 0) startAmbient();
    window.removeEventListener('pointerdown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { passive: true });
  loadNarrator(options.narratorUrl || '/assets/audio/narrator.mp3');

  const clock = new THREE.Clock();
  let running = true;

  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    if (reduceMotion) {
      renderer.render(scene, camera);
      return;
    }
    const t = clock.getElapsedTime();
    mx += (tx - mx) * 0.045;
    my += (ty - my) * 0.045;

    root.rotation.y = t * 0.16 + mx * 0.35;
    root.rotation.x = my * 0.16;
    shell.rotation.y = t * 0.05;
    core.rotation.y = -t * 0.7;
    core.rotation.z = t * 0.35;
    core.scale.setScalar(1 + Math.sin(t * 2) * 0.06);
    rings.forEach((ring, i) => {
      ring.rotation.z = t * (0.12 + i * 0.04) * (i % 2 ? -1 : 1);
    });
    dust.rotation.y = t * 0.03;

    camera.position.x = mx * 0.18;
    camera.position.y = 0.05 - my * 0.1;
    camera.lookAt(0, 0.25, 0);
    renderer.render(scene, camera);
  }
  loop();

  // Ensure correct size after layout
  requestAnimationFrame(onResize);

  function destroy() {
    running = false;
    stopNarration();
    ambientNodes.forEach((n) => {
      try { n.stop && n.stop(); } catch {}
      try { n.disconnect && n.disconnect(); } catch {}
    });
    ambientNodes = [];
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointerdown', unlock);
    renderer.dispose();
    if (audioCtx) {
      try { audioCtx.close(); } catch {}
    }
  }

  return { destroy, playNarration, stopNarration, audioCtx };
}
