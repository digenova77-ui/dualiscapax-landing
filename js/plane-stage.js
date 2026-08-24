import * as THREE from 'three';

export function startPlaneStage(canvas) {
  if (!canvas) return () => {};

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x020206, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020206, 0.045);

  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0.4, 7.2);

  // Tier lights (vector only)
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(3, 5, 4);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0x6688aa, 0.35));

  const world = new THREE.Group();
  scene.add(world);

  // Three residual glass planes
  const planes = [];
  const planeGeo = new THREE.PlaneGeometry(6.5, 4.2, 24, 16);
  for (let i = 0; i < 3; i++) {
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x0b0d14,
      metalness: 0.15,
      roughness: 0.18,
      transmission: 0.55,
      thickness: 0.6,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    // Fallback if physical unsupported heavily
    if (!renderer.capabilities.isWebGL2) {
      mat.transmission = 0;
      mat.opacity = 0.22;
    }
    const mesh = new THREE.Mesh(planeGeo, mat);
    mesh.position.set((i - 1) * 0.35, 0.1 * i, -i * 1.15);
    mesh.rotation.y = (i - 1) * 0.12;
    world.add(mesh);
    planes.push(mesh);

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(planeGeo),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 })
    );
    mesh.add(edge);
  }

  // Core geodesic mark
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.85, 2),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.7,
      roughness: 0.25,
      emissive: 0x222233,
      wireframe: false
    })
  );
  const coreWire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.86, 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.25 })
  );
  core.add(coreWire);
  world.add(core);

  // Smoke / fog particles
  const smokeCount = 1600;
  const smokePos = new Float32Array(smokeCount * 3);
  const smokeVel = new Float32Array(smokeCount);
  for (let i = 0; i < smokeCount; i++) {
    smokePos[i * 3] = (Math.random() - 0.5) * 16;
    smokePos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    smokePos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
    smokeVel[i] = 0.15 + Math.random() * 0.55;
  }
  const smokeGeo = new THREE.BufferGeometry();
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
  const smoke = new THREE.Points(
    smokeGeo,
    new THREE.PointsMaterial({
      color: 0xb9c4e6,
      size: 0.06,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    })
  );
  scene.add(smoke);

  // Floor residual
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(10, 64),
    new THREE.MeshStandardMaterial({
      color: 0x08080f,
      metalness: 0.8,
      roughness: 0.4,
      transparent: true,
      opacity: 0.85
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.8;
  scene.add(floor);

  let mx = 0, my = 0, tx = 0, ty = 0;
  const onMove = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    tx = (x / innerWidth - 0.5) * 2;
    ty = (y / innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  const clock = new THREE.Clock();
  let running = true;
  let slide = 0;

  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    mx += (tx - mx) * 0.05;
    my += (ty - my) * 0.05;
    slide += ((mx * 0.8) - slide) * 0.04;

    if (!reduce) {
      world.rotation.y = t * 0.08 + slide * 0.25;
      core.rotation.y = t * 0.45;
      core.rotation.x = t * 0.15;
      planes.forEach((p, i) => {
        p.position.x = (i - 1) * 0.45 + Math.sin(t * 0.4 + i) * 0.08 + slide * (0.35 + i * 0.12);
        p.rotation.y = (i - 1) * 0.14 + slide * 0.1;
        p.position.z = -i * 1.15 + Math.cos(t * 0.35 + i) * 0.05;
      });

      const pos = smoke.geometry.attributes.position.array;
      for (let i = 0; i < smokeCount; i++) {
        const ix = i * 3;
        pos[ix + 1] += 0.004 * smokeVel[i];
        pos[ix] += Math.sin(t * 0.2 + i) * 0.0015;
        if (pos[ix + 1] > 4.5) pos[ix + 1] = -4.5;
      }
      smoke.geometry.attributes.position.needsUpdate = true;
      smoke.rotation.y = t * 0.02;
    }

    camera.position.x = mx * 0.35;
    camera.position.y = 0.4 - my * 0.2;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  loop();

  return () => {
    running = false;
    window.removeEventListener('pointermove', onMove);
    renderer.dispose();
  };
}
