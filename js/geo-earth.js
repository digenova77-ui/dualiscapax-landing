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
const c=document.createElement('canvas');
c.width=w;c.height=h;
const ctx=c.getContext('2d');
function stampWord(x,y){
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
function paintField(emblem){
  ctx.fillStyle='#070708';
  ctx.fillRect(0,0,w,h);
  stampWord(w*0.25,h*0.5);
  stampWord(w*0.75,h*0.5);
  if(emblem){
    const size=108;
    const y=h*0.5-size/2;
    ctx.drawImage(emblem,w*0.5-size/2,y,size,size);
    ctx.drawImage(emblem,-size/2,y,size,size);
    ctx.drawImage(emblem,w-size/2,y,size,size);
  }
}
paintField(null);
const tex=new THREE.CanvasTexture(c);
tex.colorSpace=THREE.SRGBColorSpace;
tex.anisotropy=8;
const geo=new THREE.SphereGeometry(0.92,96,64);
const body=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:tex}));
const group=new THREE.Group();group.add(body);scene.add(group);

function c60Geometry(radius){
  const phi=(1+Math.sqrt(5))/2;
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
  let min=Infinity;
  for(let i=0;i<pts.length;i++){
    for(let j=i+1;j<pts.length;j++){
      const d=pts[i].distanceTo(pts[j]);
      if(d>1e-6&&d<min)min=d;
    }
  }
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
const cage=c60Geometry(0.938);
const glow=new THREE.LineSegments(cage,new THREE.LineBasicMaterial({
  color:0x9ec5ff,transparent:true,opacity:0.38,
  blending:THREE.AdditiveBlending,depthWrite:false
}));
glow.scale.setScalar(1.01);
const core=new THREE.LineSegments(cage,new THREE.LineBasicMaterial({
  color:0xdbe6f6,transparent:true,opacity:0.88,depthWrite:false
}));
group.add(glow);group.add(core);

const emblem=new Image();
emblem.onload=function(){paintField(emblem);tex.needsUpdate=true;};
emblem.src='brand/emblem-helix.svg';
let last=performance.now();
function frame(now){const dt=Math.min(0.05,(now-last)/1000);last=now;group.rotation.y+=(Math.PI*2/28)*dt;renderer.render(scene,camera);requestAnimationFrame(frame)}
requestAnimationFrame(frame);
function onResize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(w<1||h<1)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
window.addEventListener('resize',onResize);onResize();
