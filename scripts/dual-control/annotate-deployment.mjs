#!/usr/bin/env node
/**
 * Best-effort: create Workers deployment with message containing tip_sha.
 * Requires CLOUDFLARE_API_TOKEN + CF_ACCOUNT_ID.
 * Does NOT upload script — annotates by redeploying current latest version at 100% with message.
 * Fail-closed if TipSeal missing or DAVID_YES_TIP_SHA mismatch.
 */
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}
const tipsealPath = flag("--tipseal");
const script = flag("--script") || "dualis-gate";
const token = process.env.CLOUDFLARE_API_TOKEN || "";
const acct = process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || "";
if (!tipsealPath || !token || !acct) {
  console.error("FAIL_CLOSED: --tipseal and CLOUDFLARE_API_TOKEN and CF_ACCOUNT_ID required");
  process.exit(2);
}
const seal = JSON.parse(readFileSync(tipsealPath, "utf8"));
const david = (process.env.DAVID_YES_TIP_SHA || "").trim();
if (david !== seal.tip_sha) {
  console.error("FAIL_CLOSED: DAVID_YES_TIP_SHA mismatch");
  process.exit(3);
}
const message = `tip_sha=${seal.tip_sha} content_sha256=${seal.content_sha256} dual_control=v1`;

async function api(method, path, body) {
  const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json();
  return { status: r.status, j };
}

const vers = await api("GET", `/accounts/${acct}/workers/scripts/${script}/versions?per_page=1`);
const items = vers.j?.result?.items || [];
const latest = items[0]?.id;
if (!latest) {
  console.error("FAIL_CLOSED: no latest version", vers.status, vers.j?.errors);
  process.exit(4);
}
const dep = await api("POST", `/accounts/${acct}/workers/scripts/${script}/deployments`, {
  strategy: "percentage",
  versions: [{ version_id: latest, percentage: 100 }],
  annotations: { "workers/message": message },
});
if (!dep.j?.success) {
  console.error("FAIL_CLOSED: deployment annotate", dep.status, JSON.stringify(dep.j?.errors || dep.j));
  process.exit(5);
}
console.log(JSON.stringify({ ok: true, script, version_id: latest, message }, null, 2));
