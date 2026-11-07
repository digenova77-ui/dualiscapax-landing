import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).with_name("world_status.py")
spec = importlib.util.spec_from_file_location("diamond_world_status", MODULE)
world = importlib.util.module_from_spec(spec)
spec.loader.exec_module(world)
graph_module = world.graph_module


def make_graph():
    nodes = []
    for i, layer in enumerate(graph_module.LAYERS):
        domain = {"ceiling": "governance", "mesh": "software", "floor": "science", "seed": "earth", "taproot": "identity", "bedrock": "governance"}[layer]
        node = {"id": layer, "layer": layer, "domain": domain, "content": {"index": i}, "source_sha256": ("%064x" % (i + 1)), "verified": True}
        node["content_sha256"] = graph_module.node_content_digest(node)
        nodes.append(node)
    edges = [{"from": a, "to": b, "relation": "derives", "verified": True} for a, b in zip(graph_module.LAYERS, graph_module.LAYERS[1:])]
    rings = {name: {"status": "PASS", "evidence_refs": [f"evidence://{name}/1"]} for name in graph_module.RINGS}
    invariants = {name: {"status": "PASS", "evidence_ref": f"evidence://invariant/{name}"} for name in ("canonicalization", "provenance", "no_force", "host_safe", "zero_residue")}
    return {"schema": graph_module.SCHEMA, "description": "fixture graph", "nodes": nodes, "edges": edges, "rings": rings, "invariants": invariants}


def seed_root(root):
    archive = root / "research" / "photo-archive"
    diamond = root / "research" / "diamond-floor"
    archive.mkdir(parents=True)
    diamond.mkdir(parents=True)
    (archive / "discoveries.json").write_text(json.dumps({"schema": "dualis.earth-photo-discovery.v1", "items": [{"source_url": "https://example.org/source"}], "policy": {}}), encoding="utf-8")
    (archive / "public-dns-audit.json").write_text(json.dumps({"schema": "dualis.public-dns-audit.v1", "checked_at": "2026-10-17T00:00:00+00:00", "mutations_performed": False, "records": [{"name": "example.org", "type": "A", "status": 0}], "https": [{"url": "https://example.org", "status": 200}]}), encoding="utf-8")
    ledger = archive / "provenance" / "ledger.jsonl"
    ledger.parent.mkdir()
    ledger.write_text("", encoding="utf-8")
    return archive, diamond


class WorldStatusTests(unittest.TestCase):
    def test_template_is_blocked_not_misreported_as_live_proof(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            archive, diamond = seed_root(root)
            (diamond / "graph.template.json").write_text(json.dumps({
                "schema": graph_module.SCHEMA,
                "description": "Template only. Replace evidence before validation.",
                "nodes": [], "edges": [], "rings": {}, "invariants": {}
            }), encoding="utf-8")
            report = world.build_world_status(root)
            self.assertEqual(report["checks"]["derivative_graph"]["status"], "BLOCKED")
            self.assertEqual(report["status"], "BLOCKED")
            self.assertFalse(report["policy"]["external_evidence_independently_verified"])
            self.assertFalse(report["policy"]["automatic_promotion"])

    def test_structurally_valid_graph_still_blocks_unresolved_evidence_refs(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            archive, diamond = seed_root(root)
            graph_path = diamond / "candidate.json"
            graph_path.write_text(json.dumps(make_graph()), encoding="utf-8")
            report = world.build_world_status(root, graph_path)
            self.assertEqual(report["checks"]["derivative_graph"]["structural_validation"]["status"], "PASS")
            self.assertEqual(report["checks"]["derivative_graph"]["status"], "BLOCKED")
            self.assertEqual(report["checks"]["derivative_graph"]["reason"], "external-evidence-not-independently-verified")
            self.assertEqual(report["status"], "BLOCKED")

    def test_tampered_graph_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            archive, diamond = seed_root(root)
            graph = make_graph()
            graph["nodes"][0]["content"]["index"] = 999
            graph_path = diamond / "candidate.json"
            graph_path.write_text(json.dumps(graph), encoding="utf-8")
            report = world.build_world_status(root, graph_path)
            self.assertEqual(report["checks"]["derivative_graph"]["status"], "FAIL")
            self.assertEqual(report["status"], "FAIL")

    def test_rollup_priority_is_fail_then_blocked_then_partial(self):
        self.assertEqual(world.status_rollup({"a": {"status": "PARTIAL"}, "b": {"status": "BLOCKED"}}), "BLOCKED")
        self.assertEqual(world.status_rollup({"a": {"status": "BLOCKED"}, "b": {"status": "FAIL"}}), "FAIL")


if __name__ == "__main__":
    unittest.main()
