import * as THREE from 'three';

export function startBuckyball(canvas) {
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
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 100);
  camera.position.z = 5.2;

  const root = new THREE.Group();
  scene.add(root);

  // Geodesic / bucky-style sphere (icosahedron projected)
  const geometry = new THREE.IcosahedronGeometry(1.55, 2);
  const wire = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.55
    })
  );
  root.add(wire);

  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.52, 2),
    new THREE.MeshBasicMaterial({
      color: 0x9aa3ff,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  root.add(shell);

  // Inner core
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.45, 1),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    })
  );
  root.add(core);

  // Soft particle dust
  const count = 400;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 2.2 + Math.random() * 4.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
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
      opacity: 0.45,
      depthWrite: false
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
    mx += (tx - mx) * 0.04;
    my += (ty - my) * 0.04;

    root.rotation.y = t * 0.25 + mx * 0.4;
    root.rotation.x = t * 0.1 + my * 0.25;
    core.rotation.y = -t * 0.6;
    core.rotation.z = t * 0.3;
    dust.rotation.y = t * 0.04;

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
