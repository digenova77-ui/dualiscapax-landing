import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { LAWS } from "../js/dclm-write.js";
import { PIECES, handleBucket, read } from "../js/purity-umpire.js";

const ROOT = new URL("..", import.meta.url);
const DOOR = [
  "index.html",
  "wallet.html",
  "meeting.html",
  "llms.txt",
  "css/writer.css",
  "css/seed.css",
  "js/iris-attack.js",
  "js/merit-align.js",
  "js/x402-exchange.js"
];

function text(name) {
  return readFileSync(new URL("../" + name, import.meta.url), "utf8");
}

function walk(dir, suffixes, out) {
  const names = readdirSync(dir);
  for (let i = 0; i < names.length; i++) {
    const path = join(dir, names[i]);
    if (names[i] === "node_modules" || names[i] === ".git") continue;
    const info = statSync(path);
    if (info.isDirectory()) walk(path, suffixes, out);
    else if (suffixes.some(function (suffix) { return path.endsWith(suffix); })) out.push(path);
  }
  return out;
}

function bundle(names) {
  let out = "";
  for (let i = 0; i < names.length; i++) out += text(names[i]) + "\n";
  return out;
}

function count(hay, needle) {
  let n = 0;
  let at = 0;
  while (at <= hay.length) {
    const found = hay.indexOf(needle, at);
    if (found === -1) return n;
    n += 1;
    at = found + needle.length;
  }
  return n;
}

function quiet(value) {
  assert.equal(value.look, 0);
  assert.equal(value.joule, null);
  assert.equal(Object.hasOwn(value, "key"), false);
  assert.equal(JSON.stringify(value).includes("\"key\""), false);
}

const door = bundle(DOOR);
const pages = bundle(["index.html", "wallet.html", "meeting.html", "llms.txt"]);
const treeFiles = walk(ROOT.pathname, [".html", ".css"], []);
const tree = treeFiles.map(function (path) { return readFileSync(path, "utf8"); }).join("\n");
const bucket = read();

test("a stripped piece that holds the four laws sticks and returns once", () => {
  const piece = PIECES.find(function (row) { return row.id === "teal-explorer"; });
  const stuck = bucket.stuck.find(function (row) { return row.id === "teal-explorer"; });
  assert.equal(piece.axioms.NO_FORCE, true);
  assert.equal(piece.axioms.HOST_SAFE, true);
  assert.equal(piece.axioms.CLEANUP_FIRST, true);
  assert.equal(piece.axioms.TRUTH_OR_NOTHING, true);
  assert.equal(stuck.admitted, true);
  assert.equal(stuck.reason, "ADMIT");
  assert.equal(count(pages, stuck.what), 1);
  assert.equal(text("index.html").includes(stuck.what), true);
  assert.equal(text("wallet.html").includes(stuck.what), false);
  assert.equal(text("meeting.html").includes(stuck.what), false);
  quiet(stuck);
});

test("a veto divides and stays unknown", () => {
  const veto = bucket.unknown.find(function (row) { return row.id === "violet-moon"; });
  const falseLaw = bucket.unknown.find(function (row) { return row.id === "emoji-line"; });
  assert.equal(veto.admitted, false);
  assert.equal(veto.reason, "VETO");
  assert.equal(falseLaw.admitted, false);
  assert.equal(falseLaw.reason, "VETO");
  assert.equal(bucket.stuck.some(function (row) { return row.id === "violet-moon"; }), false);
  assert.equal(bucket.stuck.some(function (row) { return row.id === "emoji-line"; }), false);
  assert.equal(pages.includes(veto.what), false);
  assert.equal(pages.includes(falseLaw.what), false);
  assert.equal(pages.includes("iris-moon"), false);
  assert.equal(pages.includes("👽"), false);
  quiet(veto);
});

test("a skipped law divides and a missing law divides", () => {
  const skipped = bucket.unknown.find(function (row) { return row.id === "quark-canvas"; });
  const host = bucket.unknown.find(function (row) { return row.id === "field-canvas"; });
  const force = bucket.unknown.find(function (row) { return row.id === "phosphor-bloom"; });
  const missing = bucket.unknown.find(function (row) { return row.id === "google-font"; });
  assert.equal(skipped.reason, "SKIPPED CLEANUP_FIRST");
  assert.equal(host.reason, "SKIPPED HOST_SAFE");
  assert.equal(force.reason, "SKIPPED NO_FORCE");
  assert.equal(missing.reason, "MISSING TRUTH_OR_NOTHING");
  assert.equal(skipped.admitted, false);
  assert.equal(missing.admitted, false);
  assert.equal(pages.includes(host.what), false);
  assert.equal(pages.includes('id="bloom"'), false);
  assert.equal(pages.includes('id="phosphor"'), false);
  quiet(skipped);
  quiet(missing);
});

test("the live surface does not contain a divided piece and stuck is not duplicated", () => {
  const ids = bucket.stuck.map(function (row) { return row.id; });
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(bucket.stuck.length, 1);
  assert.equal(bucket.unknown.length, PIECES.length - 1);
  for (let i = 0; i < bucket.unknown.length; i++) {
    const row = bucket.unknown[i];
    assert.equal(pages.includes(row.what), false, row.id);
    assert.equal(door.includes(row.what), false, row.id);
    quiet(row);
  }
  for (let i = 0; i < PIECES.length; i++) {
    const piece = PIECES[i];
    if (!piece.marks) continue;
    const hay = piece.tree ? tree : door;
    for (let m = 0; m < piece.marks.length; m++) {
      assert.equal(hay.includes(piece.marks[m]), false, piece.id + " " + piece.marks[m]);
    }
  }
  assert.equal(bucket.unknown.length > 0, true);
});

test("the bucket keeps look at 0 and the joule null, with no key, and does not spin", async () => {
  quiet(bucket);
  assert.equal(bucket.counts.stuck, 1);
  assert.equal(bucket.counts.unknown, 9);
  const again = read();
  assert.equal(again.counts.stuck, bucket.counts.stuck);
  assert.equal(again.counts.unknown, bucket.counts.unknown);
  assert.equal(again.stuck, bucket.stuck);
  assert.equal(again.unknown, bucket.unknown);
  const source = text("js/purity-umpire.js");
  assert.equal(source.includes("while"), false);
  assert.equal(source.includes("setInterval"), false);
  assert.equal(/\bkey\b/i.test(source), false);

  const got = await handleBucket(new Request("https://dualiscapax.com/api/purity/bucket"));
  assert.equal(got.status, 200);
  assert.equal(got.headers.get("cache-control"), "no-store");
  const counts = await got.json();
  assert.equal(counts.stuck, 1);
  assert.equal(counts.unknown, 9);
  quiet(counts);
  const second = await handleBucket(new Request("https://dualiscapax.com/api/purity/bucket"));
  assert.deepEqual(await second.json(), counts);
  const posted = await handleBucket(new Request("https://dualiscapax.com/api/purity/bucket", { method: "POST" }));
  assert.equal(posted.status, 405);
  const refused = await posted.json();
  assert.equal(refused.stuck, 1);
  assert.equal(refused.unknown, 9);
  quiet(refused);
});

test("purity left hanging is still on the door", () => {
  const index = text("index.html");
  const wallet = text("wallet.html");
  const meeting = text("meeting.html");
  const seed = text("css/seed.css");
  const writer = text("css/writer.css");
  const law = text("js/dclm-write.js");
  assert.deepEqual(LAWS, ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"]);
  for (let i = 0; i < LAWS.length; i++) assert.equal(law.includes(LAWS[i]), true);
  assert.equal(seed.includes("--iris:#3ee0ff"), true);
  assert.equal(writer.includes('@import url("seed.css")'), true);
  assert.equal((index.match(/stylesheet/g) || []).length, 1);
  assert.equal(index.includes('href="css/writer.css"'), true);
  assert.equal(index.includes("One became two."), true);
  assert.equal(index.includes("Adam and Eve are the human name for that split: one life, two branches."), true);
  assert.equal(index.includes("eFuse is the oldest engineering in the observable universe."), true);
  assert.equal(index.includes("IBM, 2004. eFuse was adopted for micro circuitry."), true);
  assert.equal(index.includes("Nothing to remember."), true);
  assert.equal(index.includes("Iris is pegged to the same permanence."), true);
  assert.equal(index.includes("The published joule is null, so the Merit gate stays shut."), true);
  assert.equal(index.includes("No coin is offered."), true);
  assert.equal(index.includes('href="wallet.html"'), true);
  assert.equal(index.includes('href="meeting.html"'), true);
  assert.equal(meeting.includes("Iris is the watchdog, the dreamer, and the explorer."), true);
  assert.equal(wallet.includes("You have your Universal identification and your wallet."), true);
  assert.equal(/\b(dna|helix|microsurgery)\b/i.test(index + wallet + meeting), false);
  assert.equal(/\bkey\b/i.test(wallet), false);
  assert.equal(index.includes('id="ring-iris"'), true);
  assert.equal(index.includes('id="ring-cosmos"'), true);
  assert.equal(index.includes('id="ring-sym"'), true);
});
