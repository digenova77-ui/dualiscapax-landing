#!/usr/bin/env python3
"""Fail-closed reconciliation of Diamond Floor evidence inputs.

Read-only: validates reports and emits one status document. It never fetches
network data, writes DNS, deploys, or modifies the evidence inputs.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

SCHEMA = "dualis.diamond-floor.reconciliation.v1"
GENESIS = "0" * 64


def canonical_bytes(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False).encode("utf-8")


def digest(value: object) -> str:
    return hashlib.sha256(canonical_bytes(value)).hexdigest()


def file_digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_json(path: Path) -> dict:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path}: expected a JSON object")
    return value


def check_inventory(report: dict) -> dict:
    if report.get("schema") != "dualis.diamond-floor.inventory.v1":
        return {"status": "FAIL", "reason": "inventory-schema-mismatch"}
    claimed = report.get("content_digest")
    payload = {k: v for k, v in report.items() if k != "content_digest"}
    if not isinstance(claimed, str) or digest(payload) != claimed:
        return {"status": "FAIL", "reason": "inventory-content-digest-mismatch"}
    entries = report.get("entries")
    if not isinstance(entries, list):
        return {"status": "FAIL", "reason": "inventory-entries-invalid"}
    seen = set()
    for entry in entries:
        if not isinstance(entry, dict) or not isinstance(entry.get("path"), str) or not isinstance(entry.get("sha256"), str):
            return {"status": "FAIL", "reason": "inventory-entry-invalid"}
        if entry["path"] in seen:
            return {"status": "FAIL", "reason": "duplicate-inventory-path"}
        seen.add(entry["path"])
    return {"status": "PASS", "entries": len(entries), "content_digest": claimed}


def check_discoveries(report: dict) -> dict:
    if report.get("schema") != "dualis.earth-photo-discovery.v1":
        return {"status": "FAIL", "reason": "discovery-schema-mismatch"}
    items = report.get("items")
    if not isinstance(items, list):
        return {"status": "FAIL", "reason": "discovery-items-invalid"}
    if not items:
        return {"status": "PARTIAL", "reason": "no-discovery-items-yet", "items": 0}
    missing = []
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            return {"status": "FAIL", "reason": "discovery-item-invalid", "index": index}
        if not item.get("source_url"):
            missing.append(index)
    if missing:
        return {"status": "PARTIAL", "reason": "items-missing-source-url", "indices": missing, "items": len(items)}
    return {"status": "PASS", "items": len(items), "rights_review_required": bool(report.get("policy", {}).get("rights_review_required_before_mirroring", True))}


def check_dns(report: dict) -> dict:
    if report.get("schema") != "dualis.public-dns-audit.v1":
        return {"status": "FAIL", "reason": "dns-audit-schema-mismatch"}
    if report.get("mutations_performed") is not False:
        return {"status": "FAIL", "reason": "dns-audit-mutation-flag-not-false"}
    if not report.get("checked_at"):
        return {"status": "BLOCKED", "reason": "dns-audit-not-run"}
    records, https = report.get("records"), report.get("https")
    if not isinstance(records, list) or not isinstance(https, list):
        return {"status": "FAIL", "reason": "dns-audit-results-invalid"}
    if not records or not https:
        return {"status": "BLOCKED", "reason": "dns-audit-results-incomplete"}
    findings = []
    for index, record in enumerate(records):
        if not isinstance(record, dict):
            return {"status": "FAIL", "reason": "dns-record-entry-invalid", "index": index}
        if record.get("error") or not isinstance(record.get("status"), int) or record.get("status") != 0:
            findings.append({"kind": "dns", "index": index, "name": record.get("name"), "type": record.get("type"), "status": record.get("status"), "error": record.get("error")})
    for index, check in enumerate(https):
        if not isinstance(check, dict):
            return {"status": "FAIL", "reason": "https-entry-invalid", "index": index}
        status_code = check.get("status")
        if check.get("error") or not isinstance(status_code, int) or not (200 <= status_code < 400):
            findings.append({"kind": "https", "index": index, "url": check.get("url"), "status": status_code, "error": check.get("error")})
    if findings:
        return {"status": "PARTIAL", "reason": "public-endpoint-findings-require-review", "findings": findings, "dns_records": len(records), "https_checks": len(https)}
    return {"status": "PASS", "dns_records": len(records), "https_checks": len(https), "mutations_performed": False}


def check_ledger(path: Path) -> dict:
    if not path.is_file():
        return {"status": "BLOCKED", "reason": "ledger-missing"}
    previous = GENESIS
    count = 0
    for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError:
            return {"status": "FAIL", "reason": "ledger-invalid-json", "line": line_no, "verified_records": count}
        if not isinstance(record, dict):
            return {"status": "FAIL", "reason": "ledger-record-not-object", "line": line_no, "verified_records": count}
        claimed = record.get("record_digest")
        payload = {k: v for k, v in record.items() if k != "record_digest"}
        if record.get("previous_record_digest") != previous:
            return {"status": "FAIL", "reason": "ledger-chain-break", "line": line_no, "verified_records": count}
        if claimed != digest(payload):
            return {"status": "FAIL", "reason": "ledger-digest-mismatch", "line": line_no, "verified_records": count}
        previous = claimed
        count += 1
    if count == 0:
        return {"status": "BLOCKED", "reason": "ledger-empty", "verified_records": 0, "head_digest": previous}
    return {"status": "PASS", "verified_records": count, "head_digest": previous}


def reconcile(inventory_path: Path, discoveries_path: Path, dns_path: Path, ledger_path: Path) -> dict:
    checks = {}
    inputs = {}
    for key, path in (("inventory", inventory_path), ("discoveries", discoveries_path), ("dns_audit", dns_path)):
        if not path.is_file():
            checks[key] = {"status": "BLOCKED", "reason": "input-missing"}
            continue
        inputs[key] = file_digest(path)
        try:
            report = read_json(path)
            checker = {"inventory": check_inventory, "discoveries": check_discoveries, "dns_audit": check_dns}[key]
            checks[key] = checker(report)
        except (OSError, ValueError, json.JSONDecodeError) as exc:
            checks[key] = {"status": "FAIL", "reason": "input-invalid", "detail": str(exc)}
    if ledger_path.is_file():
        inputs["ledger"] = file_digest(ledger_path)
    checks["ledger"] = check_ledger(ledger_path)
    statuses = {v["status"] for v in checks.values()}
    if "FAIL" in statuses:
        status = "FAIL"
    elif "BLOCKED" in statuses:
        status = "BLOCKED"
    elif "PARTIAL" in statuses:
        status = "PARTIAL"
    else:
        status = "PASS"
    core = {
        "schema": SCHEMA,
        "status": status,
        "checks": checks,
        "input_sha256": inputs,
        "policy": {
            "fail_closed": True,
            "candidate_is_not_accepted_state": True,
            "production_mutations_performed": False,
            "dns_mutations_performed": False,
            "automated_promotion": False,
        },
    }
    return {**core, "reconciliation_digest": digest(core), "checked_at_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat()}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inventory", type=Path, required=True)
    parser.add_argument("--discoveries", type=Path, required=True)
    parser.add_argument("--dns-audit", type=Path, required=True)
    parser.add_argument("--ledger", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    try:
        report = reconcile(args.inventory, args.discoveries, args.dns_audit, args.ledger)
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_bytes(canonical_bytes(report) + b"\\n")
        print(json.dumps(report, indent=2, ensure_ascii=False))
        return 0 if report["status"] in {"PASS", "PARTIAL"} else 2
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "FAIL", "error": str(exc)}, indent=2), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
