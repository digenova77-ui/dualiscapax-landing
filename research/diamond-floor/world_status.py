#!/usr/bin/env python3
"""Produce one fail-closed status across Diamond Floor evidence inputs.

No network access, DNS writes, deployment, server changes, or token issuance.
A structurally valid graph is not accepted unless its referenced external
evidence has been independently resolved; this CLI does not resolve it.
"""
from __future__ import annotations
import argparse
import hashlib
import importlib.util
import json
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCHEMA = "dualis.diamond-floor.world-status.v1"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load module: {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


reconcile_module = load_module("diamond_floor_reconcile", HERE / "reconcile.py")
diamond_floor_module = load_module("diamond_floor_core", HERE / "diamond_floor.py")
graph_module = load_module("diamond_derivative_graph", HERE / "derivative_graph.py")


def canonical_bytes(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False).encode("utf-8")


def digest(value: object) -> str:
    return hashlib.sha256(canonical_bytes(value)).hexdigest()


def status_rollup(checks: dict) -> str:
    statuses = [item.get("status", "FAIL") for item in checks.values()]
    if "FAIL" in statuses:
        return "FAIL"
    if "BLOCKED" in statuses:
        return "BLOCKED"
    if "PARTIAL" in statuses:
        return "PARTIAL"
    return "PASS"


def build_world_status(root: Path, graph_path: Path | None = None) -> dict:
    root = root.resolve()
    archive = root / "research" / "photo-archive"
    diamond = root / "research" / "diamond-floor"
    inventory_report = diamond_floor_module.inventory(root)

    with tempfile.TemporaryDirectory(prefix="dualis-world-status-") as tmp:
        inventory_path = Path(tmp) / "inventory.json"
        inventory_path.write_bytes(canonical_bytes(inventory_report) + b"\n")
        evidence = reconcile_module.reconcile(
            inventory_path,
            archive / "discoveries.json",
            archive / "public-dns-audit.json",
            archive / "provenance" / "ledger.jsonl",
        )

    graph_path = graph_path or diamond / "graph.template.json"
    graph_input = {"status": "BLOCKED", "reason": "graph-input-missing"}
    graph_sha256 = None
    try:
        graph_bytes = graph_path.read_bytes()
        graph_sha256 = hashlib.sha256(graph_bytes).hexdigest()
        graph = json.loads(graph_bytes.decode("utf-8"))
        if not isinstance(graph, dict):
            graph_input = {"status": "FAIL", "reason": "graph-root-not-object"}
        else:
            structural = graph_module.validate_graph(graph)
            is_template = (
                "Template only" in str(graph.get("description", ""))
                or any(
                    isinstance(node, dict) and str(node.get("content_sha256", "")).startswith("REPLACE_")
                    for node in graph.get("nodes", [])
                )
            )
            if is_template:
                graph_input = {
                    "status": "BLOCKED",
                    "reason": "graph-is-explicit-template",
                    "structural_validation": structural,
                }
            elif structural["status"] != "PASS":
                graph_input = {"status": "FAIL", "reason": "graph-structural-validation-failed", "structural_validation": structural}
            else:
                # A reference string is not proof that the referenced record exists
                # or that its issuer, signature, calibration, or result is valid.
                graph_input = {
                    "status": "BLOCKED",
                    "reason": "external-evidence-not-independently-verified",
                    "structural_validation": structural,
                    "evidence_reference_verification": "NOT_IMPLEMENTED",
                }
    except FileNotFoundError:
        pass
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        graph_input = {"status": "FAIL", "reason": "graph-input-invalid", "detail": str(exc)}

    checks = dict(evidence["checks"])
    checks["derivative_graph"] = graph_input
    checks["inventory_runtime"] = {
        "status": "PASS",
        "entries": len(inventory_report["entries"]),
        "skipped": len(inventory_report["skipped"]),
        "content_digest": inventory_report["content_digest"],
    }
    overall = status_rollup(checks)
    payload = {
        "schema": SCHEMA,
        "status": overall,
        "checks": checks,
        "evidence": {
            "reconciliation_schema": evidence["schema"],
            "reconciliation_digest": evidence["reconciliation_digest"],
            "inventory_content_digest": inventory_report["content_digest"],
            "graph_input_sha256": graph_sha256,
        },
        "policy": {
            "fail_closed": True,
            "external_evidence_independently_verified": False,
            "production_mutations_performed": False,
            "dns_mutations_performed": False,
            "server_or_database_mutations_performed": False,
            "automatic_promotion": False,
            "token_issuance": False,
        },
        "interpretation": [
            "PASS means every configured check passed; it does not mean every domain on Earth is modelled.",
            "A valid evidence-reference string is not independently verified evidence.",
            "BLOCKED and PARTIAL are first-class results, never converted to green.",
            "This report is an evidence snapshot, not a production deployment signal.",
        ],
    }
    return {**payload, "world_status_sha256": digest(payload)}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="Repository root (default: current directory)")
    parser.add_argument("--graph", type=Path, help="Graph JSON; defaults to the repository's graph template")
    parser.add_argument("--out", type=Path, required=True, help="Write the unified report here")
    parser.add_argument("--strict", action="store_true", help="Exit nonzero unless the unified status is PASS")
    args = parser.parse_args()
    try:
        report = build_world_status(args.root, args.graph)
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_bytes(canonical_bytes(report) + b"\n")
        print(json.dumps(report, indent=2, ensure_ascii=False))
        return 2 if args.strict and report["status"] != "PASS" else 0
    except (OSError, ValueError, RuntimeError) as exc:
        print(json.dumps({"schema": SCHEMA, "status": "FAIL", "error": str(exc)}, indent=2), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
