#!/usr/bin/env node
/**
 * Dualis API v2 bootstrap jacket.
 * Local-only, dependency-free prototype.
 * It prepares and dry-runs task envelopes; it does not authenticate users,
 * call external connectors, store secrets, or execute privileged writes.
 */
import http from 'node:http';
import crypto from 'node:crypto';

const HOST = process.env.DUALIS_HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8787);
const PROTOCOL = 'dualis.api.v2.bootstrap';
const BUILD = 'bootstrap-local-only-1';
const tasks = new Map();
const receipts = new Map();
const json = (value) => JSON.stringify(value, null, 2) + '\n';
const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const now = () => new Date().toISOString();
function response(res, status, value) {
  res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-dualis-protocol':PROTOCOL});
  res.end(json(value));
}
function receipt(task, status, stage, evidence = [], extra = {}) {
  const value = {schema:'dualis.receipt.v2',request_id:task.request_id,request_hash:task.request_hash,status,stage,evidence,before_hash:null,after_hash:null,votes:[],redactions:['secret','raw_identity_document'],created_at:now(),...extra};
  const id = crypto.randomUUID(); receipts.set(id, value); return {receipt_id:id, ...value};
}
async function body(req) {
  let text=''; for await (const chunk of req) text += chunk;
  if (text.length > 256 * 1024) throw new Error('body too large');
  return text ? JSON.parse(text) : {};
}
function safeTask(input) {
  const task = {schema:'dualis.task.v2',request_id:input.request_id || crypto.randomUUID(),unity_id:input.unity_id || null,target:input.target || 'local-bootstrap-only',verb:input.verb || 'prepare',object:input.object || null,kind:input.kind || null,base_revision:input.base_revision || null,claim:input.claim || {},fetch_plan:input.fetch_plan || {},constraints:{non_destructive:true,reversible:true,external_writes:false,...input.constraints},created_at:now()};
  return {...task, request_hash:hash(task)};
}
function dryRun(task) {
  const holes=[];
  if (!task.object) holes.push('object is missing');
  if (!task.kind) holes.push('kind is missing');
  if (!task.base_revision) holes.push('base_revision is missing');
  if (!task.claim || Object.keys(task.claim).length === 0) holes.push('claim is missing');
  if (!task.fetch_plan || Object.keys(task.fetch_plan).length === 0) holes.push('fetch_plan is missing');
  if (task.constraints.external_writes !== false) holes.push('external_writes must be false in bootstrap mode');
  return holes.length ? receipt(task,'HOLE','collapse',holes.map(reason => ({kind:'missing-prerequisite',reason}))) : receipt(task,'PASS','dry-run',[{kind:'bootstrap-check',result:'prepared-only; no external connector invoked'}]);
}
const server = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
    if (req.method === 'GET' && url.pathname === '/api/v2/health') return response(res,200,{ok:true,protocol:PROTOCOL,build:BUILD,mode:'local-only-preparation',external_writes:false,auth:'NOT_IMPLEMENTED',connectors:[],at:now()});
    if (req.method === 'POST' && url.pathname === '/api/v2/tasks/prepare') { const task=safeTask(await body(req)); tasks.set(task.request_id,task); return response(res,201,{task,receipt:receipt(task,'WAIT_GRANT','prepare',[{kind:'policy',result:'prepared; authentication and quorum are not implemented'}])}); }
    const dry=url.pathname.match(/^\/api\/v2\/tasks\/([^/]+)\/dry-run$/);
    if (req.method === 'POST' && dry) { const task=tasks.get(dry[1]); return task ? response(res,200,dryRun(task)) : response(res,404,{ok:false,code:'TASK_NOT_FOUND'}); }
    const getTask=url.pathname.match(/^\/api\/v2\/tasks\/([^/]+)$/);
    if (req.method === 'GET' && getTask) { const task=tasks.get(getTask[1]); return task ? response(res,200,task) : response(res,404,{ok:false,code:'TASK_NOT_FOUND'}); }
    const getReceipt=url.pathname.match(/^\/api\/v2\/receipts\/([^/]+)$/);
    if (req.method === 'GET' && getReceipt) { const value=receipts.get(getReceipt[1]); return value ? response(res,200,value) : response(res,404,{ok:false,code:'RECEIPT_NOT_FOUND'}); }
    return response(res,404,{ok:false,code:'NOT_FOUND',protocol:PROTOCOL});
  } catch (error) { return response(res,400,{ok:false,code:'BAD_REQUEST',message:error instanceof SyntaxError ? 'invalid JSON' : error.message}); }
});
server.listen(PORT,HOST,()=>{ console.log(`${PROTOCOL} listening at http://${HOST}:${PORT}`); console.log('No credentials, external connectors, or privileged writes are enabled.'); });
