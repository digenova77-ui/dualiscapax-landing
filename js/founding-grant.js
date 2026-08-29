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
      if(c) c.innerHTML='<strong>HUD is open.</strong> Fuel and Residual Law are live. Card waits on Stripe. Seats wait on a completed join.';
    }
    var nav=document.getElementById('nav-panel');
    if(nav && !nav.querySelector('[href="/onboard.html"]')){
      var n=document.createElement('a');
      n.href='/onboard.html';
      n.textContent='Onboard';
      nav.appendChild(n);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
