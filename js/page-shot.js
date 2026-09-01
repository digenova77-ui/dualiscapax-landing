(function(){
  if(window.__dcPageShot) return;
  window.__dcPageShot = true;

  function css(){
    if(document.getElementById('page-shot-css')) return;
    var s=document.createElement('style');
    s.id='page-shot-css';
    s.textContent=[
      '#page-shot{position:fixed;left:max(0.75rem,env(safe-area-inset-left));bottom:max(0.6rem,env(safe-area-inset-bottom));z-index:80;',
      'min-height:1.85rem;padding:.28rem .7rem;border:1px solid rgba(158,197,255,.45);background:rgba(5,7,10,.72);',
      'color:#e8f1ff;font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:.62rem;font-weight:600;',
      'letter-spacing:.12em;text-transform:uppercase;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);cursor:pointer}',
      '#page-shot:active{border-color:#9ec5ff}'
    ].join('');
    (document.head||document.documentElement).appendChild(s);
  }

  function drawCanvas(ctx,el,dpr){
    if(!el) return;
    try{
      var r=el.getBoundingClientRect();
      if(r.width<2||r.height<2) return;
      ctx.drawImage(el, r.left*dpr, r.top*dpr, r.width*dpr, r.height*dpr);
    }catch(err){}
  }

  function label(ctx,el,dpr){
    if(!el) return;
    var r=el.getBoundingClientRect();
    if(r.width<2||r.height<2) return;
    var cs=getComputedStyle(el);
    var size=parseFloat(cs.fontSize)||16;
    ctx.save();
    ctx.fillStyle=cs.color||'#fff';
    ctx.font=(cs.fontWeight||'700')+' '+(size*dpr)+'px "IBM Plex Sans",system-ui,sans-serif';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText((el.textContent||'').replace(/\s+/g,' ').trim(), (r.left+r.width/2)*dpr, (r.top+r.height/2)*dpr);
    ctx.restore();
  }

  async function capture(){
    var btn=document.getElementById('page-shot');
    if(btn) btn.textContent='Saving\u2026';
    var dpr=Math.min(2, window.devicePixelRatio||1);
    var w=Math.max(1, window.innerWidth);
    var h=Math.max(1, window.innerHeight);
    var out=document.createElement('canvas');
    out.width=Math.round(w*dpr);
    out.height=Math.round(h*dpr);
    var ctx=out.getContext('2d');
    ctx.fillStyle='#000000';
    ctx.fillRect(0,0,out.width,out.height);
    drawCanvas(ctx, document.getElementById('quarks'), dpr);
    drawCanvas(ctx, document.getElementById('geo-earth'), dpr);
    label(ctx, document.getElementById('ntp'), dpr);
    label(ctx, document.getElementById('truth'), dpr);

    var blob=await new Promise(function(res){ out.toBlob(res,'image/png'); });
    if(!blob) throw new Error('shot failed');
    var file=new File([blob],'dualiscapax-shot.png',{type:'image/png'});
    try{
      if(navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({files:[file], title:'DualisCapax'});
        if(btn) btn.textContent='Save shot';
        return;
      }
    }catch(err){
      if(String(err && err.name)==='AbortError'){ if(btn) btn.textContent='Save shot'; return; }
    }
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;
    a.download='dualiscapax-shot.png';
    a.rel='noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
    if(btn) btn.textContent='Save shot';
  }

  function boot(){
    css();
    if(document.getElementById('page-shot')) return;
    var b=document.createElement('button');
    b.id='page-shot';
    b.type='button';
    b.textContent='Save shot';
    b.setAttribute('aria-label','Save a picture of this page');
    b.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      capture().catch(function(){ b.textContent='Save shot'; });
    });
    (document.body||document.documentElement).appendChild(b);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
