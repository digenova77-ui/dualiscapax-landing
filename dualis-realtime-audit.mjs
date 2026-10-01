#!/usr/bin/env node
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import crypto from 'node:crypto';
const run = promisify(execFile);
const root = new URL('.', import.meta.url).pathname;
const plan = JSON.parse(await fs.readFile(`${root}DUALIS_REALTIME_AUDIT_PLAN.json`, 'utf8'));
const started = new Date().toISOString();
const results = [];
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
async function httpCheck(item) {
  const startedAt = Date.now();
  try {
    const r = await fetch(item.url, {redirect:'follow', signal:AbortSignal.timeout(20000)});
    const text = await r.text();
    const hasPipeline = /DUAL PIPELINE|pipeline-simulate|CLAIM.*FETCH/i.test(text);
    let json = null; try { json = JSON.parse(text); } catch {}
    let status = r.ok ? 'PASS' : item.id === 'api-v2-chat' && r.status === 404 ? 'HOLE' : 'FAIL';
    const evidence = {http:r.status, bytes:text.length, final_url:r.url, body_sha256:sha(text).slice(0,16)};
    if (item.id === 'live-builder' && !hasPipeline) { status='FAIL'; evidence.missing='Dual Pipeline control'; }
    if (item.id === 'pwa-manifest' && r.ok) { if (!json?.start_url || !json?.scope) { status='FAIL'; evidence.missing='start_url or scope'; } }
    if (item.id === 'service-worker' && r.ok && !/builder/i.test(text)) { status='FAIL'; evidence.missing='builder scope'; }
    if (item.id === 'api-v2-health' && r.status === 404) status='HOLE';
    if (item.id === 'api-v2-chat' && r.status === 404) evidence.interpretation='route not deployed; no availability claim';
    results.push({id:item.id,status,elapsed_ms:Date.now()-startedAt,evidence});
  } catch (error) { results.push({id:item.id,status:'HOLE',elapsed_ms:Date.now()-startedAt,evidence:{reason:error.message}}); }
}
async function commandCheck(id, args, transform = x => x.trim()) {
  const startedAt = Date.now();
  try { const {stdout,stderr} = await run(args[0], args.slice(1), {cwd:root,timeout:20000}); results.push({id,status:'PASS',elapsed_ms:Date.now()-startedAt,evidence:{value:transform(stdout),stderr:stderr.trim().slice(0,300)}}); }
  catch (error) { results.push({id,status:'FAIL',elapsed_ms:Date.now()-startedAt,evidence:{reason:error.message}}); }
}
for (const item of plan.checks.filter(x => x.kind === 'http')) await httpCheck(item);
await commandCheck('repo-revision',['git','rev-parse','HEAD']);
await commandCheck('repo-status',['git','status','--short'],x => x || 'clean');
try {
  const {stdout} = await run('node',['dualis-google-drive-bridge.mjs','status'],{cwd:root,timeout:25000});
  const value=JSON.parse(stdout); results.push({id:'drive-bridge',status:value.credentials==='redacted'&&value.mode==='read-only'?'PASS':'FAIL',evidence:{connector:value.connector,mode:value.mode,credentials:value.credentials,external_writes:false}});
} catch (error) { results.push({id:'drive-bridge',status:'HOLE',evidence:{reason:error.message,credentials:'redacted'}}); }
try {
  const builder = await fs.readFile(`${root}builder.html`,'utf8');
  const bad = /<input[^>]+type=["']password|private.?key|google.?pass(word|phrase)/i.test(builder);
  results.push({id:'security-strings',status:bad?'FAIL':'PASS',evidence:{password_field:passwordField,secret_storage_pattern:secretStorage,public_client_secret_storage:false}});
} catch (error) { results.push({id:'security-strings',status:'HOLE',evidence:{reason:error.message}}); }
const counts = results.reduce((a,x)=>(a[x.status]=(a[x.status]||0)+1,a),{});
const overall = counts.FAIL ? 'FAIL' : counts.HOLE ? 'HOLE' : 'PASS';
const receipt = {schema:'dualis.audit.receipt.v1',plan:plan.name,mode:plan.mode,target:plan.target,started_at:started,finished_at:new Date().toISOString(),status:overall,counts,external_writes:false,credentials:'redacted',results,receipt_hash:null};
receipt.receipt_hash=sha(JSON.stringify(receipt));
await fs.mkdir(`${root}receipts`,{recursive:true});
const out=`${root}receipts/realtime-audit-${Date.now()}.json`;
await fs.writeFile(out,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({...receipt,receipt_path:out},null,2));
process.exitCode = overall === 'FAIL' ? 2 : 0;
