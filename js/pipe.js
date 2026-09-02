(function(){
  var pipe=document.getElementById('pipe');
  var tunnel=document.getElementById('tunnel');
  var stream=document.getElementById('stream');
  var leave=document.getElementById('leave');
  if(!pipe||!tunnel||!stream) return;

  var RINGS=28;
  var DEPTH=2400;
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
  function clamp(n){return Math.max(-1,Math.min(1,n))}
  pipe.addEventListener('pointermove',function(e){
    var r=pipe.getBoundingClientRect();
    lx=clamp(((e.clientX-r.left)/r.width)*2-1);
    ly=clamp(((e.clientY-r.top)/r.height)*2-1);
  });
  pipe.addEventListener('pointerleave',function(){lx=0;ly=0});

  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var speed=reduce?0:2.4;

  function wrap(z){
    if(z>180) return z-DEPTH;
    if(z<-DEPTH) return z+DEPTH;
    return z;
  }

  function tick(){
    tx+=(lx-tx)*0.06;
    ty+=(ly-ty)*0.06;
    pipe.style.setProperty('--lx',tx.toFixed(4));
    pipe.style.setProperty('--ly',ty.toFixed(4));
    var i,o,s;
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
      o.z=wrap(o.z+speed*1.15);
      o.el.style.setProperty('--z',o.z.toFixed(1)+'px');
      var near=o.z>-80&&o.z<200;
      var mid=o.z>-1400&&o.z<220;
      o.el.classList.toggle('on',mid);
      o.el.style.opacity=near?'0':(mid?'0.9':'0');
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  if(leave){
    leave.addEventListener('click',function(e){
      e.preventDefault();
      document.body.style.transition='opacity .55s';
      document.body.style.opacity='0';
      setTimeout(function(){location.replace('about:blank')},560);
    });
  }
})();
