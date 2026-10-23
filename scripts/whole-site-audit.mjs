#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const root=process.cwd(), skip=new Set([".git","node_modules",".next","dist","build","coverage",".wrangler"]);
const exts=new Set([".html",".htm",".js",".mjs",".cjs",".ts",".tsx",".jsx",".css",".json",".jsonl",".md",".mdx",".yml",".yaml",".toml",".xml",".svg",".txt",".sql",".sh",".py"]);
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(skip.has(e.name))continue;const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(exts.has(path.extname(e.name).toLowerCase()))files.push(f);}}
walk(root);
const rel=p=>path.relative(root,p).split(path.sep).join("/");
const rows=files.map(file=>({path:rel(file),text:fs.readFileSync(file,"utf8"),ext:path.extname(file).toLowerCase()}));
const paths=new Set(rows.map(x=>x.path)), findings=[];
const surface={pages:[],links:[],scripts:[],forms:[],events:[],endpoints:[],storage:[],concepts:[],keyReferences:[],routes:[]};
const lineAt=(s,i)=>s.slice(0,i).split("\n").length;
function add(type,file,line,value,severity="info"){findings.push({type,file,line,severity,value:String(value).slice(0,220)});}
const terms=[
["probabilistic",/probabilistic|probability|stochastic|sampling|confidence|uncertainty/ig],
["deterministic",/deterministic|reproducib|idempotenc|canonical|fixed.point/ig],
["joule-energy",/\bjoules?\b|\bj\s*\/\s*request\b|energy meter|eFuse|efuse|fuel unit/ig],
["pricing",/pricing|price|cost|charge|meter|billing|tariff|rate limit|credit|merit/ig],
["key-indexing",/key.?index|index.?key|api.?key|public.?key|private.?key|key.?id|\bkid\b|keyring|jwk|jwks/ig],
["decision-gates",/trinity|authorization|authori[sz]e|decision gate|logic gate|\ballow\b|\bdeny\b|fail.closed|policy/ig],
["identity-memory",/unity.?id|identity|session|memory|provenance|receipt|hash|merkle/ig]
];
for(const r of rows){
 const p=r.path,t=r.text;
 if(/\.html?$/.test(p)){
  const title=(t.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||"";
  surface.pages.push({file:p,title:title.replace(/\s+/g," ").trim(),bytes:Buffer.byteLength(t)});
  const ids=new Set();
  for(const m of t.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)){if(ids.has(m[1]))add("duplicate-dom-id",p,lineAt(t,m.index),m[1],"warning");ids.add(m[1]);}
  for(const m of t.matchAll(/\b(href|src|action|poster|data-src)\s*=\s*["']([^"']+)["']/gi)){
   const attr=m[1].toLowerCase(),value=m[2].trim();
   const item={file:p,line:lineAt(t,m.index),attr,value};
   if(/^(https?:|mailto:|tel:|data:|blob:|javascript:|\/\/)/i.test(value)){(attr==="href"?surface.links:attr==="action"?surface.forms:surface.scripts).push({...item,external:true});continue;}
   if(value.startsWith("#")){surface.links.push(item);continue;}
   const pathname=value.split("?")[0].split("#")[0];if(!pathname)continue;
   const target=pathname.startsWith("/")?pathname.slice(1):path.posix.normalize(path.posix.join(path.posix.dirname(p),pathname));
   const exists=paths.has(target)||paths.has(target+"/index.html")||paths.has(target+".html")||paths.has(target.replace(/\/$/,"")+"/index.html");
   if(!exists&&!pathname.includes("{")&&!pathname.startsWith("{{"))add("possibly-broken-local-reference",p,lineAt(t,m.index),value,"warning");
   (attr==="href"?surface.links:attr==="action"?surface.forms:surface.scripts).push({...item,target,exists,local:true});
  }
  for(const m of t.matchAll(/\bon(click|submit|change|input|load|error|keydown|keyup|pointerdown|touchstart)\s*=\s*["']([^"']*)["']/gi)){
   surface.events.push({file:p,line:lineAt(t,m.index),event:m[1],inline:true});
   add("inline-event-handler",p,lineAt(t,m.index),m[1]);
  }
  for(const m of t.matchAll(/<form\b[^>]*>/gi))surface.forms.push({file:p,line:lineAt(t,m.index),tag:m[0].slice(0,200)});
 }
 if(/\.(js|mjs|cjs|ts|tsx|jsx)$/.test(p)){
  for(const m of t.matchAll(/\baddEventListener\s*\(\s*["']([^"']+)["']/g))surface.events.push({file:p,line:lineAt(t,m.index),event:m[1],inline:false});
  for(const m of t.matchAll(/\bfetch\s*\(\s*["']([^"']+)["']/g))surface.endpoints.push({file:p,line:lineAt(t,m.index),endpoint:m[1]});
  for(const m of t.matchAll(/\b(?:localStorage|sessionStorage|indexedDB|document\.cookie)\b/g))surface.storage.push({file:p,line:lineAt(t,m.index),api:m[0]});
 }
 for(const [label,re0] of terms){
  const re=new RegExp(re0.source,re0.flags);let m;
  while((m=re.exec(t))!==null){
   const item={file:p,line:lineAt(t,m.index),concept:label,term:m[0]};
   if(label==="key-indexing")surface.keyReferences.push(item);
   else surface.concepts.push(item);
   if(["joule-energy","key-indexing"].includes(label))add(label,p,item.line,m[0]);
  }
 }
 for(const m of t.matchAll(/["']((?:\/api\/|\/v[0-9]+\/|\/iris\/|\/unity\/|\/seal(?:\.json)?\b|\/sandbox\/)[A-Za-z0-9_./?&={}:-]*)["']/g))surface.routes.push({route:m[1].replace(/\?.*$/,""),file:p,line:lineAt(t,m.index)});
}
const uniqueRoutes=[...new Map(surface.routes.map(x=>[x.route,x])).values()].sort((a,b)=>a.route.localeCompare(b.route));
const counts={scannedFiles:rows.length,pages:surface.pages.length,links:surface.links.length,scriptAndAssetRefs:surface.scripts.length,forms:surface.forms.length,eventHandlers:surface.events.length,fetchEndpointLiterals:surface.endpoints.length,uniqueRouteLiterals:uniqueRoutes.length,storageReferences:surface.storage.length,keyIndexMentions:surface.keyReferences.length,computeAndGovernanceMentions:surface.concepts.length,findings:findings.length,possibleBrokenLocalReferences:findings.filter(x=>x.type==="possibly-broken-local-reference").length,duplicateDomIds:findings.filter(x=>x.type==="duplicate-dom-id").length};
fs.mkdirSync("audit-output",{recursive:true});
fs.writeFileSync("audit-output/whole-site-inventory.json",JSON.stringify({generatedAt:new Date().toISOString(),scope:"static source inventory; runtime behavior not proven",counts,surface,uniqueRoutes,findings},null,2)+"\n");
const md=["# Whole-site and Iris static inventory","","Generated from repository source. Static findings are leads, not proof of runtime behavior. No production resources are modified.","","## Totals","","| Measure | Count |","|---|---:|"];
for(const [k,v] of Object.entries(counts))md.push("| "+k+" | "+v+" |");
md.push("","## Pages","","| File | Title | Bytes |","|---|---|---:|");
for(const x of surface.pages.sort((a,b)=>a.file.localeCompare(b.file)))md.push("| "+x.file.replace(/\|/g,"\\|")+" | "+x.title.replace(/\|/g,"\\|")+" | "+x.bytes+" |");
md.push("","## Literal API/runtime routes","","| Route | First reference |","|---|---|");
for(const x of uniqueRoutes)md.push("| "+x.route+" | "+x.file+":"+x.line+" |");
md.push("","## Static findings","","| Severity | Type | File:line | Detail |","|---|---|---|---|");
for(const x of findings.sort((a,b)=>(a.severity==="warning"?0:1)-(b.severity==="warning"?0:1)||a.file.localeCompare(b.file)||a.line-b.line))md.push("| "+x.severity+" | "+x.type+" | "+x.file+":"+x.line+" | "+x.value.replace(/\|/g,"\\|")+" |");
md.push("","## Concept evidence","","Lexical matches only. Presence of a word does not prove end-to-end implementation, unit correctness, or runtime wiring.","");
for(const label of terms.map(x=>x[0])){
 const list=surface.concepts.concat(surface.keyReferences).filter(x=>x.concept===label).slice(0,200);
 md.push("### "+label,"","| File:line | Match |","|---|---|");
 for(const x of list)md.push("| "+x.file+":"+x.line+" | "+x.term.replace(/\|/g,"\\|")+" |");
 if(!list.length)md.push("No lexical matches found.");
 md.push("");
}
md.push("## Coverage limits","","This scanner does not run the site in a browser, authenticate users, test every button, execute dynamic routes, verify live service bindings, prove storage durability, or validate Joule pricing math. Follow with browser journey tests, endpoint contract tests, staging end-to-end tests, and independent numerical/property tests.","");
fs.writeFileSync("audit-output/whole-site-inventory.md",md.join("\n"));
console.log(JSON.stringify({counts,markdown:"audit-output/whole-site-inventory.md",json:"audit-output/whole-site-inventory.json"},null,2));
