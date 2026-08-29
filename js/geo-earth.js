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
function stampRing(ctx,img,x,y,size){
  if(!img)return;
  ctx.save();
  ctx.globalCompositeOperation='source-over';
  ctx.drawImage(img,x-size/2,y-size/2,size,size);
  ctx.restore();
}
function stampEquator(ctx,img){
  if(!img)return;
  const size=108;
  const y=h*0.5-size/2;
  ctx.drawImage(img,w*0.5-size/2,y,size,size);
  ctx.drawImage(img,-size/2,y,size,size);
  ctx.drawImage(img,w-size/2,y,size,size);
}
function dirToUV(v){
  const n=v.clone().normalize();
  let u=Math.atan2(n.z,-n.x)/(Math.PI*2);
  if(u<0)u+=1;
  const vcoord=Math.acos(Math.max(-1,Math.min(1,n.y)))/Math.PI;
  return {u,v:vcoord};
}
const PHI=(1+Math.sqrt(5))/2;
// Pentagon centers above/below the equator helixes (helix faces ±X).
// These are the faces the arrows marked: top + bottom of the facing ball.
const pentDirs=[
  new THREE.Vector3(1,PHI,0),
  new THREE.Vector3(1,-PHI,0),
  new THREE.Vector3(-1,PHI,0),
  new THREE.Vector3(-1,-PHI,0)
];
function paintField(img){
  ftx.fillStyle='#070708';
  ftx.fillRect(0,0,w,h);
  stampWord(ftx,w*0.25,h*0.5);
  stampWord(ftx,w*0.75,h*0.5);
  stampEquator(ftx,img);
  pentDirs.forEach(function(d){
    const uv=dirToUV(d);
    stampRing(ftx,img,uv.u*w,uv.v*h,88);
  });
}
function paintMarks(img){
  mtx.clearRect(0,0,w,h);
  stampWord(mtx,w*0.25,h*0.5);
  stampWord(mtx,w*0.75,h*0.5);
  stampEquator(mtx,img);
  pentDirs.forEach(function(d){
    const uv=dirToUV(d);
    stampRing(mtx,img,uv.u*w,uv.v*h,88);
  });
}
paintField(null);
paintMarks(null);
const tex=new THREE.CanvasTexture(field);
tex.colorSpace=THREE.SRGBColorSpace;
tex.anisotropy=8;
const markTex=new THREE.CanvasTexture(mark);
markTex.colorSpace=THREE.SRGBColorSpace;
markTex.anisotropy=8;
const body=new THREE.Mesh(
  new THREE.SphereGeometry(0.92,96,64),
  new THREE.MeshBasicMaterial({map:tex})
);
const group=new THREE.Group();
group.add(body);
scene.add(group);

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
const cage=c60Geometry(cagePts,cageMin);
const glow=new THREE.LineSegments(cage,new THREE.LineBasicMaterial({
  color:0x6aa8ff,transparent:true,opacity:0.16,
  blending:THREE.AdditiveBlending,depthWrite:false
}));
glow.scale.setScalar(1.008);
const core=new THREE.LineSegments(cage,new THREE.LineBasicMaterial({
  color:0x9ec5ff,transparent:true,opacity:0.28,
  blending:THREE.AdditiveBlending,depthWrite:false
}));
group.add(glow);
group.add(core);
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

function nearestPentagonCenter(dir,pts,min){
  const n=dir.clone().normalize();
  const cut=min*1.12;
  const adj=pts.map(()=>[]);
  for(let i=0;i<pts.length;i++){
    for(let j=i+1;j<pts.length;j++){
      if(pts[i].distanceTo(pts[j])<=cut){
        adj[i].push(j);adj[j].push(i);
      }
    }
  }
  let best=null,bestDot=-2;
  const seen=new Set();
  for(let s=0;s<pts.length;s++){
    const a=s;
    for(const b of adj[a]){
      for(const c of adj[b]){
        if(c===a)continue;
        for(const d of adj[c]){
          if(d===a||d===b)continue;
          for(const e of adj[d]){
            if(e===a||e===b||e===c)continue;
            if(adj[e].indexOf(a)<0)continue;
            const idx=[a,b,c,d,e].sort((p,q)=>p-q).join(',');
            if(seen.has(idx))continue;
            seen.add(idx);
            const cen=new THREE.Vector3();
            [a,b,c,d,e].forEach(i=>cen.add(pts[i]));
            cen.multiplyScalar(0.2);
            const dot=cen.clone().normalize().dot(n);
            if(dot>bestDot){bestDot=dot;best=cen;}
          }
        }
      }
    }
  }
  return best||n.multiplyScalar(0.933);
}

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
  pentDirs.forEach(function(dir){
    const cen=nearestPentagonCenter(dir,cagePts,cageMin);
    const n=cen.clone().normalize();
    const disc=new THREE.Mesh(
      new THREE.CircleGeometry(0.118,48),
      new THREE.MeshBasicMaterial({
        map:ringTex,
        transparent:true,
        depthWrite:false,
        alphaTest:0.1,
        side:THREE.DoubleSide
      })
    );
    disc.position.copy(n).multiplyScalar(0.946);
    disc.lookAt(n.clone().multiplyScalar(2));
    group.add(disc);
    const uv=dirToUV(n);
    stampRing(ftx,img,uv.u*w,uv.v*h,88);
    stampRing(mtx,img,uv.u*w,uv.v*h,88);
  });
  tex.needsUpdate=true;
  markTex.needsUpdate=true;
}

const ring=new Image();
ring.onload=function(){
  paintField(ring);tex.needsUpdate=true;
  paintMarks(ring);markTex.needsUpdate=true;
  mountRingDecals(ring);
};
ring.src='brand/emblem-helix.svg';
let last=performance.now();
function frame(now){const dt=Math.min(0.05,(now-last)/1000);last=now;group.rotation.y+=(Math.PI*2/28)*dt;renderer.render(scene,camera);requestAnimationFrame(frame)}
requestAnimationFrame(frame);
function onResize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(w<1||h<1)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
window.addEventListener('resize',onResize);onResize();
