#!/usr/bin/env node
/**
 * Residual R8: observe Worker bindings from the SERVING version resource.
 * Script /settings often omits D1 — do not trust settings alone.
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=... node scripts/cf_worker_bindings_observe.mjs \
 *     [scriptName=dualiscapax-stripe-fulfill-v2]
 *
 * Prints binding names/types only (no secret values).
 */
import { env } from "node:process";

const token = env.CLOUDFLARE_API_TOKEN;
if (!token) {
  console.error("CLOUDFLARE_API_TOKEN required");
  process.exit(2);
}
const accountId = env.CLOUDFLARE_ACCOUNT_ID || "725a9382123c9f12a01e3eda718f6436";
const script = process.argv[2] || "dualiscapax-stripe-fulfill-v2";
const base = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${script}`;

async function cf(path) {
  const r = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const j = await r.json();
  if (!j.success) {
    console.error(JSON.stringify({ ok: false, path, errors: j.errors }, null, 2));
    process.exit(1);
  }
  return j.result;
}

const deployments = await cf("/deployments");
const deps = deployments.deployments || [];
const serving = (deps[0]?.versions || []).find((v) => v.percentage === 100);
const versionId = serving?.version_id;
if (!versionId) {
  console.error("no 100% serving version");
  process.exit(1);
}

const settings = await cf("/settings");
const settingsBindings = (settings.bindings || []).map((b) => ({
  name: b.name,
  type: b.type,
}));

const version = await cf(`/versions/${versionId}`);
const versionBindings = ((version.resources || {}).bindings || []).map((b) => ({
  name: b.name,
  type: b.type,
  has_id: Boolean(b.id),
}));

const settingsNames = new Set(settingsBindings.map((b) => b.name));
const versionNames = new Set(versionBindings.map((b) => b.name));
const onlyInVersion = [...versionNames].filter((n) => !settingsNames.has(n));
const d1InVersion = versionBindings.filter((b) => String(b.type).toLowerCase().includes("d1"));

console.log(
  JSON.stringify(
    {
      ok: true,
      script,
      serving_version_id: versionId,
      settings_bindings: settingsBindings,
      version_bindings: versionBindings,
      only_in_version_not_settings: onlyInVersion,
      d1_in_version: d1InVersion,
      note:
        "Trust version_bindings for D1. settings may omit D1 (residual R8). " +
        "Bare wrangler deploy without local D1 config can strip DB (see docs/ops/CF_SCRIPT_SETTINGS_VS_VERSION.md).",
    },
    null,
    2
  )
);
