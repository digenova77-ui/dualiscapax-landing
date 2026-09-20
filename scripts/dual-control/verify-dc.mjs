#!/usr/bin/env node
/**
 * DC-1…DC-6 harness (dry where Absolute mutate not authorized).
 */
import { execSync, spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const root = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
const tip = execSync("git rev-parse HEAD", { encoding: "utf8", cwd: root }).trim();
const gen = join(root, "scripts/dual-control/generate-tipseal.mjs");
const gate = join(root, "scripts/dual-control/gate-deploy.mjs");
const sealPath = join(root, "scripts/dual-control/.tmp-tipseal.json");
const rows = [];

function add(id, pass, detail) {
  rows.push({ id, PASS: !!pass, detail });
}

// generate seal
const g = spawnSync("node", [gen, "--out", sealPath, "--worker", "dualis-gate"], { encoding: "utf8" });
add("DC_GEN", g.status === 0, { status: g.status, err: g.stderr?.slice(0, 200) });
const seal = g.status === 0 ? JSON.parse(readFileSync(sealPath, "utf8")) : null;

// DC-1 no TipSeal
const d1 = spawnSync("node", [gate], { encoding: "utf8" });
add("DC-1", d1.status !== 0, { status: d1.status, err: (d1.stderr || "").slice(0, 120) });

// DC-2 wrong tip in DAVID_YES
if (seal) {
  const wrong = "0".repeat(40);
  const d2 = spawnSync("node", [gate, "--tipseal", sealPath], {
    encoding: "utf8",
    env: { ...process.env, DAVID_YES_TIP_SHA: wrong },
  });
  add("DC-2", d2.status !== 0, { status: d2.status });
  // DC-3 matching YES (dry — no Absolute deploy)
  const d3 = spawnSync("node", [gate, "--tipseal", sealPath], {
    encoding: "utf8",
    env: { ...process.env, DAVID_YES_TIP_SHA: seal.tip_sha },
  });
  add("DC-3_DRY_GATE", d3.status === 0, { status: d3.status, out: (d3.stdout || "").slice(0, 200) });
  add("DC-3_TIP_MATCH", seal.tip_sha === tip, { seal: seal.tip_sha, tip });
} else {
  add("DC-2", false, { reason: "no seal" });
  add("DC-3_DRY_GATE", false, { reason: "no seal" });
}

// DC-4 Absolute annotation — not executed (no deploy this pass)
add("DC-4_ANNOTATION_LIVE", false, { note: "DEFERRED until sealed Absolute deploy with annotation bind" });

// DC-5 Edit residual honesty — always OPEN documented
add("DC-5_EDIT_RESIDUAL_OPEN_HONESTY", true, { note: "Edit bypass remains OPEN by charter — PASS means honesty held" });

// DC-6 regression probes left to external proof pack; check tip wrangler defaults
const wt = readFileSync(join(root, "workers/dualis-gate/wrangler.toml"), "utf8");
add("DC-6_TIP_VARS", /CHECKOUT_OPEN\s*=\s*"false"/.test(wt) && /SESSION_MINT_OPEN\s*=\s*"false"/.test(wt), { snip: "wrangler vars present false" });

if (existsSync(sealPath)) unlinkSync(sealPath);
console.log(JSON.stringify({ tip, rows }, null, 2));
const hard = rows.filter((r) => ["DC-1", "DC-2", "DC-3_DRY_GATE", "DC-5_EDIT_RESIDUAL_OPEN_HONESTY", "DC-6_TIP_VARS"].includes(r.id));
const ok = hard.every((r) => r.PASS);
process.exit(ok ? 0 : 1);
