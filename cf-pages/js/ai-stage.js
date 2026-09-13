import * as THREE from 'three';

export function startAIStage(canvas) {
  if (!canvas) return () => {};

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
  camera.position.z = 6;

  const root = new THREE.Group();
  scene.add(root);

  // Lattice sphere
  const lattice = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.1, 3),
    new THREE.MeshBasicMaterial({
      color: 0xd7ddff,
      wireframe: true,
      transparent: true,
      opacity: 0.22
    })
  );
  root.add(lattice);

  // Inner core
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 1),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.55
    })
  );
  root.add(core);

  // Rings
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.35 + i * 0.42, 0.01, 12, 180),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18 - i * 0.03,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    ring.rotation.x = Math.PI / 2.4 + i * 0.2;
    ring.rotation.y = i * 0.5;
    root.add(ring);
  }

  // Particle field
  const count = 900;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 2.4 + Math.random() * 8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
    pos[i * 3 + 2] = r * Math.cos(phi);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.025,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  scene.add(dust);

  let mx = 0, my = 0, tx = 0, ty = 0;
  const onMove = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    tx = (x / innerWidth - 0.5) * 2;
    ty = (y / innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

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
    mx += (tx - mx) * 0.05;
    my += (ty - my) * 0.05;

    root.rotation.y = t * 0.18 + mx * 0.35;
    root.rotation.x = my * 0.2;
    lattice.rotation.y = t * 0.08;
    core.rotation.y = -t * 0.7;
    core.rotation.z = t * 0.35;
    dust.rotation.y = t * 0.03;

    camera.position.x = mx * 0.2;
    camera.position.y = -my * 0.12;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  loop();

  return () => {
    running = false;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
}
