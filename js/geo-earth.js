import * as THREE from 'three';
const canvas = document.getElementById('geo-earth');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
camera.position.z = 3.55;
const group = new THREE.Group();
scene.add(group);

const R = 0.42;
const fallback = document.createElement('canvas');
fallback.width = 1024;
fallback.height = 512;
{
  const c = fallback.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#0b1a3a');
  g.addColorStop(0.18, '#123a72');
  g.addColorStop(0.5, '#0c5a3a');
  g.addColorStop(0.82, '#123a72');
  g.addColorStop(1, '#0b1a3a');
  c.fillStyle = g;
  c.fillRect(0, 0, 1024, 512);
  c.fillStyle = '#1e7a46';
  function blob(x, y, w, h) {
    c.beginPath();
    c.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    c.fill();
  }
  blob(280, 220, 160, 70);
  blob(250, 250, 90, 50);
  blob(620, 240, 140, 55);
  blob(780, 280, 70, 40);
  blob(120, 300, 50, 28);
  c.fillStyle = '#d8e4ef';
  c.fillRect(0, 18, 1024, 36);
  c.fillRect(0, 458, 1024, 36);
}
const fallbackTex = new THREE.CanvasTexture(fallback);
fallbackTex.colorSpace = THREE.SRGBColorSpace;

const earthMat = new THREE.MeshPhongMaterial({
  map: fallbackTex,
  color: 0xffffff,
  shininess: 12,
  specular: new THREE.Color(0x335577)
});
const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), earthMat);
group.add(earth);

const atmos = new THREE.Mesh(
  new THREE.SphereGeometry(R * 1.045, 48, 32),
  new THREE.MeshBasicMaterial({
    color: 0x6aa8ff,
    transparent: true,
    opacity: 0.16,
    side: THREE.BackSide,
    depthWrite: false
  })
);
group.add(atmos);

const limb = new THREE.Mesh(
  new THREE.SphereGeometry(R * 1.018, 48, 32),
  new THREE.MeshBasicMaterial({
    color: 0x9ec5ff,
    transparent: true,
    opacity: 0.10,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
);
group.add(limb);

scene.add(new THREE.AmbientLight(0x6b7a92, 0.55));
const sun = new THREE.DirectionalLight(0xfff4e6, 1.35);
sun.position.set(-2.2, 0.55, 2.4);
scene.add(sun);
const fill = new THREE.DirectionalLight(0x4a8fd8, 0.22);
fill.position.set(2.4, -0.4, -1.2);
scene.add(fill);

const loader = new THREE.TextureLoader();
loader.crossOrigin = 'anonymous';
const MAPS = [
  'https://unpkg.com/three-globe@2.41.12/example/img/earth-blue-marble.jpg',
  'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'
];
function applyMap(tex) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  earthMat.map = tex;
  earthMat.needsUpdate = true;
}
function tryMap(i) {
  if (i >= MAPS.length) return;
  loader.load(MAPS[i], applyMap, undefined, function () { tryMap(i + 1); });
}
tryMap(0);

const OMEGA = Math.PI * 2 / 28;
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  group.rotation.y += OMEGA * dt;
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
function onResize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (w < 1 || h < 1) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();
