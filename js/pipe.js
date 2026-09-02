(function(){
  var pipe=document.getElementById('pipe');
  var tunnel=document.getElementById('tunnel');
  var stream=document.getElementById('stream');
  var leave=document.getElementById('leave');
  var weather=document.getElementById('weather');
  var door=document.getElementById('door');
  var world=document.getElementById('world');
  var reenter=document.getElementById('reenter');
  var grainsEl=document.getElementById('grains');
  var said=document.getElementById('said');
  var saidTitle=document.getElementById('said-title');
  var saidLine=document.getElementById('said-line');
  if(!pipe||!tunnel||!stream) return;

  var RINGS=36;
  var DEPTH=2800;
  var LAND=-420;
  var rings=[];
  for(var i=0;i<RINGS;i++){
    var el=document.createElement('div');
    var parity = (i % 2 === 0) ? ' even' : ' odd';
    var near = (i < 6) ? ' near' : '';
    el.className = 'ring' + parity + near;
    el.innerHTML = '<i class="tick"></i><i class="tick t2"></i><i class="spoke"></i>';
    tunnel.appendChild(el);
    rings.push({el:el,z:-i*(DEPTH/RINGS)});
  }

  var stations=[
    {src:'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',z:-420},
    {src:'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=80',z:-720},
    {src:'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80',z:-1020},
    {src:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1400&q=80',z:-1320},
    {src:'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1400&q=80',z:-1620},
    {src:'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=80',z:-1920},
    {src:'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1400&q=80',z:-2220},
    {src:'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=80',z:-2520},
    {src:'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1400&q=80',z:-2720}
  ].map(function(s){
    var img=document.createElement('img');
    img.className='station';
    img.src=s.src;
    img.alt='';
    stream.appendChild(img);
    return {el:img,z:s.z};
  });

  var grains=[
    {src:'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80',title:'Meet',line:'Two people. That\u2019s the start.',door:'meet'},
    {src:'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1920&q=80',title:'People',line:'People you actually know.',door:'people'},
    {src:'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80',title:'Work',line:'A team in the middle of it.',door:'work'},
    {src:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1920&q=80',title:'Out',line:'The city.',door:'out'},
    {src:'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1920&q=80',title:'School',line:'Drop-off. Real morning.',door:'school'},
    {src:'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1920&q=80',title:'Huddle',line:'Before the play.',door:'huddle'},
    {src:'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1920&q=80',title:'One',line:'One person getting better.',door:'one'},
    {src:'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1920&q=80',title:'Lab',line:'Hands in the job.',door:'lab'},
    {src:'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1920&q=80',title:'Street',line:'A street with people on it.',door:'street'}
  ];
  var grainI=4;
  var outside=false;
  var hopping=false;

  function say(){
    var g=grains[grainI]||{};
    if(saidTitle) saidTitle.textContent=g.title||'';
    if(saidLine) saidLine.textContent=g.line||'';
    if(said){
      said.hidden=!outside;
      said.classList.toggle('on',outside);
      said.setAttribute('data-beat',String(grainI+1));
    }
    wireEnter();
  }

  function wireEnter(){
    var g=grains[grainI]||{};
    var enter=document.getElementById('enter');
    var doorKey=(g.door||g.title||'school').toLowerCase();
    if(enter){
      enter.href=doorKey==='school'?'/school.html':'/join.html?door='+doorKey;
      enter.textContent='Start';
      if(outside) enter.classList.add('on');
      else enter.classList.remove('on');
    }
    if(said){
      said.classList.toggle('on',outside);
      said.hidden=!outside;
    }
    if(outside && doorKey && history && history.replaceState){
      try{history.replaceState(null,'','#'+doorKey);}catch(err){}
    }
  }

  if(grainsEl){
    grains.forEach(function(g,i){
      var b=document.createElement('button');
      b.type='button';
      b.className='grain';
      b.style.backgroundImage='url('+g.src+')';
      b.setAttribute('aria-label',g.title||'');
      b.addEventListener('click',function(e){
        e.preventDefault();
        e.stopPropagation();
        if(!outside) return;
        hop(i);
      });
      grainsEl.appendChild(b);
      g.tile=b;
    });
    grainsEl.hidden=false;
  }

  function markGrain(){
    grains.forEach(function(g,i){
      if(g.tile) g.tile.classList.toggle('on',i===grainI);
    });
  }

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
      zaps.push({x:Math.random(),y:.32+Math.random()*.36,w:.1+Math.random()*.28,a:1,gold:back?Math.random()>.25:Math.random()>.4});
    }
  }

  function hop(i,force){
    if(!world||hopping) return;
    if(i<0) i=grains.length-1;
    if(i>=grains.length) i=0;
    if(!force&&i===grainI&&outside&&world.getAttribute('src')) return;
    grainI=i;
    markGrain();
    wireEnter();
    var go=function(){ world.src=grains[grainI].src; say(); };
    if(reduce){ world.classList.remove('shift','land'); go(); return; }
    hopping=true;
    world.classList.remove('land');
    world.classList.add('shift');
    window.clearTimeout(hop._t);
    hop._t=window.setTimeout(function(){
      go();
      world.classList.remove('shift');
      world.classList.add('land');
      hop._t=window.setTimeout(function(){ world.classList.remove('land'); hopping=false; },420);
    },280);
  }

  function emerge(){
    if(!world) return;
    outside=true;
    hop(grainI,true);
    pipe.classList.add('out');
    pipe.classList.remove('gating','rush','back','held');
    snapQuarks(true,false);
    cruise=0; boost=0;
    var meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content','#0a1628');
    if(said){said.hidden=false;said.classList.add('on');}
    wireEnter();
  }

  function goTunnel(){
    outside=false;
    hopping=false;
    if(world) world.classList.remove('shift','land');
    if(said){said.hidden=true;said.classList.remove('on');}
    var enter=document.getElementById('enter');
    if(enter) enter.classList.remove('on');
    wireEnter();
    pipe.classList.remove('out');
    cruise=docked?HOLD:CRUISE;
    if(docked) pipe.classList.add('held');
    var meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content','#000000');
  }

  function rushTo(target){
    if(!target||reduce){
      if(target){ docked=target; cruise=HOLD; clearMarks(); pipe.classList.add('held'); }
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
      cruise=HOLD; boost=0; clearMarks(); busy=false;
    },820);
  }

  function gate(target){
    if(!target) return;
    if(reduce){rushTo(target);return;}
    if(busy){ rushTo(target===docked?nextStation():target); return; }
    busy=true;
    clearMarks();
    target.el.classList.add('armed');
    pipe.classList.add('gating');
    snapQuarks(false,target.z>-80);
    window.clearTimeout(gate._t);
    gate._t=window.setTimeout(function(){rushTo(target);},90);
  }

  if(door){
    door.addEventListener('click',function(e){
      e.preventDefault(); e.stopPropagation();
      if(!pipe.classList.contains('held')||outside) return;
      grainI=4; emerge();
    });
  }
  if(world){
    world.addEventListener('click',function(e){
      e.stopPropagation();
      if(!outside) return;
      hop(grainI+1);
    });
  }
  if(reenter){
    reenter.addEventListener('click',function(e){
      e.preventDefault(); e.stopPropagation();
      if(outside) goTunnel();
    });
  }

  pipe.addEventListener('click',function(e){
    if(e.target===leave||(leave&&leave.contains(e.target))) return;
    if(e.target===door||e.target===world||e.target===reenter) return;
    if(e.target&&e.target.classList&&e.target.classList.contains('grain')) return;
    if(outside) return;
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
        quarks.push({x:Math.random(),y:Math.random(),z:Math.random(),vx:(Math.random()-.5)*.0008,vy:(Math.random()-.5)*.0006,r:.6+Math.random()*1.8,gold:Math.random()>.55,dir:1,life:.35+Math.random()*.65});
      }
    }
  }
  sizeWeather();
  window.addEventListener('resize',sizeWeather);

  function drawWeather(){
    if(!weather||outside) return;
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
      ctx.fillStyle=q.gold?('rgba(232,195,106,'+(0.18+q.z*0.55)+')'):('rgba(96,165,250,'+(0.12+q.z*0.5)+')');
      if(streak){ ctx.fillRect(px-pr*.4,py-(dir>0?pr*6:0),pr*.8,pr*12); }
      else { ctx.beginPath();ctx.arc(px,py,pr,0,Math.PI*2);ctx.fill(); }
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
    if(outside){ requestAnimationFrame(tick); return; }
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
      o.el.style.opacity=String(Math.max(0.08,Math.min(0.72,(o.z+2600)/2800)));
    }
    for(i=0;i<stations.length;i++){
      o=stations[i];
      if(o===docked&&pipe.classList.contains('held')) o.z+=(LAND-o.z)*0.08;
      else o.z=wrap(o.z+speed*1.15);
      o.el.style.setProperty('--z',o.z.toFixed(1)+'px');
      near=o.z>-80&&o.z<200;
      mid=o.z>-1400&&o.z<220;
      o.el.classList.toggle('on',mid||o===docked);
      if(o===docked) o.el.style.opacity='1';
      else if(!o.el.classList.contains('armed')) o.el.style.opacity=near?'0':(mid?'0.9':'0');
    }
    drawWeather();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  if(leave){
    leave.addEventListener('click',function(e){
      e.preventDefault(); e.stopPropagation();
      document.body.style.transition='opacity .55s';
      document.body.style.opacity='0';
      setTimeout(function(){location.replace('about:blank')},560);
    });
  }

  (function bootHash(){
    var raw=(location.hash||'').replace(/^#/,'').toLowerCase();
    if(!raw) return;
    for(var i=0;i<grains.length;i++){
      var g=grains[i];
      if((g.door||g.title||'').toLowerCase()===raw){ grainI=i; emerge(); return; }
    }
  })();
})();
