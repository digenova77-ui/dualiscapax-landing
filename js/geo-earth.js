import * as THREE from 'three';
const canvas=document.getElementById('geo-earth');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);
renderer.setClearColor(0x000000,0);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(36,1,0.1,20);
camera.position.z=3.35;
const w=2048,h=1024;
const field=document.createElement('canvas');
field.width=w;field.height=h;
const ftx=field.getContext('2d');
const mark=document.createElement('canvas');
mark.width=w;mark.height=h;
const mtx=mark.getContext('2d');
const PHI=(1+Math.sqrt(5))/2;

function stampWord(ctx,x,y){
  ctx.save();
  ctx.font='700 102px "IBM Plex Sans", Inter, Arial, sans-serif';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.shadowColor='#7eb6ff';
  ctx.shadowBlur=48;
  ctx.fillStyle='#9ec5ff';
  ctx.fillText('DualisCapax',x,y);
  ctx.shadowBlur=20;
  ctx.fillStyle='#f4f7ff';
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
function stampEquator(ctx,img){
  if(!img)return;
  const size=88;
  const y=h*0.5-size/2;
  ctx.drawImage(img,w*0.5-size/2,y,size,size);
  ctx.drawImage(img,-size/2,y,size,size);
  ctx.drawImage(img,w-size/2,y,size,size);
}
function dirToUV(v){
  const n=v.clone().normalize();
  let u=Math.atan2(n.z,-n.x)/(Math.PI*2);
  if(u<0)u+=1;
  return {u,v:Math.acos(Math.max(-1,Math.min(1,n.y)))/Math.PI};
}
function uToWord(u){
  return Math.min(Math.abs(u-0.25),Math.abs(u-0.75),Math.abs(u+0.75),Math.abs(u-1.25));
}
function aboveBelowWord(n){
  const uv=dirToUV(n);
  const off=Math.abs(uv.v-0.5);
  return uToWord(uv.u)<0.10 && off>0.10 && off<0.30;
}
function skipPent(n){
  if(aboveBelowWord(n))return false;
  const uv=dirToUV(n);
  if(uToWord(uv.u)<0.20 && Math.abs(uv.v-0.5)<0.08)return true;
  return false;
}
function pentStamp(n){return aboveBelowWord(n)?54:72;}
function pentAlpha(n){return aboveBelowWord(n)?0.62:0.92;}
function paintField(img,pents){
  ftx.fillStyle='#070708';
  ftx.fillRect(0,0,w,h);
  stampWord(ftx,w*0.25,h*0.5);
  stampWord(ftx,w*0.75,h*0.5);
  stampEquator(ftx,img);
  (pents||[]).forEach(function(p){
    if(skipPent(p.n))return;
    stampRing(ftx,img,dirToUV(p.n).u*w,dirToUV(p.n).v*h,pentStamp(p.n),pentAlpha(p.n));
  });
}
function paintMarks(img,pents){
  mtx.clearRect(0,0,w,h);
  stampWord(mtx,w*0.25,h*0.5);
  stampWord(mtx,w*0.75,h*0.5);
  stampEquator(mtx,img);
  (pents||[]).forEach(function(p){
    if(skipPent(p.n))return;
    stampRing(mtx,img,dirToUV(p.n).u*w,dirToUV(p.n).v*h,pentStamp(p.n),pentAlpha(p.n));
  });
}
paintField(null,[]);
paintMarks(null,[]);
const tex=new THREE.CanvasTexture(field);
tex.colorSpace=THREE.SRGBColorSpace;
tex.anisotropy=8;
const markTex=new THREE.CanvasTexture(mark);
markTex.colorSpace=THREE.SRGBColorSpace;
markTex.anisotropy=8;
const body=new THREE.Mesh(
  new THREE.SphereGeometry(0.92,96,64),
  new THREE.MeshBasicMaterial({
    map:tex,
    transparent:true,
    opacity:0.55,
    depthWrite:true
  })
);
body.renderOrder=1;
const group=new THREE.Group();
group.add(body);
scene.add(group);

const fracVert=`varying vec2 vUv;varying vec3 vPos;void main(){vUv=uv;vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fracFrag=`varying vec2 vUv;varying vec3 vPos;uniform float uTime;
void main(){
  vec2 z=vec2(vPos.x,vPos.y)*10.0;
  vec2 c=vec2(-0.745+0.035*sin(uTime*0.13),0.186+0.028*cos(uTime*0.10));
  float n=0.0;
  for(int i=0;i<28;i++){
    if(dot(z,z)>4.0)break;
    z=vec2(z.x*z.x-z.y*z.y,2.0*z.x*z.y)+c;
    n+=1.0;
  }
  float t=n/28.0;
  vec3 gold=vec3(0.88,0.72,0.29);
  vec3 blue=vec3(0.40,0.66,1.0);
  vec3 col=mix(gold,blue,clamp(t*1.2,0.0,1.0));
  col=mix(col,vec3(1.0),pow(t,7.0));
  float glow=0.18+0.55*t;
  gl_FragColor=vec4(col,glow);
}`;
const fracMat=new THREE.ShaderMaterial({
  vertexShader:fracVert,
  fragmentShader:fracFrag,
  uniforms:{uTime:{value:0}},
  transparent:true,
  blending:THREE.AdditiveBlending,
  depthWrite:false
});
const inner=new THREE.Group();
inner.renderOrder=0;
const halo=new THREE.Mesh(
  new THREE.SphereGeometry(0.32,48,32),
  new THREE.MeshBasicMaterial({
    color:0xffffff,
    transparent:true,
    opacity:0.14,
    blending:THREE.AdditiveBlending,
    depthWrite:false
  })
);
const coreGlow=new THREE.Mesh(new THREE.SphereGeometry(0.155,64,48),fracMat);
inner.add(halo);
inner.add(coreGlow);
group.add(inner);

const feedPts=[];
const RS=12;
function makeRibbon(color,opacity){
  const g=new THREE.BufferGeometry();
  const verts=RS*2;
  g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(verts*3),3));
  const idx=[];
  for(let i=0;i<RS-1;i++){
    const a=i*2,b=a+1,c=a+2,d=a+3;
    idx.push(a,b,c,b,d,c);
  }
  g.setIndex(idx);
  const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({
    color:color,
    transparent:true,
    opacity:opacity,
    blending:THREE.AdditiveBlending,
    depthWrite:false,
    side:THREE.DoubleSide
  }));
  mesh.renderOrder=2;
  group.add(mesh);
  return {g:g,mesh:mesh};
}
const blues=[];
const golds=[];
function addFeed(pt){
  feedPts.push(pt.clone());
  blues.push(makeRibbon(0x6aa8ff,0.28));
  golds.push(makeRibbon(0xe0b84a,0.22));
}
addFeed(new THREE.Vector3(0.92,0,0));
addFeed(new THREE.Vector3(-0.92,0,0));

function ribbonPath(from,now,phase){
  const dest=from.clone().setLength(0.14);
  const dir=dest.clone().sub(from);
  const up=Math.abs(from.y)<0.85?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0);
  const n1=dir.clone().cross(up).normalize();
  const n2=dir.clone().cross(n1).normalize();
  const out=[];
  for(let i=0;i<RS;i++){
    const t=i/(RS-1);
    const p=from.clone().lerp(dest,t);
    const twist=t*5.2+now*0.0018+phase;
    const rad=0.018*Math.sin(t*Math.PI);
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
    const side=new THREE.Vector3().crossVectors(tan,p).normalize().multiplyScalar(width*0.5);
    if(!isFinite(side.x))side.set(0,width*0.5,0);
    const a=p.clone().add(side);
    const b=p.clone().sub(side);
    arr[i*6]=a.x;arr[i*6+1]=a.y;arr[i*6+2]=a.z;
    arr[i*6+3]=b.x;arr[i*6+4]=b.y;arr[i*6+5]=b.z;
  }
  geo.attributes.position.needsUpdate=true;
}

function c60Points(radius){
  const phi=PHI;
  const raw=[];
  function even(x,y,z){ raw.push(x,y,z, z,x,y, y,z,x); }
  for(const s1 of [-1,1]) for(const s2 of [-1,1]) even(0,s1,s2*3*phi);
  for(const s1 of [-1,1]) for(const s2 of [-1,1]) for(const s3 of [-1,1]){
    even(s1*2,s2*(1+2*phi),s3*phi);
    even(s1,s2*(2+phi),s3*2*phi);
  }
  const pts=[];
  let max=0;
  for(let i=0;i<raw.length;i+=3){
    const v=new THREE.Vector3(raw[i],raw[i+1],raw[i+2]);
    max=Math.max(max,v.length());
    pts.push(v);
  }
  pts.forEach(v=>v.multiplyScalar(radius/max));
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
      if(pts[i].distanceTo(pts[j])<=cut){
        adj[i].push(j);adj[j].push(i);
      }
    }
  }
  return adj;
}
function pentagonFaces(pts,min){
  const adj=adjacency(pts,min);
  const seen=new Set();
  const faces=[];
  for(let a=0;a<pts.length;a++){
    for(const b of adj[a]){
      for(const c of adj[b]){
        if(c===a)continue;
        for(const d of adj[c]){
          if(d===a||d===b)continue;
          for(const e of adj[d]){
            if(e===a||e===b||e===c)continue;
            if(adj[e].indexOf(a)<0)continue;
            const key=[a,b,c,d,e].sort((p,q)=>p-q).join(',');
            if(seen.has(key))continue;
            seen.add(key);
            const verts=[a,b,c,d,e].map(i=>pts[i].clone());
            const cen=new THREE.Vector3();
            verts.forEach(v=>cen.add(v));
            cen.multiplyScalar(0.2);
            const n=cen.clone().normalize();
            let rin=Infinity;
            for(let i=0;i<5;i++){
              const A=verts[i],B=verts[(i+1)%5];
              const ab=B.clone().sub(A);
              const ap=cen.clone().sub(A);
              const dist=ap.clone().cross(ab).length()/ab.length();
              if(dist<rin)rin=dist;
            }
            faces.push({cen,n,rin,verts});
          }
        }
      }
    }
  }
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
const cagePts=c60Points(0.933);
const cageMin=edgeLength(cagePts);
const pents=pentagonFaces(cagePts,cageMin);
const cage=c60Geometry(cagePts,cageMin);
const glow=new THREE.LineSegments(cage,new THREE.LineBasicMaterial({
  color:0x6aa8ff,transparent:true,opacity:0.16,
  blending:THREE.AdditiveBlending,depthWrite:false
}));
glow.scale.setScalar(1.008);
const cageCore=new THREE.LineSegments(cage,new THREE.LineBasicMaterial({
  color:0x9ec5ff,transparent:true,opacity:0.28,
  blending:THREE.AdditiveBlending,depthWrite:false
}));
group.add(glow);
group.add(cageCore);
const shell=new THREE.Mesh(
  new THREE.SphereGeometry(0.948,96,64),
  new THREE.MeshBasicMaterial({
    map:markTex,
    transparent:true,
    depthWrite:false,
    alphaTest:0.08
  })
);
group.add(shell);

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
    if(lum<16){px[i+3]=0;}
    else if(lum<30){px[i+3]=Math.round(255*(lum-16)/14);}
  }
  ptx.putImageData(data,0,0);
  const ringTex=new THREE.CanvasTexture(punch);
  ringTex.colorSpace=THREE.SRGBColorSpace;
  pents.forEach(function(p){
    if(skipPent(p.n))return;
    const behind=aboveBelowWord(p.n);
    const fit=behind?0.52:0.72;
    const r=Math.max(0.045,p.rin*fit);
    const disc=new THREE.Mesh(
      new THREE.CircleGeometry(r,48),
      new THREE.MeshBasicMaterial({
        map:ringTex,
        transparent:true,
        opacity:behind?0.58:0.92,
        depthWrite:false,
        alphaTest:0.06,
        side:THREE.DoubleSide
      })
    );
    disc.position.copy(p.n).multiplyScalar(0.946);
    disc.lookAt(p.n.clone().multiplyScalar(2));
    group.add(disc);
    decals.push({mesh:disc,n:p.n.clone(),behind:behind});
    addFeed(disc.position);
  });
}

const ring=new Image();
ring.onload=function(){
  paintField(ring,pents);tex.needsUpdate=true;
  paintMarks(ring,pents);markTex.needsUpdate=true;
  mountRingDecals(ring);
};
ring.src='brand/emblem-helix.svg';
const OMEGA=Math.PI*2/28;
const camDir=new THREE.Vector3(0,0,1);
let last=performance.now();
function frame(now){
  const dt=Math.min(0.05,(now-last)/1000);
  last=now;
  group.rotation.y+=OMEGA*dt;
  inner.rotation.y-=2*OMEGA*dt;
  fracMat.uniforms.uTime.value=now*0.001;
  for(let i=0;i<feedPts.length;i++){
    writeRibbon(blues[i].g,ribbonPath(feedPts[i],now,0.0),0.012);
    writeRibbon(golds[i].g,ribbonPath(feedPts[i],now,Math.PI),0.010);
    const pulse=0.18+0.12*Math.abs(Math.sin(now*0.003+i));
    blues[i].mesh.material.opacity=pulse;
    golds[i].mesh.material.opacity=pulse*0.8;
  }
  for(let i=0;i<decals.length;i++){
    const wn=decals[i].n.clone().applyQuaternion(group.quaternion);
    const facing=wn.dot(camDir);
    const base=decals[i].behind?0.58:0.92;
    decals[i].mesh.material.opacity=facing<0?base*0.42:base;
  }
  halo.material.opacity=0.11+0.06*Math.abs(Math.sin(now*0.004));
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
function onResize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(w<1||h<1)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
window.addEventListener('resize',onResize);onResize();
