"""Autonomous swarm work lifecycle: initiative is open; truth is gated by evidence.

This module does not authenticate identity labels or grant authority for side effects.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from swarm_protocol import ProtocolError, ROLES


@dataclass
class WorkItem:
    task_id: str
    originator_id: str
    originator_role: str
    scope: str
    status: str = "PROPOSED"
    claims: list[dict[str, Any]] = field(default_factory=list)


def initiate_work(*, task_id: str, worker_id: str, worker_role: str, scope: str) -> WorkItem:
    """Any registered worker can start bounded work without a prior assignment."""
    if not isinstance(task_id, str) or not task_id.strip():
        raise ProtocolError("TASK_ID_REQUIRED")
    if not isinstance(worker_id, str) or not worker_id.strip():
        raise ProtocolError("WORKER_ID_REQUIRED")
    if worker_role not in ROLES:
        raise ProtocolError("UNKNOWN_ROLE")
    if not isinstance(scope, str) or not scope.strip() or len(scope) > 2000:
        raise ProtocolError("INITIATIVE_SCOPE_REQUIRED")
    return WorkItem(task_id, worker_id, worker_role, scope.strip())


def record_finding(item: WorkItem, *, author_id: str, statement: str,
                   evidence_refs: list[str]) -> dict[str, Any]:
    """Record a claim as UNVERIFIED, regardless of the author's confidence."""
    if item.status in {"REJECTED", "CLOSED"}:
        raise ProtocolError("WORK_ITEM_NOT_OPEN")
    if not isinstance(author_id, str) or not author_id.strip():
        raise ProtocolError("CLAIM_AUTHOR_REQUIRED")
    if not isinstance(statement, str) or not statement.strip():
        raise ProtocolError("CLAIM_STATEMENT_REQUIRED")
    if not isinstance(evidence_refs, list) or any(not isinstance(ref, str) or not ref.strip() for ref in evidence_refs):
        raise ProtocolError("INVALID_EVIDENCE_REFERENCES")
    claim = {"claim_id": f"{item.task_id}:claim:{len(item.claims)+1}",
             "author_id": author_id, "statement": statement.strip(),
             "evidence_refs": list(evidence_refs), "truth_status": "UNVERIFIED"}
    item.claims.append(claim)
    item.status = "AWAITING_VALIDATION"
    return claim


def validate_finding(item: WorkItem, *, claim_id: str, validator_id: str,
                     verdict: str, evidence_refs: list[str]) -> dict[str, Any]:
    """Require a distinct validator, passing verdict, and nonempty evidence refs.

    This local check does not prove the validator ID is authentic. Production must
    bind it to an authenticated principal and independently inspect the evidence.
    """
    claim = next((c for c in item.claims if c["claim_id"] == claim_id), None)
    if claim is None:
        raise ProtocolError("CLAIM_NOT_FOUND")
    if not isinstance(validator_id, str) or not validator_id.strip():
        raise ProtocolError("VALIDATOR_ID_REQUIRED")
    if validator_id == claim["author_id"]:
        raise ProtocolError("SELF_VALIDATION_FORBIDDEN")
    if verdict not in {"PASS", "FAIL"}:
        raise ProtocolError("INVALID_VERDICT")
    if not isinstance(evidence_refs, list) or not evidence_refs or any(not isinstance(ref, str) or not ref.strip() for ref in evidence_refs):
        raise ProtocolError("VERIFICATION_EVIDENCE_REQUIRED")
    claim["validation"] = {"validator_id": validator_id, "verdict": verdict,
                           "evidence_refs": list(evidence_refs)}
    claim["truth_status"] = "VERIFIED" if verdict == "PASS" else "REJECTED"
    item.status = "VALIDATED" if all(c["truth_status"] in {"VERIFIED", "REJECTED"} for c in item.claims) else "AWAITING_VALIDATION"
    return claim
