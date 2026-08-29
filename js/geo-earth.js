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
const PHI = (1 + Math.sqrt(5)) / 2;
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
  specular: new THREE.Color(0x335577),
  transparent: true,
  opacity: 0.92
});
const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), earthMat);
earth.renderOrder = 1;
group.add(earth);

const atmos = new THREE.Mesh(
  new THREE.SphereGeometry(R * 1.038, 48, 32),
  new THREE.MeshBasicMaterial({
    color: 0x6aa8ff,
    transparent: true,
    opacity: 0.12,
    side: THREE.BackSide,
    depthWrite: false
  })
);
group.add(atmos);

function c60Points(radius) {
  const raw = [];
  function even(x, y, z) { raw.push(x, y, z, z, x, y, y, z, x); }
  for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) even(0, s1, s2 * 3 * PHI);
  for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) for (const s3 of [-1, 1]) {
    even(s1 * 2, s2 * (1 + 2 * PHI), s3 * PHI);
    even(s1, s2 * (2 + PHI), s3 * 2 * PHI);
  }
  const pts = [];
  let max = 0;
  for (let i = 0; i < raw.length; i += 3) {
    const v = new THREE.Vector3(raw[i], raw[i + 1], raw[i + 2]);
    max = Math.max(max, v.length());
    pts.push(v);
  }
  pts.forEach(function (v) { v.multiplyScalar(radius / max); });
  return pts;
}
function edgeLength(pts) {
  let min = Infinity;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = pts[i].distanceTo(pts[j]);
      if (d > 1e-6 && d < min) min = d;
    }
  }
  return min;
}
function adjacency(pts, min) {
  const cut = min * 1.12;
  const adj = pts.map(function () { return []; });
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      if (pts[i].distanceTo(pts[j]) <= cut) {
        adj[i].push(j); adj[j].push(i);
      }
    }
  }
  return adj;
}
function pentagonFaces(pts, min) {
  const adj = adjacency(pts, min);
  const seen = new Set();
  const faces = [];
  for (let a = 0; a < pts.length; a++) {
    for (const b of adj[a]) {
      for (const c of adj[b]) {
        if (c === a) continue;
        for (const d of adj[c]) {
          if (d === a || d === b) continue;
          for (const e of adj[d]) {
            if (e === a || e === b || e === c) continue;
            if (adj[e].indexOf(a) < 0) continue;
            const key = [a, b, c, d, e].sort(function (p, q) { return p - q; }).join(',');
            if (seen.has(key)) continue;
            seen.add(key);
            const verts = [a, b, c, d, e].map(function (i) { return pts[i].clone(); });
            const cen = new THREE.Vector3();
            verts.forEach(function (v) { cen.add(v); });
            cen.multiplyScalar(0.2);
            const n = cen.clone().normalize();
            let rin = Infinity;
            for (let i = 0; i < 5; i++) {
              const A = verts[i], B = verts[(i + 1) % 5];
              const ab = B.clone().sub(A);
              const ap = cen.clone().sub(A);
              const dist = ap.clone().cross(ab).length() / ab.length();
              if (dist < rin) rin = dist;
            }
            faces.push({ cen: cen, n: n, rin: rin });
          }
        }
      }
    }
  }
  return faces;
}
function c60Geometry(pts, min) {
  const pos = [];
  const cut = min * 1.12;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      if (pts[i].distanceTo(pts[j]) <= cut) {
        pos.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}
const cageR = R * 1.085;
const cagePts = c60Points(cageR);
const cageMin = edgeLength(cagePts);
const pents = pentagonFaces(cagePts, cageMin);
const cage = c60Geometry(cagePts, cageMin);
const glow = new THREE.LineSegments(cage, new THREE.LineBasicMaterial({
  color: 0x6aa8ff, transparent: true, opacity: 0.16,
  blending: THREE.AdditiveBlending, depthWrite: false
}));
glow.scale.setScalar(1.01);
const cageCore = new THREE.LineSegments(cage, new THREE.LineBasicMaterial({
  color: 0x9ec5ff, transparent: true, opacity: 0.34,
  blending: THREE.AdditiveBlending, depthWrite: false
}));
group.add(glow);
group.add(cageCore);

const coreHalo = new THREE.Mesh(
  new THREE.SphereGeometry(0.11, 32, 24),
  new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.22,
    blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
  })
);
const core = new THREE.Mesh(
  new THREE.SphereGeometry(0.055, 32, 24),
  new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.92,
    blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
  })
);
coreHalo.renderOrder = 6;
core.renderOrder = 7;
group.add(coreHalo);
group.add(core);

function makeDotTex(hex, soft) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, hex);
  g.addColorStop(0.35, hex);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.beginPath(); x.arc(32, 32, 32, 0, Math.PI * 2); x.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const texBlue = makeDotTex('rgba(122,176,255,1)');
const texGold = makeDotTex('rgba(232,184,74,1)');
const texWhite = makeDotTex('rgba(255,255,255,1)');

const SN = 18;
function makeSprites(tex) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(SN * 3), 3));
  g.setAttribute('aSize', new THREE.Float32BufferAttribute(new Float32Array(SN), 1));
  const mat = new THREE.PointsMaterial({
    map: tex,
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    size: 0.045,
    sizeAttenuation: true
  });
  const pts = new THREE.Points(g, mat);
  pts.renderOrder = 5;
  group.add(pts);
  return { g: g, mesh: pts };
}
function makeRibbon(color, opacity) {
  const g = new THREE.BufferGeometry();
  const verts = SN * 2;
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(verts * 3), 3));
  const idx = [];
  for (let i = 0; i < SN - 1; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, b, c, b, d, c);
  }
  g.setIndex(idx);
  const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
    color: color, transparent: true, opacity: opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  }));
  mesh.renderOrder = 4;
  group.add(mesh);
  return { g: g, mesh: mesh };
}

const feeds = [];
function addFeed(pt) {
  feeds.push({
    from: pt.clone(),
    blue: makeRibbon(0x6aa8ff, 0.22),
    gold: makeRibbon(0xe0b84a, 0.18),
    sBlue: makeSprites(texBlue),
    sGold: makeSprites(texGold),
    sWhite: makeSprites(texWhite)
  });
}
addFeed(new THREE.Vector3(cageR, 0, 0));
addFeed(new THREE.Vector3(-cageR, 0, 0));

function ribbonPath(from, now, phase) {
  const dest = from.clone().setLength(0.04);
  const dir = dest.clone().sub(from);
  const up = Math.abs(from.y) < 0.85 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const n1 = dir.clone().cross(up).normalize();
  const n2 = dir.clone().cross(n1).normalize();
  const out = [];
  for (let i = 0; i < SN; i++) {
    const t = i / (SN - 1);
    const p = from.clone().lerp(dest, t * t);
    const twist = t * 6.2 + now * 0.0022 + phase;
    const rad = 0.016 * Math.sin(t * Math.PI) * (1 - t);
    p.addScaledVector(n1, Math.cos(twist) * rad);
    p.addScaledVector(n2, Math.sin(twist) * rad);
    out.push(p);
  }
  return out;
}
function writeRibbon(geo, pts, width) {
  const arr = geo.attributes.position.array;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[Math.min(i + 1, pts.length - 1)];
    const prev = pts[Math.max(i - 1, 0)];
    const tan = q.clone().sub(prev).normalize();
    const side = new THREE.Vector3().crossVectors(tan, p).normalize().multiplyScalar(width * 0.5 * (1 - i / (pts.length - 1)));
    if (!isFinite(side.x)) side.set(0, width * 0.5, 0);
    const a = p.clone().add(side);
    const b = p.clone().sub(side);
    arr[i * 6] = a.x; arr[i * 6 + 1] = a.y; arr[i * 6 + 2] = a.z;
    arr[i * 6 + 3] = b.x; arr[i * 6 + 4] = b.y; arr[i * 6 + 5] = b.z;
  }
  geo.attributes.position.needsUpdate = true;
}
function writeSprites(geo, pts, now, offset) {
  const arr = geo.attributes.position.array;
  const travel = ((now * 0.0018) + offset) % 1;
  for (let i = 0; i < pts.length; i++) {
    let t = (i / (pts.length - 1) + travel) % 1;
    t = t * t;
    const p = pts[Math.min(pts.length - 1, Math.floor(t * (pts.length - 1)))];
    arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z;
  }
  geo.attributes.position.needsUpdate = true;
}

const decals = [];
function mountRingDecals(img) {
  const punch = document.createElement('canvas');
  punch.width = 192; punch.height = 192;
  const ptx = punch.getContext('2d');
  ptx.drawImage(img, 0, 0, 192, 192);
  const data = ptx.getImageData(0, 0, 192, 192);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const lum = 0.21 * px[i] + 0.72 * px[i + 1] + 0.07 * px[i + 2];
    if (lum < 16) px[i + 3] = 0;
    else if (lum < 30) px[i + 3] = Math.round(255 * (lum - 16) / 14);
  }
  ptx.putImageData(data, 0, 0);
  const ringTex = new THREE.CanvasTexture(punch);
  ringTex.colorSpace = THREE.SRGBColorSpace;
  function place(n, r, opacity) {
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(r, 40),
      new THREE.MeshBasicMaterial({
        map: ringTex, transparent: true, opacity: opacity,
        depthWrite: false, alphaTest: 0.06, side: THREE.DoubleSide
      })
    );
    disc.position.copy(n).setLength(cageR * 1.01);
    disc.lookAt(n.clone().multiplyScalar(2));
    disc.renderOrder = 3;
    group.add(disc);
    decals.push({ mesh: disc, n: n.clone() });
    addFeed(disc.position.clone());
  }
  place(new THREE.Vector3(1, 0, 0), 0.055, 0.92);
  place(new THREE.Vector3(-1, 0, 0), 0.055, 0.92);
  pents.forEach(function (p) {
    if (Math.abs(p.n.y) < 0.18) return;
    place(p.n, Math.max(0.028, p.rin * 0.48), 0.72);
  });
}

const ring = new Image();
ring.onload = function () { mountRingDecals(ring); };
ring.src = 'brand/emblem-helix.svg';

scene.add(new THREE.AmbientLight(0x6b7a92, 0.55));
const sun = new THREE.DirectionalLight(0xfff4e6, 1.28);
sun.position.set(-2.2, 0.55, 2.4);
scene.add(sun);
const fill = new THREE.DirectionalLight(0x4a8fd8, 0.2);
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
const camDir = new THREE.Vector3(0, 0, 1);
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  group.rotation.y += OMEGA * dt;
  core.material.opacity = 0.78 + 0.18 * Math.abs(Math.sin(now * 0.0032));
  coreHalo.material.opacity = 0.16 + 0.10 * Math.abs(Math.sin(now * 0.0024));
  for (let i = 0; i < feeds.length; i++) {
    const f = feeds[i];
    const bluePath = ribbonPath(f.from, now, 0);
    const goldPath = ribbonPath(f.from, now, Math.PI);
    writeRibbon(f.blue.g, bluePath, 0.010);
    writeRibbon(f.gold.g, goldPath, 0.008);
    writeSprites(f.sBlue.g, bluePath, now, i * 0.13);
    writeSprites(f.sGold.g, goldPath, now, i * 0.13 + 0.5);
    writeSprites(f.sWhite.g, bluePath, now, i * 0.13 + 0.72);
    const pulse = 0.14 + 0.10 * Math.abs(Math.sin(now * 0.0028 + i));
    f.blue.mesh.material.opacity = pulse;
    f.gold.mesh.material.opacity = pulse * 0.8;
    f.sBlue.mesh.material.opacity = 0.55 + pulse;
    f.sGold.mesh.material.opacity = 0.45 + pulse * 0.8;
    f.sWhite.mesh.material.opacity = 0.25 + 0.35 * (1 - Math.abs(Math.sin(now * 0.002 + i)));
  }
  for (let i = 0; i < decals.length; i++) {
    const wn = decals[i].n.clone().applyQuaternion(group.quaternion);
    const facing = wn.dot(camDir);
    decals[i].mesh.material.opacity = facing < 0 ? 0.28 : 0.86;
  }
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
