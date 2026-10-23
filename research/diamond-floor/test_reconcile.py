import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).with_name("reconcile.py")
spec = importlib.util.spec_from_file_location("diamond_reconcile", MODULE)
rc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rc)


class ReconciliationTests(unittest.TestCase):
    def test_inventory_digest_tampering_fails_closed(self):
        payload = {"schema": "dualis.diamond-floor.inventory.v1", "root_label": "x", "entries": [], "skipped": []}
        report = {**payload, "content_digest": rc.digest(payload)}
        self.assertEqual(rc.check_inventory(report)["status"], "PASS")
        report["entries"] = [{"path": "x", "sha256": "fake"}]
        self.assertEqual(rc.check_inventory(report)["reason"], "inventory-content-digest-mismatch")

    def test_empty_discovery_is_partial_not_success(self):
        report = {"schema": "dualis.earth-photo-discovery.v1", "items": [], "policy": {"rights_review_required_before_mirroring": True}}
        self.assertEqual(rc.check_discoveries(report)["status"], "PARTIAL")

    def test_placeholder_dns_report_is_blocked(self):
        report = {"schema": "dualis.public-dns-audit.v1", "checked_at": None, "mutations_performed": False, "records": [], "https": []}
        result = rc.check_dns(report)
        self.assertEqual(result["status"], "BLOCKED")
        self.assertEqual(result["reason"], "dns-audit-not-run")

    def test_dns_http_errors_are_not_green(self):
        report = {
            "schema": "dualis.public-dns-audit.v1",
            "checked_at": "2026-10-17T00:00:00+00:00",
            "mutations_performed": False,
            "records": [{"name": "example.invalid", "type": "A", "status": 3}],
            "https": [{"url": "https://example.invalid", "error": "URLError"}],
        }
        result = rc.check_dns(report)
        self.assertEqual(result["status"], "PARTIAL")
        self.assertEqual(len(result["findings"]), 2)

    def test_ledger_chain_and_digest(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "ledger.jsonl"
            record = {"schema": "test", "previous_record_digest": "0" * 64, "event": "test"}
            record["record_digest"] = rc.digest(record)
            path.write_text(json.dumps(record) + "\n", encoding="utf-8")
            self.assertEqual(rc.check_ledger(path)["status"], "PASS")
            path.write_text("", encoding="utf-8")
            self.assertEqual(rc.check_ledger(path)["reason"], "ledger-empty")
            path.write_text(json.dumps(record) + "\n", encoding="utf-8")
            record["event"] = "tampered"
            path.write_text(json.dumps(record) + "\n", encoding="utf-8")
            self.assertEqual(rc.check_ledger(path)["status"], "FAIL")

    def test_reconciliation_never_claims_promotion(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            inv = {"schema": "dualis.diamond-floor.inventory.v1", "root_label": "x", "entries": [], "skipped": []}
            inv["content_digest"] = rc.digest(inv)
            disc = {"schema": "dualis.earth-photo-discovery.v1", "items": [], "policy": {}}
            dns = {"schema": "dualis.public-dns-audit.v1", "checked_at": None, "mutations_performed": False, "records": [], "https": []}
            ledger = root / "ledger.jsonl"
            ledger.write_text("", encoding="utf-8")
            files = [root / "inventory.json", root / "discoveries.json", root / "dns.json"]
            for path, data in zip(files, (inv, disc, dns)):
                path.write_text(json.dumps(data), encoding="utf-8")
            result = rc.reconcile(*files, ledger)
            self.assertEqual(result["status"], "BLOCKED")
            self.assertFalse(result["policy"]["automated_promotion"])
            self.assertFalse(result["policy"]["production_mutations_performed"])


if __name__ == "__main__":
    unittest.main()
