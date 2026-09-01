import * as THREE from 'three';
const canvas=document.getElementById('geo-earth');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.setClearColor(0x000000,0);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(30,1,0.1,20);
camera.position.z=3.95;
const w=2048,h=1024;
const mark=document.createElement('canvas');
mark.width=w;mark.height=h;
const mtx=mark.getContext('2d');
const R=0.93;
function stampWord(ctx,text,x,y,size){
  ctx.save();
  ctx.font='700 '+(size||118)+'px "IBM Plex Sans", Inter, Arial, sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineJoin='round'; ctx.miterLimit=2;
  ctx.lineWidth=Math.max(4, size*0.045);
  ctx.strokeStyle='rgba(0,0,0,0.88)'; ctx.strokeText(text,x,y);
  ctx.shadowColor='rgba(232,184,74,0.72)'; ctx.shadowBlur=16;
  ctx.fillStyle='#f4f8ff'; ctx.fillText(text,x,y);
  ctx.shadowBlur=0; ctx.fillStyle='#ffffff'; ctx.fillText(text,x,y);
  ctx.restore();
}
function drawHelix(ctx,cx,cy,hgt){
  const hh=hgt*0.52, ww=hgt*0.42;
  ctx.save(); ctx.translate(cx,cy);
  ctx.strokeStyle='rgba(244,208,96,0.98)'; ctx.lineWidth=Math.max(3,hgt*0.055); ctx.lineCap='round';
  ctx.beginPath();
  for(let i=0;i<=24;i++){ const t=i/24, y=-hh+t*hh*2, x=Math.sin(t*Math.PI*2)*ww; if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }
  ctx.stroke();
  ctx.strokeStyle='rgba(196,148,36,0.98)';
  ctx.beginPath();
  for(let i=0;i<=24;i++){ const t=i/24, y=-hh+t*hh*2, x=Math.sin(t*Math.PI*2+Math.PI)*ww; if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }
  ctx.stroke();
  ctx.lineWidth=Math.max(2,hgt*0.03); ctx.strokeStyle='rgba(255,228,150,0.78)';
  for(let i=1;i<=6;i++){ const t=i/7, y=-hh+t*hh*2; const a=Math.sin(t*Math.PI*2)*ww, b=Math.sin(t*Math.PI*2+Math.PI)*ww; ctx.beginPath(); ctx.moveTo(a,y); ctx.lineTo(b,y); ctx.stroke(); }
  ctx.restore();
}
function paintBand(ctx,cx,y,size){
  ctx.save(); ctx.font='700 '+size+'px "IBM Plex Sans", Inter, Arial, sans-serif';
  const dw=ctx.measureText('Dualis').width; const cw=ctx.measureText('Capax').width;
  const gap=Math.max(size*1.15, 96); const helix=Math.min(gap*1.08, size*1.22);
  stampWord(ctx,'Dualis',cx-(dw/2+gap/2),y,size); drawHelix(ctx,cx,y,helix); stampWord(ctx,'Capax',cx+(cw/2+gap/2),y,size);
  ctx.restore();
}
function paintMarks(){ mtx.clearRect(0,0,w,h); paintBand(mtx, w*0.25, h*0.5, 118); paintBand(mtx, w*0.75, h*0.5, 118); }
paintMarks();
const markTex=new THREE.CanvasTexture(mark); markTex.colorSpace=THREE.SRGBColorSpace; markTex.anisotropy=8;
const group=new THREE.Group(); group.rotation.y=0; scene.add(group);
const ER=0.26;
const earthPaint=document.createElement('canvas'); earthPaint.width=1024; earthPaint.height=512;
{ const c=earthPaint.getContext('2d'); const g=c.createLinearGradient(0,0,0,512);
  g.addColorStop(0,'#0b1a3a'); g.addColorStop(0.18,'#123a72'); g.addColorStop(0.5,'#0c5a3a'); g.addColorStop(0.82,'#123a72'); g.addColorStop(1,'#0b1a3a');
  c.fillStyle=g; c.fillRect(0,0,1024,512); c.fillStyle='#1e7a46';
  function blob(x,y,rw,rh){c.beginPath();c.ellipse(x,y,rw,rh,0,0,Math.PI*2);c.fill();}
  blob(280,220,160,70);blob(250,250,90,50);blob(620,240,140,55);blob(780,280,70,40);blob(120,300,50,28);blob(430,210,70,32);
  c.fillStyle='#d8e4ef'; c.fillRect(0,18,1024,36); c.fillRect(0,458,1024,36); }
const earthFallback=new THREE.CanvasTexture(earthPaint); earthFallback.colorSpace=THREE.SRGBColorSpace;
const earthMat=new THREE.MeshPhongMaterial({ map:earthFallback,color:0xffffff,shininess:28,specular:new THREE.Color(0xf0d48a), emissive:new THREE.Color(0xb8862a),emissiveIntensity:0.48 });
const earth=new THREE.Mesh(new THREE.SphereGeometry(ER,96,72),earthMat); earth.renderOrder=0; group.add(earth);
group.add(new THREE.Mesh(new THREE.SphereGeometry(ER*0.48,32,24), new THREE.MeshBasicMaterial({color:0xffe7a0,transparent:true,opacity:0.78,blending:THREE.AdditiveBlending,depthWrite:false})));
const earthAtmos=new THREE.Mesh(new THREE.SphereGeometry(ER*1.14,64,48), new THREE.MeshBasicMaterial({color:0xe8c45a,transparent:true,opacity:0.36,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending})); group.add(earthAtmos);
const earthHalo=new THREE.Mesh(new THREE.SphereGeometry(ER*1.28,48,32), new THREE.MeshBasicMaterial({color:0xe8c45a,transparent:true,opacity:0.34,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending})); group.add(earthHalo);
const earthCore=earthAtmos;
new THREE.TextureLoader().load('https://unpkg.com/three-globe@2.41.12/example/img/earth-blue-marble.jpg',function(t){ t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;earthMat.map=t;earthMat.needsUpdate=true; });
const GEO_DETAIL=3; const bodyGeo=new THREE.IcosahedronGeometry(R, GEO_DETAIL);
const body=new THREE.Mesh(bodyGeo, new THREE.MeshPhongMaterial({ color:0x071018, emissive:new THREE.Color(0x2a1c08), specular:new THREE.Color(0xc4a035), shininess:26, flatShading:true, transparent:true, opacity:0.22, depthWrite:false }));
body.renderOrder=1; group.add(body);
const edges=new THREE.LineSegments(new THREE.EdgesGeometry(bodyGeo, 1), new THREE.LineBasicMaterial({ color:0xe0b84a, transparent:true, opacity:0.78, depthWrite:false }));
edges.renderOrder=3; edges.scale.setScalar(1.003); group.add(edges);
const limb=new THREE.Mesh(new THREE.IcosahedronGeometry(R+0.01, GEO_DETAIL), new THREE.MeshBasicMaterial({ color:0xe8c45a,transparent:true,opacity:0.28,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending }));
limb.renderOrder=1; group.add(limb);
const shell=new THREE.Mesh(new THREE.SphereGeometry(R+0.016, 96, 72), new THREE.MeshBasicMaterial({ map:markTex,transparent:true,opacity:1,depthWrite:false,side:THREE.FrontSide }));
shell.renderOrder=2; group.add(shell);
function makeDotTex(hex){ const c=document.createElement('canvas');c.width=64;c.height=64; const x=c.getContext('2d'); const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,hex);g.addColorStop(0.4,hex);g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g;x.beginPath();x.arc(32,32,32,0,Math.PI*2);x.fill(); const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t; }
const texGold=makeDotTex('rgba(232,184,74,1)'); const texWarm=makeDotTex('rgba(244,208,96,1)'); const SN=18;
function makeSprites(map){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(SN*3),3)); const pts=new THREE.Points(g,new THREE.PointsMaterial({ map:map,transparent:true,opacity:0.85,blending:THREE.AdditiveBlending, depthWrite:false,size:0.042,sizeAttenuation:true })); pts.renderOrder=5;group.add(pts);return {g:g,mesh:pts}; }
function makeRibbon(color,opacity){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(SN*2*3),3)); const idx=[]; for(let i=0;i<SN-1;i++){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c);} g.setIndex(idx); const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({ color:color,transparent:true,opacity:opacity,blending:THREE.AdditiveBlending, depthWrite:false,side:THREE.DoubleSide })); mesh.renderOrder=4;group.add(mesh);return {g:g,mesh:mesh}; }
const feeds=[]; function addFeed(pt){ feeds.push({ from:pt.clone(), blue:makeRibbon(0xd4a84a,0.22), gold:makeRibbon(0xf4d060,0.34), sBlue:makeSprites(texWarm), sGold:makeSprites(texGold) }); }
addFeed(new THREE.Vector3(R,0,0)); addFeed(new THREE.Vector3(-R,0,0));
function ribbonPath(from,now,phase){ const dest=from.clone().setLength(ER*0.92); const dir=dest.clone().sub(from); const up=Math.abs(from.y)<0.85?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0); const n1=dir.clone().cross(up).normalize(); const n2=dir.clone().cross(n1).normalize(); const out=[]; for(let i=0;i<SN;i++){ const t=i/(SN-1); const p=from.clone().lerp(dest,t*t); const twist=t*5.8+now*0.002+phase; const rad=0.018*Math.sin(t*Math.PI)*(1-t); p.addScaledVector(n1,Math.cos(twist)*rad); p.addScaledVector(n2,Math.sin(twist)*rad); out.push(p);} return out; }
function writeRibbon(geo,pts,width){ const arr=geo.attributes.position.array; for(let i=0;i<pts.length;i++){ const p=pts[i]; const q=pts[Math.min(i+1,pts.length-1)]; const prev=pts[Math.max(i-1,0)]; const tan=q.clone().sub(prev).normalize(); const side=new THREE.Vector3().crossVectors(tan,p).normalize().multiplyScalar(width*0.5*(1-i/(pts.length-1))); if(!isFinite(side.x))side.set(0,width*0.5,0); const a=p.clone().add(side); const b=p.clone().sub(side); arr[i*6]=a.x;arr[i*6+1]=a.y;arr[i*6+2]=a.z; arr[i*6+3]=b.x;arr[i*6+4]=b.y;arr[i*6+5]=b.z; } geo.attributes.position.needsUpdate=true; }
function writeSprites(geo,pts,now,offset){ const arr=geo.attributes.position.array; const travel=((now*0.0018)+offset)%1; for(let i=0;i<pts.length;i++){ let t=(i/(pts.length-1)+travel)%1; t=t*t; const p=pts[Math.min(pts.length-1,Math.floor(t*(pts.length-1)))]; arr[i*3]=p.x;arr[i*3+1]=p.y;arr[i*3+2]=p.z; } geo.attributes.position.needsUpdate=true; }

/* LOCKSCREEN RING + INFINITY DNA  — ring OUTSIDE cage, figure-8 DNA INSIDE cage */
const RING_R=R*1.20;
function paintRingTex(){
  const c=document.createElement('canvas'); c.width=1024; c.height=64;
  const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,1024,0);
  g.addColorStop(0,'#e8b84a'); g.addColorStop(0.22,'#f0d060');
  g.addColorStop(0.50,'#4ec8ff'); g.addColorStop(0.78,'#1e8cff'); g.addColorStop(1,'#e8b84a');
  x.fillStyle=g; x.fillRect(0,0,1024,64);
  x.fillStyle='rgba(255,255,255,0.28)'; x.fillRect(0,18,1024,8);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=THREE.RepeatWrapping; t.anisotropy=8; return t;
}
const ringTex=paintRingTex();
const ringPivot=new THREE.Group();
ringPivot.rotation.x=Math.PI/2;
const ring=new THREE.Mesh(
  new THREE.TorusGeometry(RING_R,0.022,20,160),
  new THREE.MeshBasicMaterial({ map:ringTex, transparent:true, opacity:0.96, depthWrite:false, blending:THREE.AdditiveBlending })
);
ring.renderOrder=6;
const ringGlow=new THREE.Mesh(
  new THREE.TorusGeometry(RING_R,0.038,16,128),
  new THREE.MeshBasicMaterial({ color:0x7ec8ff, transparent:true, opacity:0.22, depthWrite:false, blending:THREE.AdditiveBlending })
);
ringGlow.renderOrder=5;
ringPivot.add(ring); ringPivot.add(ringGlow);
group.add(ringPivot);

function fig8(t,a){
  return new THREE.Vector3(a*Math.sin(2*t)*0.55, a*Math.sin(t), 0);
}
function fig8Frame(t,a){
  const p=fig8(t,a);
  const q=fig8(t+0.01,a);
  const tan=q.clone().sub(p).normalize();
  const up=new THREE.Vector3(0,0,1);
  let n=new THREE.Vector3().crossVectors(tan,up);
  if(n.lengthSq()<1e-8) n=new THREE.Vector3().crossVectors(tan,new THREE.Vector3(1,0,0));
  n.normalize();
  const b=new THREE.Vector3().crossVectors(tan,n).normalize();
  return {p,n,b,tan};
}
function strandPts(phase,a,twistAmp,count){
  const out=[];
  for(let i=0;i<=count;i++){
    const t=(i/count)*Math.PI*2;
    const f=fig8Frame(t,a);
    const twist=Math.sin(t*3+phase)*twistAmp;
    out.push(f.p.clone().addScaledVector(f.n,twist).addScaledVector(f.b,Math.cos(t*3+phase)*twistAmp*0.35));
  }
  return out;
}
function tubeFromPts(pts,color,radius){
  const curve=new THREE.CatmullRomCurve3(pts,true, 'catmullrom', 0.12);
  const mesh=new THREE.Mesh(
    new THREE.TubeGeometry(curve,160,radius,8,true),
    new THREE.MeshPhongMaterial({ color, emissive:new THREE.Color(color), emissiveIntensity:0.55, shininess:40, transparent:true, opacity:0.96 })
  );
  mesh.renderOrder=4;
  return mesh;
}
const DNA_A=0.46;
const goldStrand=tubeFromPts(strandPts(0,DNA_A,0.055,80),0xe8c45a,0.016);
const blueStrand=tubeFromPts(strandPts(Math.PI,DNA_A,0.055,80),0x2b9bff,0.016);
group.add(goldStrand); group.add(blueStrand);
const rungMat=new THREE.MeshPhongMaterial({ color:0xcfd8e6, emissive:new THREE.Color(0x334455), shininess:20 });
const nodeColors=[0xe24b4b,0x3d9be9,0x2a9b5c,0xe8a317,0x111111,0x3d9be9,0xe24b4b,0x2a9b5c];
for(let i=0;i<8;i++){
  const t=(i+0.5)/8*Math.PI*2;
  const a=fig8Frame(t,DNA_A);
  const twist=0.055;
  const p1=a.p.clone().addScaledVector(a.n, Math.sin(t*3)*twist);
  const p2=a.p.clone().addScaledVector(a.n, Math.sin(t*3+Math.PI)*twist);
  const len=p1.distanceTo(p2);
  const mid=p1.clone().add(p2).multiplyScalar(0.5);
  const rung=new THREE.Mesh(new THREE.CylinderGeometry(0.007,0.007,Math.max(0.02,len),8), rungMat);
  rung.position.copy(mid);
  rung.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), p2.clone().sub(p1).normalize());
  rung.renderOrder=4;
  group.add(rung);
  const n1=new THREE.Mesh(new THREE.SphereGeometry(0.022,16,12), new THREE.MeshPhongMaterial({ color:nodeColors[i], emissive:new THREE.Color(nodeColors[i]), emissiveIntensity:0.35, shininess:50 }));
  n1.position.copy(p1); n1.renderOrder=5; group.add(n1);
  const n2=new THREE.Mesh(new THREE.SphereGeometry(0.022,16,12), new THREE.MeshPhongMaterial({ color:nodeColors[(i+3)%nodeColors.length], emissive:new THREE.Color(nodeColors[(i+3)%nodeColors.length]), emissiveIntensity:0.35, shininess:50 }));
  n2.position.copy(p2); n2.renderOrder=5; group.add(n2);
}

scene.add(new THREE.AmbientLight(0x2a2210,0.62));
const sun=new THREE.DirectionalLight(0xffffff,0.7); sun.position.set(-2.2,0.8,2.6); scene.add(sun);
const fill=new THREE.DirectionalLight(0x8a6a28,0.42); fill.position.set(2.2,-0.6,-1.4); scene.add(fill);
const rimLight=new THREE.DirectionalLight(0xf0d48a,1.05); rimLight.position.set(0.2,0.4,-2.4); scene.add(rimLight);
const ribbonLight=new THREE.PointLight(0xe8c45a,2.1,2.1); ribbonLight.position.set(0,0,0); group.add(ribbonLight);
const goldLight=new THREE.PointLight(0xffe08a,1.35,1.9); goldLight.position.set(0,0,0); group.add(goldLight);
const OMEGA=Math.PI*2/28; const RING_OMEGA=Math.PI*2/9; const HOLD=1600; const born=performance.now(); let last=performance.now();
function frame(now){ const dt=Math.min(0.05,(now-last)/1000); last=now; if(now-born>HOLD) group.rotation.y+=OMEGA*dt; earth.rotation.y+=OMEGA*dt*0.35; ringPivot.rotation.z+=RING_OMEGA*dt; let energy=0; for(let i=0;i<feeds.length;i++){ const f=feeds[i]; const bluePath=ribbonPath(f.from,now,0); const goldPath=ribbonPath(f.from,now,Math.PI); writeRibbon(f.blue.g,bluePath,0.012); writeRibbon(f.gold.g,goldPath,0.009); writeSprites(f.sBlue.g,bluePath,now,i*0.13); writeSprites(f.sGold.g,goldPath,now,i*0.13+0.5); const pulse=0.22+0.16*Math.abs(Math.sin(now*0.0028+i)); energy+=pulse; f.blue.mesh.material.opacity=pulse; f.gold.mesh.material.opacity=pulse*0.85; f.sBlue.mesh.material.opacity=0.6+pulse; f.sGold.mesh.material.opacity=0.52+pulse*0.9; } energy=feeds.length?energy/feeds.length:0.25; ribbonLight.intensity=1.4+energy*2.4; goldLight.intensity=0.55+energy*1.5; earthMat.emissiveIntensity=0.55+energy*0.95; earthAtmos.material.opacity=0.34+energy*0.38; earthHalo.material.opacity=0.14+energy*0.28; limb.material.opacity=0.24+energy*0.22; renderer.render(scene,camera); requestAnimationFrame(frame); }
requestAnimationFrame(frame);
function onResize(){ const box=canvas.getBoundingClientRect(); const s=Math.max(1,Math.round(Math.min(box.width||canvas.clientWidth,box.height||canvas.clientHeight))); renderer.setSize(s,s,false); camera.aspect=1; camera.updateProjectionMatrix(); }
window.addEventListener('resize',onResize);onResize();
