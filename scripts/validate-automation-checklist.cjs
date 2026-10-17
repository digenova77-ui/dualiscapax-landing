const assert = require("node:assert/strict");
const fs = require("node:fs");

const path = "docs/ops/AUTOMATION_EXCELLENCE_CHECKLIST.md";
const source = fs.readFileSync(path, "utf8");
const lines = source.split(/\r?\n/);
const checklistItems = lines.filter((line) => /^- \[[ x]\] \S/.test(line));
const checkedItems = checklistItems.filter((line) => line.startsWith("- [x] "));
const uncheckedItems = checklistItems.filter((line) => line.startsWith("- [ ] "));

const requiredHeadings = [
  "Operating law",
  "A. Repository and source-of-truth control",
  "B. CI and test automation",
  "C. Iris UI and capability truthfulness",
  "D. API, kernel, and telemetry",
  "E. Identity and cross-domain handoff",
  "F. Bridge, routing, and apex quarantine",
  "G. Cloudflare and release automation",
  "H. Live-server safety",
  "I. Automation engine reliability",
  "J. Evidence, integrity, and audit ledger",
  "K. Operational runbooks",
  "L. Acceptance gate for automation excellence",
  "Current known checkpoint",
  "Next safe execution order"
];

assert.ok(source.startsWith("# Diamond-Floor Automation Excellence Checklist"), "checklist title missing");
assert.ok(source.includes("**Updated:** 2026-10-17"), "dated checkpoint missing");
assert.ok(checklistItems.length >= 250, `expected at least 250 granular items, got ${checklistItems.length}`);

for (const heading of requiredHeadings) {
  assert.ok(lines.some((line) => line.startsWith("## ") && line.includes(heading)), `required section missing: ${heading}`);
}

for (const line of lines.filter((line) => /^- \[[^]]*\]/.test(line))) {
  assert.match(line, /^- \[[ x]\] .+$/, `malformed checklist item: ${line}`);
}

assert.ok(checkedItems.length <= 10, "too many checklist controls are marked complete without an explicit evidence-review pass");
assert.equal(checkedItems.length + uncheckedItems.length, checklistItems.length, "unexpected checklist state marker");

console.log(`Automation checklist validation passed: ${checklistItems.length} items (${checkedItems.length} checked, ${uncheckedItems.length} open), ${requiredHeadings.length} required sections.`);
