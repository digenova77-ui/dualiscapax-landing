"""Tests for the static GitHub Actions risk inventory."""
import json
import tempfile
import unittest
from pathlib import Path

from autonomy.workflow_audit import compare_baseline, inspect_workflow, report_json, scan_workflows


class WorkflowAuditTests(unittest.TestCase):
    def test_detects_mutable_actions_write_permissions_and_push(self):
        source = """permissions:
  contents: write
steps:
  - uses: actions/checkout@v4
  - uses: vendor/action@v2
  - run: git push origin main
"""
        rules = {item.rule_id for item in inspect_workflow(source, ".github/workflows/sample.yml")}
        self.assertIn("WRITE_PERMISSION", rules)
        self.assertIn("ACTION_NOT_SHA_PINNED", rules)
        self.assertIn("REPOSITORY_MUTATION_COMMAND", rules)
        self.assertIn("CHECKOUT_CREDENTIALS_WITH_WRITE", rules)

    def test_detects_pull_request_target_and_oidc(self):
        source = """on:
  pull_request_target:
permissions:
  contents: read
  id-token: write
"""
        rules = {item.rule_id for item in inspect_workflow(source, "sample.yml")}
        self.assertIn("PR_TARGET_EVENT", rules)
        self.assertIn("OIDC_TOKEN_MINTING", rules)

    def test_sha_pinned_action_and_read_only_permissions_are_not_write_findings(self):
        source = """permissions:
  contents: read
steps:
  - uses: actions/checkout@0123456789abcdef0123456789abcdef01234567
"""
        rules = {item.rule_id for item in inspect_workflow(source, "safe.yml")}
        self.assertNotIn("WRITE_PERMISSION", rules)
        self.assertNotIn("ACTION_NOT_SHA_PINNED", rules)

    def test_scan_is_deterministic_and_does_not_echo_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / ".github" / "workflows"
            path.mkdir(parents=True)
            (path / "sample.yml").write_text(
                "permissions:\n  contents: write\nrun: echo super-secret-value\n",
                encoding="utf-8",
            )
            first = report_json(scan_workflows(tmp))
            second = report_json(scan_workflows(tmp))
            self.assertEqual(first, second)
            self.assertNotIn("super-secret-value", first)
            self.assertIn("WRITE_PERMISSION", first)


    def test_baseline_detects_new_and_resolved_findings(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "baseline.json"
            path.write_text(json.dumps({
                "schema_version": "trinity-workflow-risk-baseline-v1",
                "findings": [
                    {"path": "a.yml", "rule_id": "WRITE_PERMISSION", "severity": "high"},
                    {"path": "b.yml", "rule_id": "OIDC_TOKEN_MINTING", "severity": "medium"},
                ],
            }), encoding="utf-8")
            current = [
                inspect_workflow("permissions: " + chr(10) + "  contents: write" + chr(10), "a.yml")[0],
                *inspect_workflow("uses: vendor/action@v2\n", "c.yml"),
            ]
            added, resolved = compare_baseline(current, path)
            self.assertIn(("c.yml", "ACTION_NOT_SHA_PINNED"), [(f.path, f.rule_id) for f in added])
            self.assertIn({"path": "b.yml", "rule_id": "OIDC_TOKEN_MINTING", "severity": "medium"}, resolved)



    def test_detects_chained_git_push(self):
        source = """steps:
  - run: git pull --rebase origin main && git push origin HEAD || true
"""
        rules = {item.rule_id for item in inspect_workflow(source, "mutation.yml")}
        self.assertIn("REPOSITORY_MUTATION_COMMAND", rules)

    def test_retired_swarm_runner_is_inert(self):
        path = Path(".github/workflows/swarm_runner.yml")
        if not path.exists():
            self.skipTest("repository workflow file not present in this test environment")
        findings = inspect_workflow(path.read_text(encoding="utf-8"), path.as_posix())
        dangerous = {
            "WRITE_PERMISSION", "CHECKOUT_CREDENTIALS_WITH_WRITE",
            "REPOSITORY_MUTATION_COMMAND", "OIDC_TOKEN_MINTING",
        }
        self.assertFalse(dangerous.intersection(item.rule_id for item in findings))

    def test_matching_reviewed_baseline_has_zero_drift(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "baseline.json"
            source = "permissions: " + chr(10) + "  contents: write" + chr(10)
            finding = inspect_workflow(source, "a.yml")[0]
            path.write_text(json.dumps({
                "schema_version": "trinity-workflow-risk-baseline-v1",
                "findings": [{
                    "path": finding.path,
                    "rule_id": finding.rule_id,
                    "severity": finding.severity,
                }],
            }), encoding="utf-8")
            added, resolved = compare_baseline([finding], path)
            self.assertEqual(added, [])
            self.assertEqual(resolved, [])

    def test_baseline_rejects_duplicate_or_invalid_entries(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "baseline.json"
            entry = {"path": "a.yml", "rule_id": "WRITE_PERMISSION", "severity": "high"}
            path.write_text(json.dumps({
                "schema_version": "trinity-workflow-risk-baseline-v1",
                "findings": [entry, entry],
            }), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "duplicate"):
                compare_baseline([], path)

    def test_missing_workflow_directory_is_empty(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(scan_workflows(tmp), [])


if __name__ == "__main__":
    unittest.main()
