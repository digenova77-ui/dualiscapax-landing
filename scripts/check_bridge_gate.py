#!/usr/bin/env python3
"""Discriminating test for BRIDGE ≠ FOUNDATION.

A bridge record may exist. It must not claim foundation unless
authority_status is SEAT_PROMOTED and test_receipt is non-empty.
The proposing script is not Seat. This file never writes foundation=true.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ALLOWED_EVIDENCE = {
    "UNKNOWN",
    "HYPOTHESIS",
    "DERIVED",
    "REPRODUCED",
    "EXPERIMENTALLY_SUPPORTED",
    "INDEPENDENTLY_VERIFIED",
    "FORMALLY_ESTABLISHED",
    "REFUTED",
    "SUPERSEDED",
    "UNRESOLVED",
    "NOT_FOUND_WITHIN_SEARCH_DOMAIN",
    "INSUFFICIENT_SEARCH",
}


def check(path: Path) -> list[str]:
    holes = []
    data = json.loads(path.read_text())
    if data.get("schema") != "dualis.bridge.v1":
        holes.append(f"{path.name}: schema must be dualis.bridge.v1")
    if "foundation" not in data:
        holes.append(f"{path.name}: missing foundation flag")
    if data.get("foundation") is True:
        if data.get("authority_status") != "SEAT_PROMOTED":
            holes.append(f"{path.name}: foundation=true without SEAT_PROMOTED")
        receipt = data.get("test_receipt")
        if not receipt:
            holes.append(f"{path.name}: foundation=true without test_receipt")
    if data.get("evidence_status") not in ALLOWED_EVIDENCE:
        holes.append(f"{path.name}: evidence_status missing or unknown")
    if data.get("evidence_status") == "HYPOTHESIS" and data.get("foundation") is True:
        holes.append(f"{path.name}: hypothesis cannot be foundation")
    for key in (
        "bridge_id",
        "necessity",
        "known_state",
        "target_state",
        "proposed_mechanism",
        "discriminating_experiment",
        "authority_status",
    ):
        if not data.get(key):
            holes.append(f"{path.name}: missing {key}")
    return holes


def main() -> int:
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("data/bridges")
    files = sorted(root.glob("*.json")) if root.is_dir() else [root]
    if not files:
        print("UNRESOLVED: no bridge records to test")
        return 2
    holes = []
    for f in files:
        holes.extend(check(f))
    if holes:
        print("FAIL")
        for h in holes:
            print(" ", h)
        return 1
    print("PASS")
    print(f"  {len(files)} bridge record(s) stay off the foundation unless Seat + receipt")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
