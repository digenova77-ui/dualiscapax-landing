function boardFromMail(email){
  var d=String(email||'').toLowerCase().split('@')[1]||'';
  if(d==='hpedsb.on.ca'||d==='hpeschools.ca') return {id:'hpedsb',name:'Hastings and Prince Edward DSB'};
  if(d==='alcdsb.on.ca') return {id:'alcdsb',name:'Algonquin and Lakeshore Catholic DSB'};
  if(d==='limestone.on.ca'||d==='limestone.k12.on.ca') return {id:'limestone',name:'Limestone DSB'};
  return null;
}
function gradeFromText(text){
  var t=' '+String(text||'').toLowerCase().replace(/\s+/g,' ')+' ';
  if(/\bjk\b|junior kindergarten/.test(t)) return 'JK';
  if(/\bsk\b|senior kindergarten/.test(t)) return 'SK';
  var m=t.match(/\bgrade\s*([1-8])\b|\bgr\.?\s*([1-8])\b|\b([1-8])\s*[a-d]\b/);
  if(m) return 'Grade '+(m[1]||m[2]||m[3]);
  if(/\bsecondary\b|\bgrade\s*1[0-2]\b/.test(t)) return 'Secondary';
  if(/\bspec(?:ial)?\s*ed|\blst\b|learning support/.test(t)) return 'Spec Ed / LST';
  return '';
}
