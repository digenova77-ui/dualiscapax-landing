(function(){
  function block(e){ e.preventDefault(); }
  document.addEventListener('selectstart', block, {passive:false});
  document.addEventListener('copy', block, {passive:false});
  document.addEventListener('cut', block, {passive:false});
  document.addEventListener('contextmenu', block, {passive:false});
})();
