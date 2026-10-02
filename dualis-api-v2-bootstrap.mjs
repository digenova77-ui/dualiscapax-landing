#!/usr/bin/env node
/**
 * Dualis API v2 bootstrap jacket.
 * Local-only, dependency-free prototype.
 * It prepares and dry-runs task envelopes; it does not authenticate users,
 * call external connectors, store secrets, or execute privileged writes.
 */
import http from 'node:http';
import crypto from 'node:crypto';
import { driveStatus, driveInventory } from './dualis-google-drive-bridge.mjs';

const HOST = process.env.DUALIS_HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8787);
const PROTOCOL = 'dualis.api.v2.bootstrap';
const BUILD = 'bootstrap-local-only-1';
const WRITE_AUTHORITY = 'verified-father-kernel-only';
const SETTLEMENT_ASSET = 'Unity-token';
const NONSELLABLE_ASSET = 'eFuse-token';
const PEG_BASIS = 'global-cost-reduction-index';
const PEG_STATUS = 'UNSET';
const BACKING_ASSET = 'eFuse-token';
const BACKING_STATUS = 'DESIGN_ONLY';
const DECISION_BASE_UNIT = 'fuel-unit-v1';
const plans = [
  {id:'depth-40', name:'Depth 40', fuel_units:40, description:'bounded Adaptive capacity'},
  {id:'depth-120', name:'Depth 120', fuel_units:120, description:'extended Adaptive capacity'},
  {id:'depth-320', name:'Depth 320', fuel_units:320, description:'deep Adaptive capacity'}
];
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
  const task = {schema:'dualis.task.v2',request_id:input.request_id || crypto.randomUUID(),unity_id:input.unity_id || null,target:input.target || 'local-bootstrap-only',verb:input.verb || 'prepare',object:input.object || null,kind:input.kind || null,base_revision:input.base_revision || null,claim:input.claim || {},fetch_plan:input.fetch_plan || {},constraints:{non_destructive:true,reversible:true,external_writes:false,write_authority:WRITE_AUTHORITY,...input.constraints},created_at:now()};
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
    if (req.method === 'GET' && url.pathname === '/api/v2/health') return response(res,200,{ok:true,protocol:PROTOCOL,build:BUILD,mode:'local-only-preparation',external_writes:false,write_authority:WRITE_AUTHORITY,settlement_asset:SETTLEMENT_ASSET,non_sellable_asset:NONSELLABLE_ASSET,peg_basis:PEG_BASIS,peg_status:PEG_STATUS,backing_asset:BACKING_ASSET,backing_status:BACKING_STATUS,decision_base_unit:DECISION_BASE_UNIT,auth:'NOT_IMPLEMENTED',connectors:[{id:'google-drive',mode:'read-only-bridge',credentials:'redacted'}],at:now()});
    if (req.method === 'GET' && url.pathname === '/api/v2/unity-id/status') return response(res,200,{ok:true,schema:'dualis.unity-id.status.v1',local_session:'AVAILABLE_ON_DEVICE_ONLY',issuer:'HOLE',production_unity_id:'NOT_ISSUED',wallet:'NOT_CREATED',token_contract:'UNSET',settlement_asset:SETTLEMENT_ASSET,non_sellable_asset:NONSELLABLE_ASSET,peg_basis:PEG_BASIS,peg_status:PEG_STATUS,backing_asset:BACKING_ASSET,backing_status:BACKING_STATUS,decision_base_unit:DECISION_BASE_UNIT,api_binding:'WAIT_GRANT',write_authority:WRITE_AUTHORITY,secrets:'NONE_IN_RESPONSE',external_writes:false});
    if (req.method === 'GET' && url.pathname === '/api/v2/pricing/catalog') return response(res,200,{ok:true,mode:'crypto-only-burn-scaffold',settlement_asset:SETTLEMENT_ASSET,non_sellable_asset:NONSELLABLE_ASSET,peg_basis:PEG_BASIS,peg_status:PEG_STATUS,backing_asset:BACKING_ASSET,backing_status:BACKING_STATUS,decision_base_unit:DECISION_BASE_UNIT,plans,fiat:false,bank:false,stripe:false,verifier:'UNSET',status:'WAIT_GRANT',external_writes:false});
    if (req.method === 'POST' && url.pathname === '/api/v2/crypto/quote') { const input=await body(req); const plan=plans.find(x=>x.id===input.plan_id); if (!plan) return response(res,400,{ok:false,code:'UNKNOWN_PLAN'}); const quote={schema:'dualis.crypto.quote.v1',quote_id:crypto.randomUUID(),plan_id:plan.id,settlement_asset:SETTLEMENT_ASSET,non_sellable_asset:NONSELLABLE_ASSET,peg_basis:PEG_BASIS,peg_status:PEG_STATUS,backing_asset:BACKING_ASSET,backing_status:BACKING_STATUS,decision_base_unit:DECISION_BASE_UNIT,fuel_units:plan.fuel_units,chain_id:'UNSET',asset_contract:'UNSET',burn_contract:'UNSET',expires_at:new Date(Date.now()+15*60*1000).toISOString(),status:'WAIT_GRANT',external_writes:false}; return response(res,201,{quote,receipt:{status:'WAIT_GRANT',stage:'quote-prepared',reason:'Father-approved verifier and chain configuration are not set'}}); }
    if (req.method === 'POST' && url.pathname === '/api/v2/crypto/verify') { const input=await body(req); const required=['quote_id','tx_hash','chain_id','asset_contract']; const missing=required.filter(x=>!input[x]); return response(res,202,{ok:false,code:missing.length?'MISSING_PROOF':'VERIFIER_UNSET',status:'WAIT_GRANT',missing,settlement_asset:SETTLEMENT_ASSET,non_sellable_asset:NONSELLABLE_ASSET,peg_basis:PEG_BASIS,peg_status:PEG_STATUS,backing_asset:BACKING_ASSET,backing_status:BACKING_STATUS,decision_base_unit:DECISION_BASE_UNIT,external_writes:false,write_authority:WRITE_AUTHORITY}); }
    if (req.method === 'POST' && url.pathname === '/api/v2/unity-id/bind-entitlement') return response(res,403,{ok:false,code:'FATHER_KERNEL_REQUIRED',status:'WAIT_GRANT',reason:'verified Father/kernel binding is required after eFuse Unity verification',settlement_asset:SETTLEMENT_ASSET,non_sellable_asset:NONSELLABLE_ASSET,peg_basis:PEG_BASIS,peg_status:PEG_STATUS,backing_asset:BACKING_ASSET,backing_status:BACKING_STATUS,decision_base_unit:DECISION_BASE_UNIT,external_writes:false});
    if (req.method === 'GET' && url.pathname === '/api/v2/connectors/google-drive/status') { try { return response(res,200,{ok:true,connector:await driveStatus(),receipt:{status:'PASS',stage:'connector-health',external_writes:false}}); } catch (error) { return response(res,200,{ok:false,connector:'google-drive',status:'HOLE',reason:'connector unavailable or not authorized',detail:error.message,credentials:'redacted'}); } }
    if (req.method === 'GET' && url.pathname === '/api/v2/connectors/google-drive/inventory') { try { return response(res,200,{ok:true,inventory:await driveInventory(url.searchParams.get('limit') || 25),receipt:{status:'PASS',stage:'read-only-inventory',external_writes:false}}); } catch (error) { return response(res,200,{ok:false,connector:'google-drive',status:'HOLE',reason:'inventory unavailable or not authorized',detail:error.message,credentials:'redacted'}); } }
    if (req.method === 'POST' && url.pathname === '/api/v2/tasks/prepare') { const task=safeTask(await body(req)); tasks.set(task.request_id,task); return response(res,201,{task,receipt:receipt(task,'WAIT_GRANT','prepare',[{kind:'policy',result:'prepared; authentication and quorum are not implemented'}])}); }
    const dry=url.pathname.match(/^\/api\/v2\/tasks\/([^/]+)\/dry-run$/);
    if (req.method === 'POST' && dry) { const task=tasks.get(dry[1]); return task ? response(res,200,dryRun(task)) : response(res,404,{ok:false,code:'TASK_NOT_FOUND'}); }
    const getTask=url.pathname.match(/^\/api\/v2\/tasks\/([^/]+)$/);
    if (req.method === 'GET' && getTask) { const task=tasks.get(getTask[1]); return task ? response(res,200,task) : response(res,404,{ok:false,code:'TASK_NOT_FOUND'}); }
    const getReceipt=url.pathname.match(/^\/api\/v2\/receipts\/([^/]+)$/);
    if (req.method === 'GET' && getReceipt) { const value=receipts.get(getReceipt[1]); return value ? response(res,200,value) : response(res,404,{ok:false,code:'RECEIPT_NOT_FOUND'}); }
    if (req.method === 'POST' && url.pathname === '/api/v2/execute') return response(res,403,{ok:false,code:'FATHER_KERNEL_REQUIRED',status:'WAIT_GRANT',write_authority:WRITE_AUTHORITY,external_writes:false});
    return response(res,404,{ok:false,code:'NOT_FOUND',protocol:PROTOCOL});
  } catch (error) { return response(res,400,{ok:false,code:'BAD_REQUEST',message:error instanceof SyntaxError ? 'invalid JSON' : error.message}); }
});
server.listen(PORT,HOST,()=>{ console.log(`${PROTOCOL} listening at http://${HOST}:${PORT}`); console.log('No credentials, external connectors, or privileged writes are enabled.'); });
