import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).with_name("diamond_floor.py")
spec = importlib.util.spec_from_file_location("diamond_floor", MODULE)
df = importlib.util.module_from_spec(spec)
spec.loader.exec_module(df)


class DiamondFloorTests(unittest.TestCase):
    def test_canonical_json_is_order_independent(self):
        self.assertEqual(df.canonical_bytes({"b": 2, "a": 1}), df.canonical_bytes({"a": 1, "b": 2}))

    def test_inventory_is_deterministic(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "root"
            root.mkdir()
            (root / "b.txt").write_text("two", encoding="utf-8")
            (root / "a.json").write_text('{"ok":true}', encoding="utf-8")
            first = df.inventory(root)
            second = df.inventory(root)
            self.assertEqual(first["content_digest"], second["content_digest"])
            self.assertEqual([x["path"] for x in first["entries"]], ["a.json", "b.txt"])

    def test_inventory_excludes_secret_like_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".env").write_text("secret", encoding="utf-8")
            (root / "public.txt").write_text("hello", encoding="utf-8")
            report = df.inventory(root)
            self.assertEqual([x["path"] for x in report["entries"]], ["public.txt"])
            self.assertEqual(report["skipped"][0]["reason"], "secret-like-name")

    def test_ingest_content_address_and_ledger(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "photo.png"
            source.write_bytes(b"sample-image-bytes")
            archive = root / "archive"
            result = df.ingest(source, archive, "https://example.org/photo", "Example Creator", "needs-review", None, "test")
            self.assertEqual(result["status"], "PASS")
            self.assertTrue(Path(result["object_path"]).is_file())
            ledger = df.verify_ledger(archive / "provenance" / "ledger.jsonl")
            self.assertEqual(ledger["status"], "PASS")
            self.assertEqual(ledger["verified_records"], 1)

    def test_reingesting_identical_artifact_is_idempotent(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "audit.json"
            source.write_text('{"status":"observed"}', encoding="utf-8")
            archive = root / "archive"
            first = df.ingest(source, archive, "https://example.org/audit.json", "DualisCapax audit", "needs-review", None, "test snapshot")
            ledger_path = archive / "provenance" / "ledger.jsonl"
            before = ledger_path.read_text(encoding="utf-8")
            second = df.ingest(source, archive, "https://example.org/audit.json", "DualisCapax audit", "needs-review", None, "test snapshot")
            after = ledger_path.read_text(encoding="utf-8")
            self.assertEqual(first["sha256"], second["sha256"])
            self.assertTrue(second["already_ingested"])
            self.assertEqual(before, after)
            self.assertEqual(df.verify_ledger(ledger_path)["verified_records"], 1)

    def test_ledger_detects_tampering(self):
        with tempfile.TemporaryDirectory() as tmp:
            ledger = Path(tmp) / "ledger.jsonl"
            record = {"schema": "x", "previous_record_digest": "0" * 64, "event": "test"}
            record["record_digest"] = df.sha256_bytes(df.canonical_bytes(record))
            ledger.write_text(json.dumps(record) + "\n", encoding="utf-8")
            self.assertEqual(df.verify_ledger(ledger)["status"], "PASS")
            record["event"] = "tampered"
            ledger.write_text(json.dumps(record) + "\n", encoding="utf-8")
            self.assertEqual(df.verify_ledger(ledger)["status"], "FAIL")

    def test_derivative_detects_changes(self):
        before = {"content_digest": "a", "entries": [{"path": "x", "sha256": "1", "destination_class": "code"}]}
        after = {"content_digest": "b", "entries": [{"path": "x", "sha256": "2", "destination_class": "code"}, {"path": "y", "sha256": "3", "destination_class": "research/data"}]}
        result = df.derivative(before, after)
        self.assertEqual(result["changed"][0]["path"], "x")
        self.assertEqual(result["added"][0]["path"], "y")
        self.assertEqual(result["status"], "PARTIAL")
        self.assertEqual(result["change_count"], 2)
        self.assertEqual(result["promotion"], "NOT_AUTHORIZED")

    def test_identical_derivative_is_pass_without_promotion(self):
        report = {"content_digest": "same", "entries": [{"path": "x", "sha256": "1", "destination_class": "code"}]}
        result = df.derivative(report, report)
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["change_count"], 0)
        self.assertEqual(result["promotion"], "NOT_AUTHORIZED")


if __name__ == "__main__":
    unittest.main()
