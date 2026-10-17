import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).with_name("evidence_map.py")
spec = importlib.util.spec_from_file_location("diamond_evidence_map", MODULE)
evidence_map = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evidence_map)


def seed_root(root: Path) -> None:
    archive = root / "research" / "photo-archive"
    (archive / "provenance").mkdir(parents=True)
    (archive / "discoveries.json").write_text(json.dumps({
        "schema": "dualis.earth-photo-discovery.v1",
        "updated_at": "2026-10-17T00:00:00Z",
        "policy": {"rights_review_required_before_mirroring": True},
        "items": [{"source_url": "https://example.org/item", "status": "discovered-needs-rights-review"}]
    }), encoding="utf-8")
    (archive / "public-dns-audit.json").write_text(json.dumps({
        "schema": "dualis.public-dns-audit.v1",
        "checked_at": "2026-10-17T00:00:00Z",
        "scope": "saved public resolver snapshot",
        "mutations_performed": False,
        "records": [{"name": "example.org", "type": "A", "status": 0, "answers": []}],
        "https": [
            {"url": "https://example.org/", "status": 200},
            {"url": "https://example.org/iris/status", "status": 404, "error": "HTTPError"}
        ]
    }), encoding="utf-8")
    (archive / "provenance" / "ledger.jsonl").write_text("", encoding="utf-8")


class EvidenceMapTests(unittest.TestCase):
    def test_builds_hash_bound_candidate_and_stays_blocked(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            seed_root(root)
            result = evidence_map.build_evidence_map(root)
            self.assertEqual(result["schema"], evidence_map.SCHEMA)
            self.assertEqual(result["status"], "BLOCKED")
            self.assertFalse(result["policy"]["independent_evidence_verification"])
            self.assertFalse(result["policy"]["automatic_promotion"])
            self.assertEqual([n["layer"] for n in result["nodes"]], evidence_map.LAYERS)
            self.assertTrue(all(n["verified"] is False for n in result["nodes"]))
            self.assertTrue(all(e["verified"] is False for e in result["edges"]))
            self.assertEqual(result["nodes"][3]["content"]["http_findings"][0]["status"], 404)
            self.assertEqual(result["nodes"][4]["content"]["ledger_integrity"]["status"], "BLOCKED")
            for item in result["generated_from"]:
                raw = (root / item["path"]).read_bytes()
                self.assertEqual(item["sha256"], evidence_map.digest_bytes(raw))
            for node in result["nodes"]:
                expected = evidence_map.digest({k: v for k, v in node.items() if k != "content_sha256"})
                self.assertEqual(node["content_sha256"], expected)
            self.assertEqual(result["map_sha256"], evidence_map.digest({k: v for k, v in result.items() if k != "map_sha256"}))

    def test_saved_snapshot_is_not_misrepresented_as_live_check(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            seed_root(root)
            result = evidence_map.build_evidence_map(root)
            self.assertIn("saved public audit", result["scope"])
            self.assertFalse(result["policy"]["network_access"])
            self.assertFalse(result["policy"]["production_mutations"])

    def test_missing_source_fails_instead_of_generating_green_map(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileNotFoundError):
                evidence_map.build_evidence_map(Path(tmp))

    def test_invalid_ledger_is_fail_closed(self):
        raw = b'{"schema":"bad","previous_record_digest":"0000000000000000000000000000000000000000000000000000000000000000","record_digest":"bad"}\n'
        self.assertEqual(evidence_map.verify_ledger(raw)["status"], "FAIL")


if __name__ == "__main__":
    unittest.main()
