(function(){
  var pipe=document.getElementById('pipe');
  var tunnel=document.getElementById('tunnel');
  var stream=document.getElementById('stream');
  var leave=document.getElementById('leave');
  var weather=document.getElementById('weather');
  if(!pipe||!tunnel||!stream) return;

  var RINGS=28;
  var DEPTH=2400;
  var LAND=-420;
  var rings=[];
  for(var i=0;i<RINGS;i++){
    var el=document.createElement('div');
    el.className='ring';
    tunnel.appendChild(el);
    rings.push({el:el,z:-i*(DEPTH/RINGS)});
  }

  var stations=[
    {src:'https://images.unsplash.com/photo-1521791136064-7986c2928956?auto=format&fit=crop&w=1400&q=80',z:-900},
    {src:'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=80',z:-1600},
    {src:'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',z:-2200}
  ].map(function(s){
    var img=document.createElement('img');
    img.className='station';
    img.src=s.src;
    img.alt='';
    stream.appendChild(img);
    return {el:img,z:s.z};
  });

  var lx=0,ly=0,tx=0,ty=0;
  function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
  pipe.addEventListener('pointermove',function(e){
    var r=pipe.getBoundingClientRect();
    lx=clamp(((e.clientX-r.left)/r.width)*2-1,-1,1);
    ly=clamp(((e.clientY-r.top)/r.height)*2-1,-1,1);
  });
  pipe.addEventListener('pointerleave',function(){lx=0;ly=0});

  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CRUISE=reduce?0:2.4;
  var HOLD=reduce?0:0.35;
  var cruise=CRUISE;
  var speed=cruise;
  var boost=0;
  var busy=false;
  var docked=null;
  var quarks=[];
  var zaps=[];

  function wrap(z){
    if(z>180) return z-DEPTH;
    if(z<-DEPTH) return z+DEPTH;
    return z;
  }

  function shiftWorld(jump){
    var i;
    for(i=0;i<rings.length;i++) rings[i].z=wrap(rings[i].z+jump);
    for(i=0;i<stations.length;i++) stations[i].z=wrap(stations[i].z+jump);
  }

  function nextStation(){
    var best=null,i,o;
    for(i=0;i<stations.length;i++){
      o=stations[i];
      if(o===docked) continue;
      if(o.z<-80&&(!best||o.z>best.z)) best=o;
    }
    return best||stations[0];
  }

  function clearMarks(){
    for(var i=0;i<stations.length;i++){
      stations[i].el.classList.remove('armed');
      stations[i].el.classList.toggle('docked',stations[i]===docked);
    }
  }

  function snapQuarks(hard,back){
    var i,q,n=hard?16:7;
    for(i=0;i<quarks.length;i++){
      q=quarks[i];
      q.vx+=(Math.random()-.5)*(hard?10:4);
      q.vy+=(Math.random()-.5)*(hard?8:3);
      q.dir=back?-1:1;
      q.life=1;
    }
    for(i=0;i<n;i++){
      zaps.push({
        x:Math.random(),
        y:.32+Math.random()*.36,
        w:.1+Math.random()*.28,
        a:1,
        gold:back?Math.random()>.25:Math.random()>.4
      });
    }
  }

  function rushTo(target){
    if(!target||reduce){
      if(target){
        docked=target;
        cruise=HOLD;
        clearMarks();
      }
      return;
    }
    var back=target.z>-80;
    var jump=back?clamp(-80-target.z,-320,-180):clamp(-80-target.z,180,320);
    shiftWorld(jump);
    boost=back?-72:72;
    cruise=CRUISE;
    docked=target;
    pipe.classList.remove('gating','held');
    pipe.classList.toggle('back',back);
    pipe.classList.add('rush');
    snapQuarks(true,back);
    window.clearTimeout(rushTo._t);
    rushTo._t=window.setTimeout(function(){
      var park=LAND-target.z;
      if(Math.abs(park)>8) shiftWorld(park);
      pipe.classList.remove('rush','back');
      pipe.classList.add('held');
      cruise=HOLD;
      boost=0;
      clearMarks();
      busy=false;
    },820);
  }

  function gate(target){
    if(!target) return;
    if(reduce){rushTo(target);return;}
    if(busy){
      rushTo(target===docked?nextStation():target);
      return;
    }
    busy=true;
    clearMarks();
    target.el.classList.add('armed');
    pipe.classList.add('gating');
    snapQuarks(false,target.z>-80);
    window.clearTimeout(gate._t);
    gate._t=window.setTimeout(function(){rushTo(target);},90);
  }

  pipe.addEventListener('click',function(e){
    if(e.target===leave||(leave&&leave.contains(e.target))) return;
    var hit=null;
    if(e.target&&e.target.classList&&e.target.classList.contains('station')){
      for(var i=0;i<stations.length;i++) if(stations[i].el===e.target) hit=stations[i];
    }
    if(hit&&hit===docked) hit=nextStation();
    gate(hit||nextStation());
  });

  function sizeWeather(){
    if(!weather) return;
    var d=window.devicePixelRatio||1;
    weather.width=Math.floor(pipe.clientWidth*d);
    weather.height=Math.floor(pipe.clientHeight*d);
    weather.style.width=pipe.clientWidth+'px';
    weather.style.height=pipe.clientHeight+'px';
    var ctx=weather.getContext('2d');
    if(ctx) ctx.setTransform(d,0,0,d,0,0);
    if(!quarks.length){
      var n=reduce?24:90;
      for(var i=0;i<n;i++){
        quarks.push({
          x:Math.random(),
          y:Math.random(),
          z:Math.random(),
          vx:(Math.random()-.5)*.0008,
          vy:(Math.random()-.5)*.0006,
          r:.6+Math.random()*1.8,
          gold:Math.random()>.55,
          dir:1,
          life:.35+Math.random()*.65
        });
      }
    }
  }
  sizeWeather();
  window.addEventListener('resize',sizeWeather);

  function drawWeather(){
    if(!weather) return;
    var ctx=weather.getContext('2d');
    if(!ctx) return;
    var w=pipe.clientWidth,h=pipe.clientHeight,i,q,px,py,pr,streak,dir;
    ctx.clearRect(0,0,w,h);
    ctx.globalCompositeOperation='lighter';
    streak=Math.abs(boost)>8;
    dir=boost<0?-1:1;
    for(i=0;i<quarks.length;i++){
      q=quarks[i];
      q.x+=q.vx+(tx*.00035);
      q.y+=q.vy+(ty*.00025);
      q.z+=0.0018+(boost*0.0016);
      if(q.x<0) q.x+=1; if(q.x>1) q.x-=1;
      if(q.y<0) q.y+=1; if(q.y>1) q.y-=1;
      if(q.z>1) q.z-=1; if(q.z<0) q.z+=1;
      px=(q.x-.5)*w*(1+q.z*1.8)+w/2;
      py=(q.y-.5)*h*(1+q.z*1.4)+h*.48;
      pr=q.r*(.4+q.z*2.2);
      ctx.fillStyle=q.gold
        ?('rgba(232,195,106,'+(0.18+q.z*0.55)+')')
        :('rgba(96,165,250,'+(0.12+q.z*0.5)+')');
      if(streak){
        ctx.fillRect(px-pr*.4,py-(dir>0?pr*6:0),pr*.8,pr*12);
      }else{
        ctx.beginPath();ctx.arc(px,py,pr,0,Math.PI*2);ctx.fill();
      }
    }
    for(i=zaps.length-1;i>=0;i--){
      q=zaps[i];
      ctx.strokeStyle=q.gold?'rgba(232,195,106,'+q.a+')':'rgba(147,197,253,'+q.a+')';
      ctx.lineWidth=1+q.a*2;
      ctx.beginPath();
      ctx.moveTo((q.x-q.w)*w,q.y*h);
      ctx.lineTo((q.x+q.w)*w,(q.y+(Math.random()-.5)*.08)*h);
      ctx.stroke();
      q.a-=0.045;
      if(q.a<=0) zaps.splice(i,1);
    }
    ctx.globalCompositeOperation='source-over';
  }

  function tick(){
    tx+=(lx-tx)*0.06;
    ty+=(ly-ty)*0.06;
    pipe.style.setProperty('--lx',tx.toFixed(4));
    pipe.style.setProperty('--ly',ty.toFixed(4));
    speed=cruise+boost;
    boost*=0.94;
    if(Math.abs(boost)<0.12) boost=0;
    var i,o,s,near,mid;
    for(i=0;i<rings.length;i++){
      o=rings[i];
      o.z=wrap(o.z+speed);
      s=0.55+((o.z+DEPTH)/DEPTH)*0.7;
      o.el.style.setProperty('--z',o.z.toFixed(1)+'px');
      o.el.style.setProperty('--s',s.toFixed(3));
      o.el.style.opacity=String(Math.max(0.05,Math.min(0.55,(o.z+2200)/2400)));
    }
    for(i=0;i<stations.length;i++){
      o=stations[i];
      if(o===docked&&pipe.classList.contains('held')){
        o.z+=(LAND-o.z)*0.08;
      }else{
        o.z=wrap(o.z+speed*1.15);
      }
      o.el.style.setProperty('--z',o.z.toFixed(1)+'px');
      near=o.z>-80&&o.z<200;
      mid=o.z>-1400&&o.z<220;
      o.el.classList.toggle('on',mid||o===docked);
      if(o===docked){
        o.el.style.opacity='1';
      }else if(!o.el.classList.contains('armed')){
        o.el.style.opacity=near?'0':(mid?'0.9':'0');
      }
    }
    drawWeather();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  if(leave){
    leave.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      document.body.style.transition='opacity .55s';
      document.body.style.opacity='0';
      setTimeout(function(){location.replace('about:blank')},560);
    });
  }
})();
