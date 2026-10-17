#!/usr/bin/env python3
"""Build a read-only, fail-closed evidence map from current repository snapshots.

This map is a candidate index, not an accepted derivative graph. It records
byte hashes and observed checks while keeping every node/edge unverified until
an independent evidence resolver exists. It performs no network or mutations.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
SCHEMA = "dualis.diamond-floor.evidence-map.v1"
LAYERS = ["ceiling", "mesh", "floor", "seed", "taproot", "bedrock"]
GENESIS = "0" * 64


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"),
        ensure_ascii=False, allow_nan=False
    ).encode("utf-8")


def digest_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def digest(value: Any) -> str:
    return digest_bytes(canonical_bytes(value))


def read_source(root: Path, relative: str) -> tuple[bytes, dict]:
    path = root / relative
    raw = path.read_bytes()
    parsed = json.loads(raw.decode("utf-8"))
    if not isinstance(parsed, dict):
        raise ValueError(f"{relative}: expected a JSON object")
    return raw, parsed


def verify_ledger(raw: bytes) -> dict:
    previous = GENESIS
    count = 0
    for line_number, line in enumerate(raw.decode("utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError:
            return {"status": "FAIL", "reason": "invalid-json", "line": line_number, "verified_records": count}
        if not isinstance(record, dict):
            return {"status": "FAIL", "reason": "record-not-object", "line": line_number, "verified_records": count}
        claimed = record.get("record_digest")
        payload = {key: value for key, value in record.items() if key != "record_digest"}
        if record.get("previous_record_digest") != previous:
            return {"status": "FAIL", "reason": "chain-break", "line": line_number, "verified_records": count}
        if not isinstance(claimed, str) or digest(payload) != claimed:
            return {"status": "FAIL", "reason": "record-digest-mismatch", "line": line_number, "verified_records": count}
        previous = claimed
        count += 1
    if count == 0:
        return {"status": "BLOCKED", "reason": "ledger-empty", "verified_records": 0, "head_digest": GENESIS}
    return {"status": "PASS", "verified_records": count, "head_digest": previous}


def check_source_report(discoveries: dict, dns: dict, ledger_status: dict) -> dict:
    discovery_items = discoveries.get("items")
    if discoveries.get("schema") != "dualis.earth-photo-discovery.v1" or not isinstance(discovery_items, list):
        discovery_check = {"status": "FAIL", "reason": "discovery-schema-or-items-invalid"}
    elif not discovery_items:
        discovery_check = {"status": "PARTIAL", "reason": "no-discovery-items", "items": 0}
    else:
        missing_urls = sum(not isinstance(item, dict) or not item.get("source_url") for item in discovery_items)
        discovery_check = {
            "status": "PASS" if missing_urls == 0 else "PARTIAL",
            "items": len(discovery_items),
            "items_missing_source_url": missing_urls,
            "rights_review_required": bool(discoveries.get("policy", {}).get("rights_review_required_before_mirroring", True)),
        }

    if dns.get("schema") != "dualis.public-dns-audit.v1" or dns.get("mutations_performed") is not False:
        dns_check = {"status": "FAIL", "reason": "dns-schema-or-mutation-policy-invalid"}
    elif not dns.get("checked_at") or not isinstance(dns.get("records"), list) or not isinstance(dns.get("https"), list):
        dns_check = {"status": "BLOCKED", "reason": "dns-audit-incomplete"}
    else:
        findings = []
        for record in dns["records"]:
            if not isinstance(record, dict) or record.get("error") or record.get("status") != 0:
                findings.append({"kind": "dns", "name": record.get("name") if isinstance(record, dict) else None,
                                 "type": record.get("type") if isinstance(record, dict) else None,
                                 "status": record.get("status") if isinstance(record, dict) else None})
        for check in dns["https"]:
            if not isinstance(check, dict) or check.get("error") or not isinstance(check.get("status"), int) or not 200 <= check["status"] < 400:
                findings.append({"kind": "https", "url": check.get("url") if isinstance(check, dict) else None,
                                 "status": check.get("status") if isinstance(check, dict) else None})
        dns_check = {"status": "PARTIAL" if findings else "PASS", "findings": findings,
                     "dns_records": len(dns["records"]), "https_checks": len(dns["https"]),
                     "checked_at": dns.get("checked_at"), "scope": dns.get("scope")}
    return {"discoveries": discovery_check, "public_dns_https": dns_check, "provenance_ledger": ledger_status}


def node(node_id: str, layer: str, domain: str, content: dict, source_refs: list[dict]) -> dict:
    result = {
        "id": node_id,
        "layer": layer,
        "domain": domain,
        "content": content,
        "source_refs": source_refs,
        "verified": False,
    }
    result["content_sha256"] = digest(result)
    return result


def build_observations(discoveries: dict, dns: dict, source_refs: list[dict]) -> list[dict]:
    """Create individual hash-bound observations without upgrading them to verified facts."""
    by_path = {item["path"]: item for item in source_refs}
    observed_at = dns.get("checked_at")
    scope = dns.get("scope", "scope-not-recorded")
    observations = []

    def add(kind: str, source_path: str, index: int | str, payload: dict, status: str, timestamp: str | None, observation_scope: str) -> None:
        record = {
            "id": f"{kind}-{index}",
            "kind": kind,
            "source_ref": by_path[source_path],
            "observed_at": timestamp,
            "scope": observation_scope,
            "status": status,
            "payload": payload,
            "verified": False,
        }
        record["observation_sha256"] = digest(record)
        observations.append(record)

    dns_path = "research/photo-archive/public-dns-audit.json"
    discovery_path = "research/photo-archive/discoveries.json"
    for i, record in enumerate(dns.get("records", [])):
        if not isinstance(record, dict):
            add("dns", dns_path, i, {"raw_type": type(record).__name__}, "MALFORMED", observed_at, scope)
            continue
        status = "OBSERVATION" if record.get("status") == 0 and not record.get("error") else "FINDING"
        add("dns", dns_path, i, record, status, observed_at, scope)
    for i, check in enumerate(dns.get("https", [])):
        if not isinstance(check, dict):
            add("https", dns_path, i, {"raw_type": type(check).__name__}, "MALFORMED", observed_at, scope)
            continue
        code = check.get("status")
        ok = isinstance(code, int) and 200 <= code < 400 and not check.get("error")
        add("https", dns_path, i, check, "OBSERVATION" if ok else "FINDING", observed_at, scope)
    discovery_timestamp = discoveries.get("updated_at")
    discovery_scope = "discovery metadata snapshot; rights and source claims are not independently verified"
    for i, item in enumerate(discoveries.get("items", [])):
        payload = item if isinstance(item, dict) else {"raw_type": type(item).__name__}
        has_source = isinstance(item, dict) and bool(item.get("source_url"))
        add("discovery", discovery_path, i, payload, "NEEDS_REVIEW" if has_source else "FINDING",
            discovery_timestamp, discovery_scope)
    return observations


def build_evidence_map(root: Path) -> dict:
    root = root.resolve()
    discoveries_path = "research/photo-archive/discoveries.json"
    dns_path = "research/photo-archive/public-dns-audit.json"
    ledger_path = "research/photo-archive/provenance/ledger.jsonl"
    discoveries_raw, discoveries = read_source(root, discoveries_path)
    dns_raw, dns = read_source(root, dns_path)
    ledger_raw = (root / ledger_path).read_bytes()
    ledger_status = verify_ledger(ledger_raw)
    source_refs = [
        {"path": discoveries_path, "sha256": digest_bytes(discoveries_raw)},
        {"path": dns_path, "sha256": digest_bytes(dns_raw)},
        {"path": ledger_path, "sha256": digest_bytes(ledger_raw)},
    ]
    checks = check_source_report(discoveries, dns, ledger_status)
    all_source_digest = digest(source_refs)
    observations = build_observations(discoveries, dns, source_refs)

    nodes = [
        node("ceiling-current-view", "ceiling", "governance",
             {"status": "BLOCKED", "reason": "candidate-only-no-independent-evidence-resolver",
              "checks": checks, "source_set_sha256": all_source_digest}, source_refs),
        node("mesh-source-relations", "mesh", "software",
             {"sources": [ref["path"] for ref in source_refs],
              "relations": [{"from": "ceiling-current-view", "to": "mesh-source-relations", "relation": "indexes-evidence"},
                            {"from": "mesh-source-relations", "to": "floor-checks", "relation": "summarizes-checks"}]},
             source_refs),
        node("floor-checks", "floor", "science", {"checks": checks}, source_refs),
        node("seed-observations", "seed", "infrastructure",
             {"dns_observed_at": dns.get("checked_at"),
              "http_findings": checks["public_dns_https"].get("findings", []),
              "discovery_count": len(discoveries.get("items", [])) if isinstance(discoveries.get("items"), list) else None},
             [{"path": dns_path, "sha256": digest_bytes(dns_raw)},
              {"path": discoveries_path, "sha256": digest_bytes(discoveries_raw)}]),
        node("taproot-provenance", "taproot", "governance",
             {"ledger_integrity": ledger_status, "ledger_bytes_sha256": digest_bytes(ledger_raw)},
             [{"path": ledger_path, "sha256": digest_bytes(ledger_raw)}]),
        node("bedrock-invariants", "bedrock", "governance",
             {"canonicalization": "PASS", "provenance": "BLOCKED",
              "no_force": "BLOCKED", "host_safe": "BLOCKED", "zero_residue": "BLOCKED",
              "note": "PASS for canonicalization describes this map's serialization only; other invariants lack independent evidence."},
             source_refs),
    ]
    edges = [
        {"from": upper["id"], "to": lower["id"], "relation": "candidate-derivation", "verified": False}
        for upper, lower in zip(nodes, nodes[1:])
    ]
    payload = {
        "schema": SCHEMA,
        "status": "BLOCKED",
        "description": "Evidence map candidate. Not an accepted derivative graph; nodes and edges remain unverified.",
        "generated_from": source_refs,
        "observed_at": dns.get("checked_at"),
        "scope": "Repository snapshots only; DNS and HTTPS values are observations from the saved public audit, not live checks by this builder.",
        "nodes": nodes,
        "observations": observations,
        "edges": edges,
        "rings": {
            "authority": {"status": "BLOCKED", "evidence_refs": [ledger_path]},
            "measurement": {"status": "PARTIAL" if checks["public_dns_https"]["status"] in ("PASS", "PARTIAL") else "BLOCKED",
                            "evidence_refs": [dns_path]},
            "execution_evidence": {"status": "BLOCKED", "evidence_refs": []},
        },
        "invariants": {
            "canonicalization": {"status": "PASS", "evidence_ref": "builder:canonical-json-sha256"},
            "provenance": {"status": "BLOCKED", "evidence_ref": ""},
            "no_force": {"status": "BLOCKED", "evidence_ref": ""},
            "host_safe": {"status": "BLOCKED", "evidence_ref": ""},
            "zero_residue": {"status": "BLOCKED", "evidence_ref": ""},
        },
        "policy": {
            "fail_closed": True,
            "independent_evidence_verification": False,
            "automatic_promotion": False,
            "network_access": False,
            "production_mutations": False,
            "dns_mutations": False,
            "server_or_database_mutations": False,
        },
    }
    return {**payload, "map_sha256": digest(payload)}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="Repository root")
    parser.add_argument("--out", type=Path, required=True, help="Output JSON path")
    args = parser.parse_args()
    try:
        result = build_evidence_map(args.root)
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_bytes(canonical_bytes(result) + b"\n")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 0
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
        print(json.dumps({"schema": SCHEMA, "status": "FAIL", "error": str(exc)}, indent=2), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
