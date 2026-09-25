import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPlate, gift, canOpen, ladder, nextDoor, markHelper, ISSUED } from "./seals.mjs";

const dir = dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(readFileSync(join(dir, "seals.json"), "utf8"));

let failed = 0;
function assert(name, cond) {
  if (!cond) {
    failed += 1;
    console.error("FAIL", name);
  } else {
    console.log("ok", name);
  }
}

const plate = loadPlate(raw);
assert("issued no", plate.issued === false && ISSUED === false);
assert("tags unset", plate.seals.every((s) => s.tag == null));
assert("received zero", plate.houseReceived === 0 && plate.seals.every((s) => s.received === 0));
assert("unset cannot open", plate.seals.every((s) => canOpen(plate, s).open === false));
assert("ladder empty while tags null", ladder(plate).length === 0);
assert("next door none", nextDoor(plate) === null);

const live = loadPlate({
  issued: false,
  houseReceived: 0,
  helpers: [],
  seals: [
    { id: "draw", kind: "engineering", title: "drawing", tag: 50_000, ready: true, received: 0 },
    { id: "run", kind: "medical", title: "run", tag: 15_000_000, ready: false, received: 0 },
  ],
});

assert("draft stays shut even if house is fat", (() => {
  gift(live, 15_000_000, null);
  return canOpen(live, live.seals[1]).open === false;
})());
assert("cheap ready opens from house pot", canOpen(live, live.seals[0]).open === true);
assert("ladder cheap first", ladder(live)[0].id === "draw" && ladder(live)[0].open === true);
assert("next door is the drawing", nextDoor(live).id === "draw");

const labeled = loadPlate({
  issued: false,
  houseReceived: 0,
  helpers: [],
  seals: [
    { id: "x", kind: "engineering", title: "x", tag: 100, ready: true, received: 0, labeledOnly: true },
    { id: "y", kind: "engineering", title: "y", tag: 100, ready: true, received: 0 },
  ],
});
gift(labeled, 100, null);
assert("labeled-only ignores house", canOpen(labeled, labeled.seals[0]).open === false);
assert("unlabeled uses house", canOpen(labeled, labeled.seals[1]).open === true);
gift(labeled, 100, "x");
assert("labeled gift opens x", canOpen(labeled, labeled.seals[0]).open === true);
assert("bad label rejected", gift(labeled, 1, "nope").ok === false);
assert("zero gift rejected", gift(labeled, 0, null).ok === false);

markHelper(plate, "sitting-1", "eng-example", 0);
assert("helper is a list not equity", plate.helpers.length === 1 && !("share" in plate.helpers[0]));

if (failed) {
  console.error(failed, "failed");
  process.exit(1);
}
console.log("seals 14/14");
