import importlib.util
import unittest
from pathlib import Path

MODULE = Path(__file__).with_name("derivative_graph.py")
spec = importlib.util.spec_from_file_location("derivative_graph", MODULE)
dg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dg)


def make_graph():
    layers = dg.LAYERS
    nodes = []
    for i, layer in enumerate(layers):
        domain = {"ceiling": "governance", "mesh": "software", "floor": "science", "seed": "earth", "taproot": "identity", "bedrock": "governance"}[layer]
        node = {"id": layer, "layer": layer, "domain": domain, "content": {"index": i, "value": "baseline"}, "source_sha256": ("%064x" % (i + 1)), "verified": True}
        node["content_sha256"] = dg.node_content_digest(node)
        nodes.append(node)
    edges = [{"from": a, "to": b, "relation": "derives", "verified": True} for a, b in zip(layers, layers[1:])]
    rings = {name: {"status": "PASS", "evidence_refs": [f"evidence://{name}/1"]} for name in dg.RINGS}
    invariants = {name: {"status": "PASS", "evidence_ref": f"evidence://invariant/{name}"} for name in ("canonicalization", "provenance", "no_force", "host_safe", "zero_residue")}
    return {"schema": dg.SCHEMA, "nodes": nodes, "edges": edges, "rings": rings, "invariants": invariants}


class DiamondDerivativeGraphTests(unittest.TestCase):
    def test_complete_verified_graph_passes(self):
        result = dg.validate_graph(make_graph())
        self.assertEqual(result["status"], "PASS", result["issues"])
        self.assertEqual(result["layers_seen"], dg.LAYERS)

    def test_missing_ring_evidence_fails_closed(self):
        graph = make_graph()
        graph["rings"]["measurement"] = {"status": "PASS", "evidence_refs": []}
        result = dg.validate_graph(graph)
        self.assertEqual(result["status"], "FAIL")
        self.assertIn("RING_NOT_PROVEN", [x["code"] for x in result["issues"]])

    def test_floor_trace_gap_fails_closed(self):
        graph = make_graph()
        graph["edges"] = [e for e in graph["edges"] if not (e["from"] == "floor" and e["to"] == "seed")]
        result = dg.validate_graph(graph)
        self.assertIn("TRACE_GAP", [x["code"] for x in result["issues"]])

    def test_node_content_tampering_fails_closed(self):
        graph = make_graph()
        graph["nodes"][2]["content"]["value"] = "tampered"
        result = dg.validate_graph(graph)
        self.assertIn("NODE_CONTENT_DIGEST_MISMATCH", [x["code"] for x in result["issues"]])

    def test_derivative_measures_node_edge_ring_and_invariant_changes(self):
        baseline = make_graph()
        candidate = make_graph()
        candidate["nodes"][1]["content"]["value"] = "new"
        candidate["nodes"][1]["spectrum"] = {"band": "alpha", "power": 0.42, "unit": "normalized"}
        candidate["nodes"][1]["content_sha256"] = dg.node_content_digest(candidate["nodes"][1])
        candidate["edges"].append({"from": "mesh", "to": "floor", "relation": "spectral-supports", "verified": True})
        candidate["rings"]["measurement"] = {"status": "PARTIAL", "evidence_refs": ["evidence://measurement/2"]}
        candidate["invariants"]["zero_residue"] = {"status": "BLOCKED", "evidence_ref": "evidence://invariant/zero-residue-2"}
        delta = dg.derivative(baseline, candidate)
        self.assertEqual(delta["nodes"]["changed"][0]["id"], "mesh")
        self.assertEqual(delta["edges"]["added"][0]["relation"], "spectral-supports")
        self.assertEqual(delta["spectral_changes"][0]["id"], "mesh")
        self.assertEqual(delta["cross_layer_edges"]["added"][0]["relation"], "spectral-supports")
        self.assertEqual(delta["cross_domain_edges"]["added"][0]["relation"], "spectral-supports")
        self.assertEqual(delta["rings_changed"], ["measurement"])
        self.assertEqual(delta["invariants_changed"], ["zero_residue"])
        self.assertEqual(delta["promotion"], "NOT_AUTHORIZED")

    def test_report_never_authorizes_promotion(self):
        report = dg.build_report(make_graph())
        self.assertEqual(report["status"], "PASS")
        self.assertFalse(report["policy"]["automatic_promotion"])
        self.assertFalse(report["policy"]["production_mutations"])
        self.assertFalse(report["policy"]["token_issuance"])


if __name__ == "__main__":
    unittest.main()
