/** DualisCapax early public board — seats 11 to 100 */
window.DC_FOUNDING = {
  house: [1,10],
  early: [11,100],
  fuel11: 1000,
  fuel100: 100,
  fuelAt: function(n){
    n=Number(n);
    if(n<11||n>100) return 0;
    return Math.round(1000 - (n-11)*900/89);
  }
};
(function(){
  if(!document.documentElement.classList.contains('is-onboard')){
    document.documentElement.classList.add('pre-onboard');
  }
  var OPEN_MS = Date.UTC(2026, 7, 29, 7, 0, 0);
  function pad(n){ return String(n).padStart(2,'0'); }
  function fmtUptime(ms){
    if(ms<0) ms=0;
    var s=Math.floor(ms/1000);
    var d=Math.floor(s/86400); s%=86400;
    var h=Math.floor(s/3600); s%=3600;
    var m=Math.floor(s/60); s%=60;
    if(d>0) return d+'d '+pad(h)+'h '+pad(m)+'m';
    return pad(h)+':'+pad(m)+':'+pad(s);
  }
  function fmtLeft(ms){
    if(ms<=0) return 'NOW';
    var s=Math.floor(ms/1000);
    var m=Math.floor(s/60); s%=60;
    var h=Math.floor(m/60); m%=60;
    if(h>0) return pad(h)+':'+pad(m)+':'+pad(s);
    return pad(m)+':'+pad(s);
  }
  function tickOpen(){
    var now=Date.now();
    var up=document.getElementById('uptime');
    var foot=document.getElementById('hud-foot');
    var peg=document.getElementById('peg-clock');
    if(now<OPEN_MS){
      var left=OPEN_MS-now;
      if(up) up.textContent='T-'+fmtLeft(left);
      if(foot) foot.textContent='Opens 3:00 AM EDT';
      if(peg) peg.textContent='OPENS 3:00 AM · '+fmtLeft(left);
    } else {
      if(up) up.textContent=fmtUptime(now-OPEN_MS);
      if(foot) foot.textContent='Open · epoch 3:00 AM';
    }
  }
  function ready(){
    var o=document.querySelector('.hud-onboard');
    if(o && o.tagName!=='A'){
      var a=document.createElement('a');
      a.className='hud-donate';
      a.href='/onboard.html';
      a.textContent='Onboard now';
      o.replaceWith(a);
    }
    var bind=document.getElementById('bind');
    if(bind){
      var ps=bind.querySelectorAll('p');
      if(ps[1]) ps[1].textContent='Fuel is open. Prepaid time. Pay in crypto on the Fuel gateway.';
      var br=bind.querySelector('.sec-break');
      if(br && !bind.querySelector('[data-fuel-link]')){
        var f=document.createElement('a');
        f.href='/fuel.html';
        f.setAttribute('data-fuel-link','1');
        f.textContent='Fuel';
        br.appendChild(f);
      }
    }
    var m=document.getElementById('measure');
    if(m){
      var c=m.querySelector('.closed');
      if(c) c.innerHTML='<strong>Ontario Measure is live.</strong> Time-of-use leftover. Fuel and Residual Law stay open. Card waits on Stripe.';
      var br=m.querySelector('.sec-break');
      if(br && !m.querySelector('[data-measure-link]')){
        var s=document.createElement('a');
        s.href='/measure.html';
        s.setAttribute('data-measure-link','1');
        s.textContent='Ontario sheet';
        br.appendChild(s);
      }
    }
    var nav=document.getElementById('nav-panel');
    if(nav && !nav.querySelector('[href="/onboard.html"]')){
      var n=document.createElement('a');
      n.href='/onboard.html';
      n.textContent='Onboard';
      nav.appendChild(n);
    }
    if(nav && !nav.querySelector('[href="/measure.html"]')){
      var nm=document.createElement('a');
      nm.href='/measure.html';
      nm.textContent='Measure';
      nav.appendChild(nm);
    }
    tickOpen();
    setInterval(tickOpen, 250);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
