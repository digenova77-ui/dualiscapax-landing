#!/usr/bin/env node
"use strict";

// Read-only inventory of workflow triggers, token permissions, and likely side effects.
// This is a review report, not a deployment gate. Findings must be reviewed before
// converting any baseline warning into a blocking rule.

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const workflowDir = path.join(root, ".github", "workflows");
const outputPath = path.join(root, "workflow-safety-audit.json");

const EVENT_NAMES = [
  "workflow_dispatch", "workflow_call", "workflow_run", "push", "pull_request",
  "pull_request_target", "schedule", "repository_dispatch", "issue_comment",
  "release", "issues", "merge_group"
];

const MUTATION_PATTERNS = [
  ["git-push", /\bgit\s+push\b/i],
  ["ssh-or-scp", /\b(?:ssh|scp|rsync)\b/i],
  ["cloudflare-deploy", /\bwrangler\b[^\n]*(?:\bdeploy\b|pages\s+deploy)/i],
  ["dns-or-ipns", /\b(?:dns_write|ipns_publish|update_dns|dns\s+(?:set|update|delete))\b/i],
  ["cache-purge", /\b(?:purge|purge_everything|cache\s+purge)\b/i],
  ["http-mutation", /\bcurl\b[^\n]*(?:-X\s*(?:POST|PUT|PATCH|DELETE)|--request\s+(?:POST|PUT|PATCH|DELETE))/i],
  ["database-or-service", /\b(?:psql|systemctl\s+(?:restart|stop|start)|ufw\s+|DROP\s+DATABASE|ALTER\s+SYSTEM)\b/i],
  ["publish-or-mint", /\b(?:npm\s+publish|mint|stripe\s+checkout|open\s+checkout|stripe\s+fulfill)\b/i]
];

function eventList(source) {
  const lines = source.split(/\r?\n/).map(line => line.trim());
  return EVENT_NAMES.filter(event => lines.includes(event + ":")).sort();
}

function permissionList(source) {
  const result = [];
  if (/^permissions:\s*write-all\s*$/m.test(source)) result.push("write-all");
  const match = source.match(/^permissions:\s*\n((?:[ \t]+[^\n]*\n?)*)/m);
  if (match) {
    for (const line of match[1].split(/\r?\n/)) {
      const m = line.match(/^\s+([a-zA-Z0-9_-]+):\s*([a-zA-Z0-9_-]+)/);
      if (m) result.push(m[1] + ":" + m[2]);
    }
  }
  return result;
}

function classify(name, source, events, permissions, mutations) {
  const lower = (name + "\n" + source).toLowerCase();
  const hasTestCommand = /\b(?:node\s+--test|npm\s+test|pytest|unittest|playwright\s+test)\b/i.test(source);
  const hasSecretRefs = /secrets\.[A-Z0-9_]+/i.test(source);
  const hasApprovalSignal = /workflow_dispatch|type\s+DEPLOY|confirm(?:ation)?|approval|environment:/i.test(source);

  let kind = "review-required";
  if (mutations.length && events.includes("workflow_dispatch")) kind = "manual-mutation";
  else if (lower.includes("queue/") || lower.includes("claim.py")) kind = "queue-worker";
  else if (events.includes("schedule") && !mutations.length) kind = "scheduled-observer";
  else if (hasTestCommand && !mutations.length) kind = "test-only";
  else if (!mutations.length && !hasSecretRefs && !permissions.some(p => /:write$|write-all/.test(p))) kind = "read-only-or-artifact";

  const findings = [];
  if (!permissions.length) findings.push("no-explicit-permissions-found");
  if (permissions.includes("write-all")) findings.push("broad-write-all-permission");
  if (events.includes("pull_request_target")) findings.push("privileged-pull_request_target-trigger-review");
  if (events.includes("pull_request") && permissions.some(p => /:write$|write-all/.test(p))) {
    findings.push("write-permission-on-pull-request-trigger");
  }
  if (mutations.length && !hasApprovalSignal) findings.push("mutation-pattern-without-obvious-manual-guard");
  if (hasSecretRefs && !mutations.length) findings.push("secret-reference-review");
  return { file: name, classification: kind, triggers: events, permissions, secretReferences: hasSecretRefs,
    mutationSignals: mutations, approvalSignalDetected: hasApprovalSignal, findings };
}

function main() {
  if (!fs.existsSync(workflowDir)) throw new Error("workflow directory missing");
  const files = fs.readdirSync(workflowDir).filter(name => /\.ya?ml$/i.test(name)).sort();
  const workflows = files.map(name => {
    const source = fs.readFileSync(path.join(workflowDir, name), "utf8");
    const mutations = MUTATION_PATTERNS.filter(([, pattern]) => pattern.test(source)).map(([label]) => label);
    return classify(name, source, eventList(source), permissionList(source), mutations);
  });

  const report = {
    schema: "dualis.workflow-safety-audit.v1",
    generatedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || null,
    mode: "read-only-report-no-policy-blocking",
    workflowCount: workflows.length,
    classificationCounts: workflows.reduce((acc, row) => {
      acc[row.classification] = (acc[row.classification] || 0) + 1;
      return acc;
    }, {}),
    findingCount: workflows.reduce((sum, row) => sum + row.findings.length, 0),
    workflows
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n");
  console.log("Workflow safety inventory: " + report.workflowCount + " workflow files");
  console.log("Classification counts: " + JSON.stringify(report.classificationCounts));
  console.log("Review findings: " + report.findingCount);
  console.log("Report written to workflow-safety-audit.json");
  for (const row of workflows) {
    if (row.findings.length) {
      console.log("REVIEW " + row.file + " :: " + row.findings.join(", "));
    }
  }
}

try {
  main();
} catch (error) {
  console.error("Workflow safety audit failed: " + error.message);
  process.exitCode = 1;
}
