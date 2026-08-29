import * as THREE from 'three';
const canvas=document.getElementById('geo-earth');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.setClearColor(0x000000,0);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(30,1,0.1,20);
camera.position.z=3.95;
const w=2048,h=1024;
const field=document.createElement('canvas');
field.width=w;field.height=h;
const ftx=field.getContext('2d');
const mark=document.createElement('canvas');
mark.width=w;mark.height=h;
const mtx=mark.getContext('2d');
const PHI=(1+Math.sqrt(5))/2;
const CAGE_R=0.933;
function onEquator(n){return Math.abs(n.y)<0.22;}

function stampWord(ctx,x,y){
  ctx.save();
  ctx.font='700 82px "IBM Plex Sans", Inter, Arial, sans-serif';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.shadowColor='rgba(255,255,255,0.85)';
  ctx.shadowBlur=18;
  ctx.fillStyle='#ffffff';
  ctx.fillText('DualisCapax',x,y);
  ctx.restore();
}
function stampRing(ctx,img,x,y,size,alpha){
  if(!img)return;
  ctx.save();
  ctx.globalAlpha=alpha==null?1:alpha;
  ctx.drawImage(img,x-size/2,y-size/2,size,size);
  ctx.restore();
}
function dirToUV(v){
  const n=v.clone().normalize();
  let u=Math.atan2(n.z,-n.x)/(Math.PI*2);
  if(u<0)u+=1;
  return {u,v:Math.acos(Math.max(-1,Math.min(1,n.y)))/Math.PI};
}
function paintField(){
  ftx.fillStyle='#050506';
  ftx.fillRect(0,0,w,h);
}
function paintMarks(img,faces){
  mtx.clearRect(0,0,w,h);
  stampWord(mtx,w*0.25,h*0.5);
  stampWord(mtx,w*0.75,h*0.5);
  (faces||[]).forEach(function(p){
    if(onEquator(p.n))return;
    const uv=dirToUV(p.n);
    stampRing(mtx,img,uv.u*w,uv.v*h,p.sides===5?52:44,0.78);
  });
}
paintField();
paintMarks(null,[]);
const tex=new THREE.CanvasTexture(field);
tex.colorSpace=THREE.SRGBColorSpace;
const markTex=new THREE.CanvasTexture(mark);
markTex.colorSpace=THREE.SRGBColorSpace;
markTex.anisotropy=8;

const group=new THREE.Group();
scene.add(group);

const ER=0.24;
const earthPaint=document.createElement('canvas');
earthPaint.width=1024;earthPaint.height=512;
{
  const c=earthPaint.getContext('2d');
  const g=c.createLinearGradient(0,0,0,512);
  g.addColorStop(0,'#0b1a3a');
  g.addColorStop(0.18,'#123a72');
  g.addColorStop(0.5,'#0c5a3a');
  g.addColorStop(0.82,'#123a72');
  g.addColorStop(1,'#0b1a3a');
  c.fillStyle=g;c.fillRect(0,0,1024,512);
  c.fillStyle='#1e7a46';
  function blob(x,y,rw,rh){c.beginPath();c.ellipse(x,y,rw,rh,0,0,Math.PI*2);c.fill();}
  blob(280,220,160,70);blob(250,250,90,50);blob(620,240,140,55);
  blob(780,280,70,40);blob(120,300,50,28);blob(430,210,70,32);
  c.fillStyle='#d8e4ef';c.fillRect(0,18,1024,36);c.fillRect(0,458,1024,36);
}
const earthFallback=new THREE.CanvasTexture(earthPaint);
earthFallback.colorSpace=THREE.SRGBColorSpace;
const earthMat=new THREE.MeshPhongMaterial({
  map:earthFallback,color:0xffffff,shininess:22,specular:new THREE.Color(0x88bbff),
  emissive:new THREE.Color(0x2a6ad4),emissiveIntensity:0.38
});
const earth=new THREE.Mesh(new THREE.SphereGeometry(ER,96,72),earthMat);
earth.renderOrder=0;
group.add(earth);
const earthCore=new THREE.Mesh(
  new THREE.SphereGeometry(ER*0.42,32,24),
  new THREE.MeshBasicMaterial({color:0xe8f4ff,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false})
);
group.add(earthCore);
const earthAtmos=new THREE.Mesh(
  new THREE.SphereGeometry(ER*1.10,64,48),
  new THREE.MeshBasicMaterial({color:0x7eb6ff,transparent:true,opacity:0.32,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending})
);
group.add(earthAtmos);
const earthHalo=new THREE.Mesh(
  new THREE.SphereGeometry(ER*1.22,48,32),
  new THREE.MeshBasicMaterial({color:0xe0b84a,transparent:true,opacity:0.12,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending})
);
group.add(earthHalo);
const loader=new THREE.TextureLoader();
loader.crossOrigin='anonymous';
loader.load('https://unpkg.com/three-globe@2.41.12/example/img/earth-blue-marble.jpg',function(t){
  t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;earthMat.map=t;earthMat.needsUpdate=true;
});

const body=new THREE.Mesh(
  new THREE.SphereGeometry(0.92,96,72),
  new THREE.MeshBasicMaterial({color:0x050506,transparent:true,opacity:0.82,depthWrite:true})
);
body.renderOrder=1;
group.add(body);

function c60Points(radius){
  const raw=[];
  function even(x,y,z){ raw.push(x,y,z, z,x,y, y,z,x); }
  for(const s1 of [-1,1]) for(const s2 of [-1,1]) even(0,s1,s2*3*PHI);
  for(const s1 of [-1,1]) for(const s2 of [-1,1]) for(const s3 of [-1,1]){
    even(s1*2,s2*(1+2*PHI),s3*PHI);
    even(s1,s2*(2+PHI),s3*2*PHI);
  }
  const pts=[];
  for(let i=0;i<raw.length;i+=3){
    pts.push(new THREE.Vector3(raw[i],raw[i+1],raw[i+2]).setLength(radius));
  }
  return pts;
}
function edgeLength(pts){
  let min=Infinity;
  for(let i=0;i<pts.length;i++){
    for(let j=i+1;j<pts.length;j++){
      const d=pts[i].distanceTo(pts[j]);
      if(d>1e-6&&d<min)min=d;
    }
  }
  return min;
}
function adjacency(pts,min){
  const cut=min*1.12;
  const adj=pts.map(()=>[]);
  for(let i=0;i<pts.length;i++){
    for(let j=i+1;j<pts.length;j++){
      if(pts[i].distanceTo(pts[j])<=cut){adj[i].push(j);adj[j].push(i);}
    }
  }
  return adj;
}
function ringFaces(pts,min,sides){
  const adj=adjacency(pts,min);
  const seen=new Set();
  const faces=[];
  function walk(start,path){
    if(path.length===sides){
      if(adj[path[sides-1]].indexOf(start)<0)return;
      const key=path.slice().sort(function(a,b){return a-b;}).join(',');
      if(seen.has(key))return;
      seen.add(key);
      const verts=path.map(function(i){return pts[i].clone();});
      const cen=new THREE.Vector3();
      verts.forEach(function(v){cen.add(v);});
      cen.multiplyScalar(1/sides);
      const n=cen.clone().normalize();
      let rin=Infinity;
      for(let i=0;i<sides;i++){
        const A=verts[i],B=verts[(i+1)%sides];
        const ab=B.clone().sub(A);
        const ap=cen.clone().sub(A);
        const dist=ap.clone().cross(ab).length()/ab.length();
        if(dist<rin)rin=dist;
      }
      faces.push({cen:cen,n:n,rin:rin,verts:verts,sides:sides});
      return;
    }
    const last=path[path.length-1];
    const links=adj[last];
    for(let k=0;k<links.length;k++){
      const nxt=links[k];
      if(path.indexOf(nxt)>=0)continue;
      walk(start,path.concat(nxt));
    }
  }
  for(let i=0;i<pts.length;i++) walk(i,[i]);
  return faces;
}
function c60Geometry(pts,min){
  const pos=[];
  const cut=min*1.12;
  for(let i=0;i<pts.length;i++){
    for(let j=i+1;j<pts.length;j++){
      if(pts[i].distanceTo(pts[j])<=cut){
        pos.push(pts[i].x,pts[i].y,pts[i].z,pts[j].x,pts[j].y,pts[j].z);
      }
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  return g;
}
const cagePts=c60Points(CAGE_R);
const cageMin=edgeLength(cagePts);
const pents=ringFaces(cagePts,cageMin,5);
const hexes=ringFaces(cagePts,cageMin,6);
const faces=pents.concat(hexes);
const cage=c60Geometry(cagePts,cageMin);
const glow=new THREE.LineSegments(cage,new THREE.LineBasicMaterial({
  color:0x6aa8ff,transparent:true,opacity:0.16,blending:THREE.AdditiveBlending,depthWrite:false
}));
const cageCore=new THREE.LineSegments(cage.clone(),new THREE.LineBasicMaterial({
  color:0x9ec5ff,transparent:true,opacity:0.28,blending:THREE.AdditiveBlending,depthWrite:false
}));
group.add(glow);group.add(cageCore);

const shell=new THREE.Mesh(
  new THREE.SphereGeometry(0.948,96,72),
  new THREE.MeshBasicMaterial({
    map:markTex,transparent:true,opacity:1,depthWrite:false,side:THREE.FrontSide
  })
);
shell.renderOrder=2;
group.add(shell);

function makeDotTex(hex){
  const c=document.createElement('canvas');c.width=64;c.height=64;
  const x=c.getContext('2d');
  const g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,hex);g.addColorStop(0.4,hex);g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.beginPath();x.arc(32,32,32,0,Math.PI*2);x.fill();
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const texBlue=makeDotTex('rgba(122,176,255,1)');
const texGold=makeDotTex('rgba(232,184,74,1)');
const SN=16;
function makeSprites(map){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(SN*3),3));
  const pts=new THREE.Points(g,new THREE.PointsMaterial({
    map:map,transparent:true,opacity:0.8,blending:THREE.AdditiveBlending,
    depthWrite:false,size:0.038,sizeAttenuation:true
  }));
  pts.renderOrder=5;group.add(pts);return {g:g,mesh:pts};
}
function makeRibbon(color,opacity){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(SN*2*3),3));
  const idx=[];
  for(let i=0;i<SN-1;i++){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c);}
  g.setIndex(idx);
  const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({
    color:color,transparent:true,opacity:opacity,blending:THREE.AdditiveBlending,
    depthWrite:false,side:THREE.DoubleSide
  }));
  mesh.renderOrder=4;group.add(mesh);return {g:g,mesh:mesh};
}
const feeds=[];
function addFeed(pt){
  feeds.push({
    from:pt.clone(),
    blue:makeRibbon(0x6aa8ff,0.20),
    gold:makeRibbon(0xe0b84a,0.16),
    sBlue:makeSprites(texBlue),
    sGold:makeSprites(texGold)
  });
}
addFeed(new THREE.Vector3(CAGE_R,0,0));
addFeed(new THREE.Vector3(-CAGE_R,0,0));
function ribbonPath(from,now,phase){
  const dest=from.clone().setLength(ER*0.55);
  const dir=dest.clone().sub(from);
  const up=Math.abs(from.y)<0.85?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0);
  const n1=dir.clone().cross(up).normalize();
  const n2=dir.clone().cross(n1).normalize();
  const out=[];
  for(let i=0;i<SN;i++){
    const t=i/(SN-1);
    const p=from.clone().lerp(dest,t*t);
    const twist=t*5.8+now*0.002+phase;
    const rad=0.016*Math.sin(t*Math.PI)*(1-t);
    p.addScaledVector(n1,Math.cos(twist)*rad);
    p.addScaledVector(n2,Math.sin(twist)*rad);
    out.push(p);
  }
  return out;
}
function writeRibbon(geo,pts,width){
  const arr=geo.attributes.position.array;
  for(let i=0;i<pts.length;i++){
    const p=pts[i];
    const q=pts[Math.min(i+1,pts.length-1)];
    const prev=pts[Math.max(i-1,0)];
    const tan=q.clone().sub(prev).normalize();
    const side=new THREE.Vector3().crossVectors(tan,p).normalize().multiplyScalar(width*0.5*(1-i/(pts.length-1)));
    if(!isFinite(side.x))side.set(0,width*0.5,0);
    const a=p.clone().add(side); const b=p.clone().sub(side);
    arr[i*6]=a.x;arr[i*6+1]=a.y;arr[i*6+2]=a.z;
    arr[i*6+3]=b.x;arr[i*6+4]=b.y;arr[i*6+5]=b.z;
  }
  geo.attributes.position.needsUpdate=true;
}
function writeSprites(geo,pts,now,offset){
  const arr=geo.attributes.position.array;
  const travel=((now*0.0018)+offset)%1;
  for(let i=0;i<pts.length;i++){
    let t=(i/(pts.length-1)+travel)%1; t=t*t;
    const p=pts[Math.min(pts.length-1,Math.floor(t*(pts.length-1)))];
    arr[i*3]=p.x;arr[i*3+1]=p.y;arr[i*3+2]=p.z;
  }
  geo.attributes.position.needsUpdate=true;
}

const decals=[];
function mountRingDecals(img){
  const punch=document.createElement('canvas');
  punch.width=192;punch.height=192;
  const ptx=punch.getContext('2d');
  ptx.drawImage(img,0,0,192,192);
  const data=ptx.getImageData(0,0,192,192);
  const px=data.data;
  for(let i=0;i<px.length;i+=4){
    const lum=0.21*px[i]+0.72*px[i+1]+0.07*px[i+2];
    if(lum<16)px[i+3]=0;
    else if(lum<30)px[i+3]=Math.round(255*(lum-16)/14);
  }
  ptx.putImageData(data,0,0);
  const ringTex=new THREE.CanvasTexture(punch);
  ringTex.colorSpace=THREE.SRGBColorSpace;
  faces.forEach(function(p){
    if(onEquator(p.n))return;
    const fit=p.sides===5?0.70:0.58;
    const r=Math.max(0.038,p.rin*fit);
    const disc=new THREE.Mesh(
      new THREE.CircleGeometry(r,48),
      new THREE.MeshBasicMaterial({
        map:ringTex,transparent:true,opacity:0.82,
        depthWrite:false,side:THREE.FrontSide
      })
    );
    disc.position.copy(p.n).multiplyScalar(0.946);
    disc.lookAt(p.n.clone().multiplyScalar(2));
    disc.renderOrder=3;
    group.add(disc);
    decals.push({mesh:disc,n:p.n.clone()});
  });
}

const ring=new Image();
ring.onload=function(){
  paintMarks(ring,faces);markTex.needsUpdate=true;
  mountRingDecals(ring);
};
ring.src='brand/emblem-helix.svg';

scene.add(new THREE.AmbientLight(0x8aa0bc,0.85));
const sun=new THREE.DirectionalLight(0xfff4e6,1.7);
sun.position.set(-2.2,0.55,2.4);scene.add(sun);
const fill=new THREE.DirectionalLight(0x4a8fd8,0.55);
fill.position.set(2.4,-0.4,-1.2);scene.add(fill);
const ribbonLight=new THREE.PointLight(0xb7d6ff,1.4,1.8);
ribbonLight.position.set(0,0,0);
group.add(ribbonLight);
const goldLight=new THREE.PointLight(0xe0b84a,0.7,1.5);
goldLight.position.set(0,0,0);
group.add(goldLight);

const OMEGA=Math.PI*2/28;
let last=performance.now();
function frame(now){
  const dt=Math.min(0.05,(now-last)/1000);
  last=now;
  group.rotation.y+=OMEGA*dt;
  earth.rotation.y+=OMEGA*dt*0.35;
  let energy=0;
  for(let i=0;i<feeds.length;i++){
    const f=feeds[i];
    const bluePath=ribbonPath(f.from,now,0);
    const goldPath=ribbonPath(f.from,now,Math.PI);
    writeRibbon(f.blue.g,bluePath,0.010);
    writeRibbon(f.gold.g,goldPath,0.008);
    writeSprites(f.sBlue.g,bluePath,now,i*0.13);
    writeSprites(f.sGold.g,goldPath,now,i*0.13+0.5);
    const pulse=0.16+0.14*Math.abs(Math.sin(now*0.0028+i));
    energy+=pulse;
    f.blue.mesh.material.opacity=pulse;
    f.gold.mesh.material.opacity=pulse*0.85;
    f.sBlue.mesh.material.opacity=0.55+pulse;
    f.sGold.mesh.material.opacity=0.48+pulse*0.9;
  }
  energy=feeds.length?energy/feeds.length:0.2;
  ribbonLight.intensity=1.1+energy*2.2;
  goldLight.intensity=0.45+energy*1.35;
  earthMat.emissiveIntensity=0.32+energy*0.85;
  earthAtmos.material.opacity=0.26+energy*0.42;
  earthHalo.material.opacity=0.10+energy*0.28;
  earthCore.material.opacity=0.42+energy*0.45;
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
function onResize(){
  const box=canvas.getBoundingClientRect();
  const s=Math.max(1,Math.round(Math.min(box.width||canvas.clientWidth,box.height||canvas.clientHeight)));
  renderer.setSize(s,s,false);
  camera.aspect=1;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize',onResize);onResize();
