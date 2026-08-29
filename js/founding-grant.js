/** DualisCapax early public board — seats 11 to 100
 *  F(n) = round(1000 - (n-11) * 900 / 89)
 */
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
    var bind=document.getElementById('bind');
    if(!bind) return;
    var ps=bind.querySelectorAll('p');
    if(ps[1]) ps[1].textContent='Fuel is open. Prepaid time. Pay in crypto on the Fuel gateway. Not a seat and not onboard.';
    var br=bind.querySelector('.sec-break');
    if(br && !bind.querySelector('[data-fuel-link]')){
      var a=document.createElement('a');
      a.href='/fuel.html';
      a.setAttribute('data-fuel-link','1');
      a.textContent='Fuel';
      br.appendChild(a);
    }
    var m=document.getElementById('measure');
    if(m){
      var c=m.querySelector('.closed');
      if(c) c.innerHTML='<strong>Fuel is open.</strong> Prepaid time, crypto only. Seats and HUD Onboard stay closed.';
    }
    var nav=document.getElementById('nav-panel');
    if(nav && !nav.querySelector('[href="/fuel.html"]')){
      var n=document.createElement('a');
      n.href='/fuel.html';
      n.textContent='Fuel';
      nav.appendChild(n);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
