(function(){
  function isField(el){
    if(!el) return false;
    var t=(el.tagName||'').toUpperCase();
    if(t==='INPUT'||t==='TEXTAREA'||t==='SELECT') return true;
    return !!(el.closest && el.closest('input,textarea,select,[contenteditable="true"]'));
  }
  function isShot(el){
    if(!el) return false;
    if(el.id==='page-shot'||el.id==='geo-earth'||el.id==='quarks') return true;
    return !!(el.closest && el.closest('#page-shot'));
  }
  function block(e){
    if(isField(e.target)||isShot(e.target)) return;
    e.preventDefault();
    return false;
  }
  document.addEventListener('selectstart', block, {passive:false, capture:true});
  document.addEventListener('copy', block, {passive:false, capture:true});
  document.addEventListener('cut', block, {passive:false, capture:true});
  document.addEventListener('contextmenu', function(e){
    if(isField(e.target)||isShot(e.target)) return;
    e.preventDefault();
    return false;
  }, {passive:false, capture:true});
  document.addEventListener('dragstart', block, {passive:false, capture:true});
  document.addEventListener('mousedown', function(e){
    if(isField(e.target)||isShot(e.target)) return;
    if(e.detail > 1) e.preventDefault();
  }, {passive:false, capture:true});
  document.addEventListener('keydown', function(e){
    if(isField(e.target)||isShot(e.target)) return;
    var k=(e.key||'').toLowerCase();
    if((e.ctrlKey||e.metaKey) && (k==='c'||k==='x'||k==='a'||k==='u')) e.preventDefault();
  }, {passive:false, capture:true});
  try{
    var css = '*,*::before,*::after{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important;-webkit-tap-highlight-color:transparent}#page-shot,#geo-earth{-webkit-touch-callout:default!important}';
    var s = document.createElement('style');
    s.textContent = css;
    (document.head||document.documentElement).appendChild(s);
    document.documentElement.style.webkitUserSelect='none';
    document.documentElement.style.userSelect='none';
    if(document.body){
      document.body.style.webkitUserSelect='none';
      document.body.style.userSelect='none';
      document.body.style.webkitTouchCallout='none';
    }
  }catch(err){}
})();
