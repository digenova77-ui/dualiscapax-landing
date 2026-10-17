"""Fail-closed envelope and hash-chained event ledger for DualisCapax swarms.

This module is a local protocol primitive, not an identity provider, distributed
consensus service, or authorization to execute external side effects.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import uuid
from pathlib import Path
from typing import Any, Iterable

PROTOCOL = "dualis.swarm.event.v1"
LAWS = ("TRUTH_OR_NOTHING", "NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST")
ROLES = {
    "iris", "scout", "builder", "sentinel", "verifier",
    "infrastructure", "economics_ledger", "trinity_dclm",
}
PHASES = {"discover", "propose", "challenge", "verify", "gate", "record"}
STATUSES = {"OBSERVED", "PROPOSED", "CHALLENGED", "VERIFIED", "REJECTED", "BLOCKED"}
DECISIONS = {"ACCEPT", "DECLINE", "BLOCKED_WITH_EXACT_MISSING_PRIMITIVE"}
HEX64 = re.compile(r"^[0-9a-f]{64}$")


class ProtocolError(ValueError):
    """An event violates the swarm protocol and must not be processed."""


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def validate_event(event: dict[str, Any]) -> dict[str, Any]:
    """Validate an event envelope. Returns the same object; never upgrades authority."""
    if not isinstance(event, dict):
        raise ProtocolError("EVENT_NOT_OBJECT")
    required = {
        "protocol", "event_id", "task_id", "idempotency_key", "created_at",
        "swarm", "role", "phase", "status", "issuer", "laws", "claims", "evidence",
    }
    missing = sorted(required - event.keys())
    if missing:
        raise ProtocolError("MISSING_FIELDS:" + ",".join(missing))
    if event["protocol"] != PROTOCOL:
        raise ProtocolError("UNSUPPORTED_PROTOCOL")
    try:
        uuid.UUID(str(event["event_id"]))
    except (ValueError, TypeError, AttributeError):
        raise ProtocolError("INVALID_EVENT_ID") from None
    for field in ("task_id", "idempotency_key", "swarm", "issuer"):
        if not isinstance(event[field], str) or not event[field].strip():
            raise ProtocolError("INVALID_" + field.upper())
        if len(event[field]) > 256:
            raise ProtocolError("FIELD_TOO_LONG:" + field)
    if event["role"] not in ROLES:
        raise ProtocolError("UNKNOWN_ROLE")
    if event["phase"] not in PHASES:
        raise ProtocolError("UNKNOWN_PHASE")
    if event["status"] not in STATUSES:
        raise ProtocolError("UNKNOWN_STATUS")
    if not isinstance(event["laws"], list) or set(event["laws"]) != set(LAWS) or len(event["laws"]) != len(LAWS):
        raise ProtocolError("GOVERNING_LAWS_MISMATCH")
    if not isinstance(event["claims"], dict) or not isinstance(event["evidence"], list):
        raise ProtocolError("INVALID_CLAIMS_OR_EVIDENCE")
    if any(not isinstance(item, dict) for item in event["evidence"]):
        raise ProtocolError("EVIDENCE_ITEM_NOT_OBJECT")
    if not isinstance(event["created_at"], str) or not event["created_at"].endswith("Z"):
        raise ProtocolError("TIMESTAMP_MUST_BE_UTC_Z")
    if "live_actuator" in event and event["live_actuator"] is not False:
        raise ProtocolError("LIVE_ACTUATOR_FORBIDDEN")
    if "authority" in event and event["authority"] not in ("NONE", "PROPOSED"):
        raise ProtocolError("AUTHORITY_CANNOT_BE_GRANTED_BY_EVENT")
    if event["phase"] == "gate":
        if event["role"] != "trinity_dclm":
            raise ProtocolError("GATE_PHASE_REQUIRES_TRINITY_DCLM")
        if event.get("decision") not in DECISIONS:
            raise ProtocolError("INVALID_GATE_DECISION")
        if event["decision"] == "BLOCKED_WITH_EXACT_MISSING_PRIMITIVE":
            missing_primitive = event.get("missing_primitive")
            if not isinstance(missing_primitive, str) or not missing_primitive.strip():
                raise ProtocolError("BLOCKED_REQUIRES_EXACT_MISSING_PRIMITIVE")
    elif "decision" in event:
        raise ProtocolError("ONLY_GATE_PHASE_MAY_SET_DECISION")
    return event


def event_hash(event: dict[str, Any], previous_hash: str) -> str:
    if previous_hash != "GENESIS" and not HEX64.fullmatch(previous_hash):
        raise ProtocolError("INVALID_PREVIOUS_HASH")
    material = {"previous_hash": previous_hash, "event": event}
    return hashlib.sha256(canonical_json(material)).hexdigest()


class HashChainLedger:
    """Local append-only, hash-chained JSONL ledger with idempotency-key rejection.

    A hash chain is tamper-evident only when a trusted head hash is retained
    independently. This class does not provide distributed atomicity or identity.
    """

    def __init__(self, path: str | Path):
        self.path = Path(path)

    def _read(self) -> list[dict[str, Any]]:
        if not self.path.exists():
            return []
        rows = []
        for line_no, line in enumerate(self.path.read_text(encoding="utf-8").splitlines(), 1):
            if not line.strip():
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                raise ProtocolError(f"LEDGER_INVALID_JSON_LINE:{line_no}") from None
            if not isinstance(row, dict):
                raise ProtocolError(f"LEDGER_INVALID_ROW:{line_no}")
            rows.append(row)
        return rows

    def verify(self) -> dict[str, Any]:
        rows = self._read()
        previous = "GENESIS"
        keys: set[str] = set()
        for index, row in enumerate(rows, 1):
            if set(row) != {"sequence", "previous_hash", "event_hash", "event"}:
                raise ProtocolError(f"LEDGER_ROW_SHAPE:{index}")
            if row["sequence"] != index or row["previous_hash"] != previous:
                raise ProtocolError(f"LEDGER_CHAIN_LINK:{index}")
            event = validate_event(row["event"])
            if event["idempotency_key"] in keys:
                raise ProtocolError(f"LEDGER_DUPLICATE_IDEMPOTENCY_KEY:{index}")
            calculated = event_hash(event, previous)
            if row["event_hash"] != calculated:
                raise ProtocolError(f"LEDGER_HASH_MISMATCH:{index}")
            previous = calculated
            keys.add(event["idempotency_key"])
        return {"ok": True, "events": len(rows), "head_hash": previous}

    def append(self, event: dict[str, Any]) -> dict[str, Any]:
        validate_event(event)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        # A single process/runner should own this file. Cross-process atomicity
        # requires a transactional store or external lock and is intentionally
        # not claimed here.
        state = self.verify()
        rows = self._read()
        if any(row["event"]["idempotency_key"] == event["idempotency_key"] for row in rows):
            raise ProtocolError("DUPLICATE_IDEMPOTENCY_KEY")
        previous = state["head_hash"]
        row = {
            "sequence": state["events"] + 1,
            "previous_hash": previous,
            "event_hash": event_hash(event, previous),
            "event": event,
        }
        with self.path.open("a", encoding="utf-8") as stream:
            stream.write(json.dumps(row, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n")
            stream.flush()
            os.fsync(stream.fileno())
        return {"ok": True, "sequence": row["sequence"], "event_hash": row["event_hash"]}


def make_event(*, event_id: str, task_id: str, idempotency_key: str, created_at: str,
               swarm: str, role: str, phase: str, status: str, issuer: str,
               claims: dict[str, Any] | None = None,
               evidence: Iterable[dict[str, Any]] = ()) -> dict[str, Any]:
    """Build a proposal/observation envelope. Caller supplies IDs and UTC time."""
    return validate_event({
        "protocol": PROTOCOL,
        "event_id": event_id,
        "task_id": task_id,
        "idempotency_key": idempotency_key,
        "created_at": created_at,
        "swarm": swarm,
        "role": role,
        "phase": phase,
        "status": status,
        "issuer": issuer,
        "laws": list(LAWS),
        "claims": claims or {},
        "evidence": list(evidence),
        "authority": "NONE",
        "live_actuator": False,
    })
