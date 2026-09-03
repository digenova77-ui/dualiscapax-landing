/* DualisCapax seat-law overlay. Does not replace the pipe. Remaps grain copy after emerge. */
(function(){
  var ORDER=[
    {title:'You',line:'A person. Leftover hours still cost.',href:'/portal.html',door:'you'},
    {title:'People',line:'People you know. Same peg as a firm.',href:'/portal.html',door:'people'},
    {title:'Firm',line:'A company is a desk. It still has to invert the number.',href:'/onboard.html',door:'work'},
    {title:'Corp',line:'A corporation does not buy a softer product.',href:'/corporate.html',door:'corp'},
    {title:'School',line:'A board is targeted, not signed.',href:'/schools.html',door:'school'},
    {title:'Huddle',line:'A team quarrel is leftover until it inverts.',href:'/onboard.html',door:'huddle'},
    {title:'One',line:'One person getting better is still a seat.',href:'/portal.html',door:'one'},
    {title:'Lab',line:'Hands in the job. Measure the leak.',href:'/onboard.html',door:'lab'},
    {title:'Street',line:'What helps and what does not is public.',href:'/actors.html',door:'street'}
  ];
  function idxFromHash(){
    var raw=(location.hash||'').replace(/^#/,'').toLowerCase();
    for(var i=0;i<ORDER.length;i++) if(ORDER[i].door===raw||ORDER[i].title.toLowerCase()===raw) return i;
    return -1;
  }
  function current(){
    var i=idxFromHash();
    if(i>=0) return i;
    var on=document.querySelectorAll('.grain.on');
    if(on.length){
      var all=document.querySelectorAll('.grain');
      for(i=0;i<all.length;i++) if(all[i].classList.contains('on')) return i;
    }
    return 4;
  }
  function apply(){
    var i=current();
    var g=ORDER[i]||ORDER[4];
    var title=document.getElementById('said-title');
    var line=document.getElementById('said-line');
    var enter=document.getElementById('enter');
    var tiles=document.querySelectorAll('.grain');
    if(title) title.textContent=g.title;
    if(line) line.textContent=g.line;
    if(enter){ enter.href=g.href; enter.textContent='Onboard'; }
    for(var t=0;t<tiles.length && t<ORDER.length;t++){
      tiles[t].setAttribute('aria-label',ORDER[t].title);
    }
  }
  document.addEventListener('click',function(){ window.setTimeout(apply,320); },true);
  window.addEventListener('hashchange',apply);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply);
  else apply();
})();
