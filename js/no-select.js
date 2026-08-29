(function(){
  function isField(el){
    if(!el) return false;
    var t=(el.tagName||'').toUpperCase();
    if(t==='INPUT'||t==='TEXTAREA'||t==='SELECT') return true;
    return !!(el.closest && el.closest('input,textarea,select,[contenteditable="true"]'));
  }
  function block(e){
    if(isField(e.target)) return;
    e.preventDefault();
  }
  document.addEventListener('selectstart', block, {passive:false});
  document.addEventListener('copy', block, {passive:false});
  document.addEventListener('cut', block, {passive:false});
  document.addEventListener('contextmenu', block, {passive:false});
  document.addEventListener('dragstart', block, {passive:false});
  document.addEventListener('keydown', function(e){
    if(isField(e.target)) return;
    var k=(e.key||'').toLowerCase();
    if((e.ctrlKey||e.metaKey) && (k==='c'||k==='x'||k==='a'||k==='u'||k==='s')) e.preventDefault();
  }, {passive:false});
  try{
    document.documentElement.style.webkitUserSelect='none';
    document.documentElement.style.userSelect='none';
    document.body && (document.body.style.webkitUserSelect='none');
    document.body && (document.body.style.userSelect='none');
  }catch(err){}
})();
