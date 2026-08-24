/** DualisCapax residual field — high-motion WebGL background */
import * as THREE from 'three';

export function startResidualField(canvas) {
  if (!canvas) return () => {};

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x030308, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030308, 0.035);

  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0.2, 6.5);

  const root = new THREE.Group();
  scene.add(root);

  // Core residual rings
  const rings = new THREE.Group();
  root.add(rings);
  const ringMats = [];
  for (let i = 0; i < 5; i++) {
    const geo = new THREE.TorusGeometry(1.1 + i * 0.38, 0.012 + i * 0.002, 16, 180);
    const mat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0xffffff : 0xb0b8ff,
      transparent: true,
      opacity: 0.55 - i * 0.07,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    ringMats.push(mat);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2.2 + i * 0.08;
    mesh.rotation.y = i * 0.4;
    rings.add(mesh);
  }

  // Inner energy core
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.35, 2),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  root.add(core);

  // Particle field
  const count = 1200;
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = 2.5 + Math.random() * 10;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
    positions[i * 3 + 2] = r * Math.cos(phi);
    speeds[i] = 0.2 + Math.random() * 0.8;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      color: 0xdde3ff,
      size: 0.03,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    })
  );
  scene.add(points);

  // Secondary spark layer
  const sparkCount = 180;
  const sparkPos = new Float32Array(sparkCount * 3);
  for (let i = 0; i < sparkCount; i++) {
    sparkPos[i * 3] = (Math.random() - 0.5) * 14;
    sparkPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparks = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  scene.add(sparks);

  // Soft light plane pulse
  const pulse = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 64),
    new THREE.MeshBasicMaterial({
      color: 0x6b7cff,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  pulse.rotation.x = -Math.PI / 2.1;
  pulse.position.y = -1.3;
  root.add(pulse);

  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  const onMove = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    targetX = (x / innerWidth - 0.5) * 2;
    targetY = (y / innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });

  const onResize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  };
  window.addEventListener('resize', onResize);

  const clock = new THREE.Clock();
  let running = true;

  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();

    mouseX += (targetX - mouseX) * 0.04;
    mouseY += (targetY - mouseY) * 0.04;

    root.rotation.y = t * 0.12 + mouseX * 0.35;
    root.rotation.x = mouseY * 0.18;
    rings.children.forEach((ring, i) => {
      ring.rotation.z = t * (0.15 + i * 0.05) * (i % 2 === 0 ? 1 : -1);
      ring.rotation.x += 0.0015 * (i + 1);
    });
    core.rotation.y = t * 0.8;
    core.rotation.x = t * 0.35;
    core.scale.setScalar(1 + Math.sin(t * 2.2) * 0.08);

    pulse.material.opacity = 0.05 + Math.sin(t * 1.5) * 0.03;
    pulse.scale.setScalar(1 + Math.sin(t * 1.2) * 0.08);

    const pos = points.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      pos[ix + 1] += Math.sin(t * speeds[i] + i) * 0.002;
      pos[ix] += Math.cos(t * 0.1 + i) * 0.0008;
    }
    points.geometry.attributes.position.needsUpdate = true;
    points.rotation.y = t * 0.03;

    sparks.rotation.y = -t * 0.05;
    sparks.rotation.x = t * 0.02;

    camera.position.x = mouseX * 0.25;
    camera.position.y = 0.2 - mouseY * 0.15;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  loop();

  return function destroy() {
    running = false;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
}
