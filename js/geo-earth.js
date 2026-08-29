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
const emblem=new Image();
emblem.onload=function(){paintField(emblem);tex.needsUpdate=true;};
emblem.src='brand/emblem-helix.svg';
let last=performance.now();
function frame(now){const dt=Math.min(0.05,(now-last)/1000);last=now;group.rotation.y+=(Math.PI*2/28)*dt;renderer.render(scene,camera);requestAnimationFrame(frame)}
requestAnimationFrame(frame);
function onResize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(w<1||h<1)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
window.addEventListener('resize',onResize);onResize();
