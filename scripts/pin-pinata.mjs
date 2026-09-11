#!/usr/bin/env node
/**
 * Pinata is the spare copy. Cloudflare is live. GitHub is the library.
 * Files sit at CID root (no dualiscapax/ prefix).
 * JWT from env only. Dry-run unless --pin.
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PIN = process.argv.includes("--pin");
const FULL = process.argv.includes("--full");
const ENDPOINT = "https://api.pinata.cloud/pinning/pinFileToIPFS";

const SKIP_DIR = new Set([".git", ".github", "node_modules", "workers", "artifacts", ".tmp", "dist"]);
const SKIP_FILE = /\.(env|pem|key)$/i;
const SKIP_NAME = new Set([".env", ".DS_Store", "wrangler.toml"]);

const LANDER_ROOT = new Set([
  "index.html", "why.html", "story.html", "curtain.html", "world.html",
  "ca.html", "on.html", "qc.html", "ab.html", "np.html",
  "encyclopedia.html", "look.html", "onboard.html", "unity.html", "hub.html",
  "404.html", "theme.css", "styles.css", "CNAME", "_headers"
]);
const LANDER_DIR = new Set(["js", "css", "data", "hall", "assets", "brand"]);

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIR.has(name) || SKIP_NAME.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (!SKIP_FILE.test(name)) out.push(p);
  }
}

function want(rel) {
  if (FULL) return true;
  const top = rel.split("/")[0];
  return LANDER_ROOT.has(rel) || LANDER_DIR.has(top);
}

const files = [];
walk(ROOT, files);
const list = files
  .map((abs) => ({ abs, rel: relative(ROOT, abs).split(sep).join("/") }))
  .filter((f) => want(f.rel))
  .sort((a, b) => a.rel.localeCompare(b.rel));

mkdirSync(join(ROOT, "data"), { recursive: true });
const receipt = {
  schema: "dualis.pinata.receipt.v1",
  at: new Date().toISOString(),
  mode: FULL ? "full" : "lander",
  file_count: list.length,
  wrap_prefix: "",
  files: list.map((f) => f.rel),
  pinned: false,
  cid: null,
  origin: "cloudflare-manual",
  note: "Live site is Cloudflare (manual zip). This CID is the spare copy at tree root. GitHub is documentation only."
};

if (!PIN) {
  console.log(JSON.stringify({
    dry_run: true,
    mode: receipt.mode,
    file_count: list.length,
    sample: list.slice(0, 15).map((f) => f.rel)
  }, null, 2));
  writeFileSync(join(ROOT, "data", "pinata-last.json"), JSON.stringify(receipt, null, 2));
  process.exit(0);
}

const jwt = process.env.PINATA_JWT || "";
if (!jwt || jwt.length < 20) {
  console.error("PINATA_JWT missing.");
  process.exit(2);
}

const fd = new FormData();
for (const f of list) {
  const bytes = readFileSync(f.abs);
  fd.append("file", new File([bytes], f.rel));
}
fd.append("pinataMetadata", JSON.stringify({
  name: "DualisCapax-L1-" + new Date().toISOString().slice(0, 10),
  keyvalues: { project: "DualisCapax", layer: "L1_Public_Face", mode: receipt.mode }
}));
fd.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { Authorization: "Bearer " + jwt },
  body: fd
});
const text = await res.text();
let body;
try { body = JSON.parse(text); } catch { body = { raw: text }; }
if (!res.ok) {
  console.error(res.status, text.slice(0, 800));
  process.exit(1);
}
receipt.pinned = true;
receipt.cid = body.IpfsHash || body.cid || null;
receipt.pin_size = body.PinSize || null;
receipt.timestamp = body.Timestamp || null;
writeFileSync(join(ROOT, "data", "pinata-last.json"), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify({ ok: true, cid: receipt.cid, files: list.length, size: receipt.pin_size }, null, 2));
console.log("/ipfs/" + receipt.cid + "/why.html");
