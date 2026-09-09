#!/usr/bin/env node
import { readFileSync } from "node:fs";

const pack = JSON.parse(readFileSync("data/jurisdiction-spine.json", "utf8"));
const why = readFileSync("why.html", "utf8");
const qc = readFileSync("qc.html", "utf8");
const fails = [];

function assert(name, cond, extra) {
  if (cond) {
    console.log("PASS", name);
    return;
  }
  fails.push(name);
  console.log("FAIL", name, extra || "");
}

assert("operator-pinned", pack.operator && /OBCA/.test(pack.operator.corporate_no || pack.operator.corporate_act));
assert("qc-first-class", pack.jurisdictions["CA-QC"] && pack.jurisdictions["CA-QC"].status === "first-class");
assert("qc-not-ohip", !/OHIP/.test(pack.jurisdictions["CA-QC"].health_desk || ""));
assert("qc-education-cqlr", /I-13\.3/.test(pack.jurisdictions["CA-QC"].education_act || ""));
assert("qc-audience-not-ontario-edu", !/Education Act/.test(pack.jurisdictions["CA-QC"].audience_line || ""));
assert("why-has-data-jx", /data-jx="audience_line"/.test(why));
assert("why-has-picker", /data-jx-pick/.test(why));
assert("qc-page-exists", /data-jx="education_act"/.test(qc));
assert("qc-page-not-obca-desk", !/this desk is OBCA/i.test(qc));

if (fails.length) {
  console.error("JURAL_FAIL", fails.join(","));
  process.exit(1);
}
console.log("JURAL_GREEN operator-pinned audience-follows-picker");
