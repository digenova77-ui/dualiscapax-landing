#!/usr/bin/env python3
"""Trace Diamond Floor derivatives downward and reconcile them upward.

Pure, deterministic validation of supplied evidence documents. No network,
deployment, DNS writes, token issuance, or automatic promotion.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import sys
from pathlib import Path

SCHEMA = "dualis.diamond-derivative.graph.v1"
REPORT_SCHEMA = "dualis.diamond-derivative.report.v1"
LAYERS = ["ceiling", "mesh", "floor", "seed", "taproot", "bedrock"]
RINGS = ["authority", "measurement", "execution_evidence"]
GENESIS = "0" * 64


def canonical_bytes(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False).encode("utf-8")


def digest(value: object) -> str:
    return hashlib.sha256(canonical_bytes(value)).hexdigest()


def node_content_digest(node: dict) -> str:
    return digest({key: value for key, value in node.items() if key != "content_sha256"})


def _issue(code: str, message: str, **details: object) -> dict:
    return {"code": code, "message": message, **details}


def validate_graph(graph: dict) -> dict:
    issues = []
    if graph.get("schema") != SCHEMA:
        issues.append(_issue("SCHEMA_MISMATCH", "Expected the Diamond Derivative graph schema."))
    nodes = graph.get("nodes")
    edges = graph.get("edges")
    rings = graph.get("rings")
    invariants = graph.get("invariants")
    if not isinstance(nodes, list) or not isinstance(edges, list) or not isinstance(rings, dict) or not isinstance(invariants, dict):
        return {"status": "FAIL", "issues": [_issue("GRAPH_SHAPE_INVALID", "nodes, edges, rings, and invariants must have valid object/list types.")], "node_count": 0, "edge_count": 0}
    by_id = {}
    for i, node in enumerate(nodes):
        if not isinstance(node, dict) or not isinstance(node.get("id"), str) or not node["id"]:
            issues.append(_issue("NODE_INVALID", "Each node requires a non-empty id.", index=i))
            continue
        if node["id"] in by_id:
            issues.append(_issue("NODE_ID_DUPLICATE", "Node IDs must be unique.", node_id=node["id"]))
            continue
        by_id[node["id"]] = node
        if node.get("layer") not in LAYERS:
            issues.append(_issue("LAYER_INVALID", "Node has an unknown layer.", node_id=node["id"], layer=node.get("layer")))
        if not isinstance(node.get("content"), (dict, list, str, int, float, bool, type(None))):
            issues.append(_issue("NODE_CONTENT_INVALID", "Node content must be canonical JSON data.", node_id=node["id"]))
        claimed = node.get("content_sha256")
        if not isinstance(claimed, str) or claimed != node_content_digest(node):
            issues.append(_issue("NODE_CONTENT_DIGEST_MISMATCH", "Node content hash does not match its canonical content.", node_id=node["id"]))
        if node.get("verified") is not True:
            issues.append(_issue("NODE_NOT_VERIFIED", "Unverified nodes cannot support an accepted ceiling.", node_id=node["id"]))
        if node.get("source_sha256") is not None and (not isinstance(node["source_sha256"], str) or len(node["source_sha256"]) != 64 or any(ch not in "0123456789abcdef" for ch in node["source_sha256"])):
            issues.append(_issue("SOURCE_HASH_INVALID", "source_sha256 must be a lowercase SHA-256 digest.", node_id=node["id"]))
    edge_keys = set()
    for i, edge in enumerate(edges):
        if not isinstance(edge, dict) or edge.get("from") not in by_id or edge.get("to") not in by_id or not isinstance(edge.get("relation"), str) or not edge.get("relation"):
            issues.append(_issue("EDGE_INVALID", "Each edge needs existing from/to node IDs and a relation.", index=i))
            continue
        key = (edge["from"], edge["to"], edge["relation"])
        if key in edge_keys:
            issues.append(_issue("EDGE_DUPLICATE", "Duplicate typed edges are not permitted.", edge=key))
        edge_keys.add(key)
        if edge.get("verified") is not True:
            issues.append(_issue("EDGE_NOT_VERIFIED", "Unverified edges cannot support an accepted ceiling.", edge=key))
    for ring in RINGS:
        item = rings.get(ring)
        if not isinstance(item, dict) or item.get("status") != "PASS" or not isinstance(item.get("evidence_refs"), list) or not item["evidence_refs"]:
            issues.append(_issue("RING_NOT_PROVEN", "Each ring needs PASS and at least one evidence reference.", ring=ring))
    required_invariants = {"canonicalization", "provenance", "no_force", "host_safe", "zero_residue"}
    missing = sorted(required_invariants - set(invariants))
    if missing:
        issues.append(_issue("INVARIANTS_MISSING", "Required Diamond Floor invariants are missing.", missing=missing))
    for key in sorted(required_invariants & set(invariants)):
        value = invariants[key]
        if not isinstance(value, dict) or value.get("status") != "PASS" or not isinstance(value.get("evidence_ref"), str) or not value["evidence_ref"].strip():
            issues.append(_issue("INVARIANT_NOT_PROVEN", "Each invariant needs PASS and a non-empty evidence reference.", invariant=key))
    layers_seen = {n.get("layer") for n in by_id.values()}
    missing_layers = [layer for layer in LAYERS if layer not in layers_seen]
    if missing_layers:
        issues.append(_issue("LAYER_GAP", "A complete downward trace must represent every layer.", missing=missing_layers))
    # Required trace direction: every adjacent layer boundary must have at least one verified edge.
    for upper, lower in zip(LAYERS, LAYERS[1:]):
        if not any(by_id.get(e.get("from"), {}).get("layer") == upper and by_id.get(e.get("to"), {}).get("layer") == lower and e.get("verified") is True for e in edges if isinstance(e, dict)):
            issues.append(_issue("TRACE_GAP", "No verified edge connects adjacent derivative layers.", from_layer=upper, to_layer=lower))
    status = "PASS" if not issues else "FAIL"
    return {
        "status": status,
        "issues": issues,
        "node_count": len(by_id),
        "edge_count": len(edges),
        "layers_seen": [layer for layer in LAYERS if layer in layers_seen],
        "rings": {ring: (rings.get(ring) or {}).get("status") if isinstance(rings.get(ring), dict) else "MISSING" for ring in RINGS},
        "invariants": {key: (invariants.get(key) or {}).get("status") if isinstance(invariants.get(key), dict) else "MISSING" for key in sorted(required_invariants)},
    }


def graph_digest(graph: dict) -> str:
    return digest(graph)


def derivative(baseline: dict, candidate: dict) -> dict:
    old_nodes = {node.get("id"): node for node in baseline.get("nodes", []) if isinstance(node, dict) and isinstance(node.get("id"), str)}
    new_nodes = {node.get("id"): node for node in candidate.get("nodes", []) if isinstance(node, dict) and isinstance(node.get("id"), str)}
    added_ids = sorted(new_nodes.keys() - old_nodes.keys())
    removed_ids = sorted(old_nodes.keys() - new_nodes.keys())
    common_ids = old_nodes.keys() & new_nodes.keys()
    changed_ids = sorted(node_id for node_id in common_ids if old_nodes[node_id].get("content_sha256") != new_nodes[node_id].get("content_sha256"))
    spectral_changes = sorted(
        [
            {"id": node_id, "layer": new_nodes[node_id].get("layer"), "before": old_nodes[node_id].get("spectrum"), "after": new_nodes[node_id].get("spectrum")}
            for node_id in common_ids
            if old_nodes[node_id].get("spectrum") != new_nodes[node_id].get("spectrum")
        ],
        key=lambda item: item["id"],
    )
    def edge_map(graph: dict) -> dict:
        result = {}
        for edge in graph.get("edges", []):
            if isinstance(edge, dict):
                key = (edge.get("from"), edge.get("to"), edge.get("relation"))
                result[key] = edge
        return result
    old_edges, new_edges = edge_map(baseline), edge_map(candidate)
    added_edges = sorted(new_edges.keys() - old_edges.keys())
    removed_edges = sorted(old_edges.keys() - new_edges.keys())
    def is_cross_layer(edge_key: tuple, node_map: dict) -> bool:
        left, right, _ = edge_key
        return left in node_map and right in node_map and node_map[left].get("layer") != node_map[right].get("layer")
    added_cross_layer = [key for key in added_edges if is_cross_layer(key, new_nodes)]
    removed_cross_layer = [key for key in removed_edges if is_cross_layer(key, old_nodes)]
    changed_rings = sorted(ring for ring in RINGS if baseline.get("rings", {}).get(ring) != candidate.get("rings", {}).get(ring))
    changed_invariants = sorted(key for key in set(baseline.get("invariants", {})) | set(candidate.get("invariants", {})) if baseline.get("invariants", {}).get(key) != candidate.get("invariants", {}).get(key))
    payload = {
        "schema": "dualis.diamond-derivative.delta.v1",
        "baseline_sha256": graph_digest(baseline),
        "candidate_sha256": graph_digest(candidate),
        "nodes": {"added": [{"id": x, "layer": new_nodes[x].get("layer")} for x in added_ids], "removed": [{"id": x, "layer": old_nodes[x].get("layer")} for x in removed_ids], "changed": [{"id": x, "layer": new_nodes[x].get("layer"), "before_content_sha256": old_nodes[x].get("content_sha256"), "after_content_sha256": new_nodes[x].get("content_sha256")} for x in changed_ids]},
        "edges": {"added": [{"from": a, "to": b, "relation": c} for a, b, c in sorted(added_edges)], "removed": [{"from": a, "to": b, "relation": c} for a, b, c in sorted(removed_edges)]},
        "spectral_changes": spectral_changes,
        "cross_layer_edges": {
            "added": [{"from": a, "to": b, "relation": c} for a, b, c in sorted(added_cross_layer)],
            "removed": [{"from": a, "to": b, "relation": c} for a, b, c in sorted(removed_cross_layer)],
        },
        "rings_changed": changed_rings,
        "invariants_changed": changed_invariants,
        "promotion": "NOT_AUTHORIZED",
        "note": "A derivative describes differences; it does not itself prove correctness or authorize promotion.",
    }
    return {**payload, "derivative_sha256": digest(payload)}


def build_report(candidate: dict, baseline: dict | None = None) -> dict:
    validation = validate_graph(candidate)
    delta = derivative(baseline, candidate) if baseline is not None else None
    overall = validation["status"]
    payload = {
        "schema": REPORT_SCHEMA,
        "status": overall,
        "candidate_sha256": graph_digest(candidate),
        "validation": validation,
        "delta": delta,
        "direction": ["ceiling", "mesh", "floor", "seed", "taproot", "bedrock"],
        "rings": RINGS,
        "policy": {"fail_closed": True, "automatic_promotion": False, "production_mutations": False, "token_issuance": False},
    }
    return {**payload, "report_sha256": digest(payload)}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("candidate", type=Path)
    parser.add_argument("--baseline", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    try:
        candidate = json.loads(args.candidate.read_text(encoding="utf-8"))
        baseline = json.loads(args.baseline.read_text(encoding="utf-8")) if args.baseline else None
        if not isinstance(candidate, dict) or (baseline is not None and not isinstance(baseline, dict)):
            raise ValueError("candidate and baseline must be JSON objects")
        report = build_report(candidate, baseline)
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_bytes(canonical_bytes(report) + b"\n")
        print(json.dumps(report, indent=2, ensure_ascii=False))
        return 0 if report["status"] == "PASS" else 2
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "FAIL", "error": str(exc)}, indent=2), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
