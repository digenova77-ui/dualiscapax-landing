"""Tests for the static GitHub Actions risk inventory."""
import tempfile
import unittest
from pathlib import Path

from autonomy.workflow_audit import inspect_workflow, report_json, scan_workflows


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

    def test_missing_workflow_directory_is_empty(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(scan_workflows(tmp), [])


if __name__ == "__main__":
    unittest.main()
