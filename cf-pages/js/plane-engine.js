/** WebGL helix engine — independent of content/skin */
import * as THREE from 'three';

export function startPlaneEngine(canvas) {
  if (!canvas) return;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x020203, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7);
  const group = new THREE.Group();
  scene.add(group);

  function strand(color, phase) {
    const pts = [];
    for (let i = 0; i <= 160; i++) {
      const t = (i / 160) * Math.PI * 5;
      const y = (i / 160) * 7 - 3.5;
      pts.push(new THREE.Vector3(Math.cos(t + phase) * 1.2, y, Math.sin(t + phase) * 1.2));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.Mesh(
      new THREE.TubeGeometry(curve, 180, 0.05, 8, false),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.88 })
    );
  }
  group.add(strand(0xc9a227, 0));
  group.add(strand(0x3b82f6, Math.PI));

  const pCount = 280;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 12;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.025, transparent: true, opacity: 0.28 })));

  let target = 0;
  addEventListener('scroll', () => {
    const max = document.body.scrollHeight - innerHeight;
    target = max > 0 ? scrollY / max : 0;
  }, { passive: true });
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    group.rotation.y += (target * Math.PI * 2 + t * 0.12 - group.rotation.y) * 0.05;
    group.position.y = (target - 0.5) * 1.2;
    renderer.render(scene, camera);
  })();
}
