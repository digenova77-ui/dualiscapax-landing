window.__LAB=window.__LAB||'';
document.addEventListener('DOMContentLoaded',function(){
  var s='';
  for(var i=0;i<10;i++){ if(window['__LAB'+i]) s+=window['__LAB'+i]; }
  if(s) document.documentElement.style.setProperty('--lab','url(data:image/jpeg;base64,'+s+')');
});
