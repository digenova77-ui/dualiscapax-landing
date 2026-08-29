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
    opacity:0.84,
    depthWrite:true
  })
);
body.renderOrder=1;
const group=new THREE.Group();
group.add(body);
scene.add(group);

const inner=new THREE.Group();
inner.renderOrder=0;
const veil=new THREE.Mesh(
  new THREE.SphereGeometry(0.68,48,32),
  new THREE.MeshBasicMaterial({
    color:0x3d6fb8,
    transparent:true,
    opacity:0.08,
    blending:THREE.AdditiveBlending,
    depthWrite:false
  })
);
const mid=new THREE.Mesh(
  new THREE.SphereGeometry(0.46,40,28),
  new THREE.MeshBasicMaterial({
    color:0x6aa8ff,
    transparent:true,
    opacity:0.06,
    blending:THREE.AdditiveBlending,
    depthWrite:false
  })
);
const ember=new THREE.Mesh(
  new THREE.SphereGeometry(0.24,32,24),
  new THREE.MeshBasicMaterial({
    color:0xb8923a,
    transparent:true,
    opacity:0.10,
    blending:THREE.AdditiveBlending,
    depthWrite:false
  })
);
inner.add(veil);
inner.add(mid);
inner.add(ember);
group.add(inner);

const feedPts=[];
const BOLT_SEGS=9;
function makeFeedLine(color,opacity){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(BOLT_SEGS*3),3));
  const line=new THREE.Line(g,new THREE.LineBasicMaterial({
    color:color,
    transparent:true,
    opacity:opacity,
    blending:THREE.AdditiveBlending,
    depthWrite:false
  }));
  line.renderOrder=2;
  group.add(line);
  return {g:g,line:line};
}
const spokes=[];
const bolts=[];
const bolts2=[];
function addFeed(pt){
  feedPts.push(pt.clone());
  spokes.push(makeFeedLine(0x6aa8ff,0.09));
  bolts.push(makeFeedLine(0xb8dcff,0.18));
  bolts2.push(makeFeedLine(0x7eb6ff,0.12));
}
addFeed(new THREE.Vector3(0.92,0,0));
addFeed(new THREE.Vector3(-0.92,0,0));

function writeLine(geo,pts){
  const arr=geo.attributes.position.array;
  for(let i=0;i<BOLT_SEGS;i++){
    const p=pts[Math.min(i,pts.length-1)];
    arr[i*3]=p.x;arr[i*3+1]=p.y;arr[i*3+2]=p.z;
  }
  geo.attributes.position.needsUpdate=true;
}
function spokePts(from){
  const out=[];
  for(let i=0;i<BOLT_SEGS;i++){
    const t=i/(BOLT_SEGS-1);
    out.push(from.clone().multiplyScalar(1-t*0.78));
  }
  return out;
}
function boltPts(from,now,phase){
  const dest=from.clone().multiplyScalar(0.22);
  const dir=dest.clone().sub(from);
  const up=Math.abs(dir.y)<0.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0);
  const n1=dir.clone().cross(up).normalize();
  const n2=dir.clone().cross(n1).normalize();
  const out=[];
  const seed=(now*0.013+from.x*12.7+from.y*7.1+phase)%1;
  for(let i=0;i<BOLT_SEGS;i++){
    const t=i/(BOLT_SEGS-1);
    const p=from.clone().lerp(dest,t);
    if(i>0&&i<BOLT_SEGS-1){
      const jag=(1-Math.abs(2*t-1))*0.058;
      const a=Math.sin((t*11+seed*6.28+now*0.01)*1.7);
      const b=Math.cos((t*9+seed*4.2+now*0.013)*1.3);
      p.addScaledVector(n1,a*jag);
      p.addScaledVector(n2,b*jag*0.7);
    }
    out.push(p);
  }
  return out;
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
  for(let i=0;i<feedPts.length;i++){
    writeLine(spokes[i].g,spokePts(feedPts[i]));
    writeLine(bolts[i].g,boltPts(feedPts[i],now,0));
    writeLine(bolts2[i].g,boltPts(feedPts[i],now,0.37));
    const flick=0.11+0.12*Math.abs(Math.sin(now*0.011+i*1.7));
    bolts[i].line.material.opacity=flick;
    bolts2[i].line.material.opacity=flick*0.7;
  }
  for(let i=0;i<decals.length;i++){
    const wn=decals[i].n.clone().applyQuaternion(group.quaternion);
    const facing=wn.dot(camDir);
    const base=decals[i].behind?0.58:0.92;
    decals[i].mesh.material.opacity=facing<0?base*0.42:base;
  }
  ember.material.opacity=0.08+0.04*Math.abs(Math.sin(now*0.006));
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
function onResize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(w<1||h<1)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
window.addEventListener('resize',onResize);onResize();
