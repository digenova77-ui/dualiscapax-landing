"""Canonical Trinity gate semantics: deny by default; no execution or writes here."""
from dataclasses import dataclass
from typing import Iterable

TRINITY_POLICY_VERSION = "trinity-diamond-v1"

@dataclass(frozen=True)
class GateEvidence:
    gate: str
    passed: bool
    evidence_ref: str
    reviewer_ref: str

@dataclass(frozen=True)
class GateDecision:
    allowed: bool
    policy_version: str
    passed_gates: tuple[str, ...]
    blockers: tuple[str, ...]

def decide(required_gates: tuple[str, ...], evidence: Iterable[GateEvidence], *, required_policy_version: str, supplied_policy_version: str, owner_authorized: bool) -> GateDecision:
    """Single source of truth for evidence completeness and authorization semantics."""
    blockers = []
    if not isinstance(required_gates, tuple) or not required_gates or any(not isinstance(x, str) or not x.strip() for x in required_gates):
        return GateDecision(False, "", (), ("required_gates_invalid",))
    if len(set(required_gates)) != len(required_gates):
        return GateDecision(False, "", (), ("required_gates_duplicate",))
    if not isinstance(required_policy_version, str) or not required_policy_version.strip(): blockers.append("required_policy_version_missing")
    if not isinstance(supplied_policy_version, str) or supplied_policy_version != required_policy_version: blockers.append("policy_version_mismatch")
    if owner_authorized is not True: blockers.append("owner_authorization_missing")
    if not isinstance(evidence, (tuple, list)):
        evidence = (); blockers.append("evidence_collection_invalid")
    if len(evidence) > 1000:
        evidence = (); blockers.append("evidence_collection_limit_exceeded")
    records = {}
    for i, item in enumerate(evidence):
        if not isinstance(item, GateEvidence): blockers.append(f"evidence_record_invalid:{i}"); continue
        if not isinstance(item.gate, str) or item.gate not in required_gates: blockers.append(f"unknown_gate:{i}"); continue
        if item.gate in records: blockers.append(f"duplicate_gate:{item.gate}"); continue
        records[item.gate] = item
    passed = []
    for gate in required_gates:
        item = records.get(gate)
        if item is None: blockers.append(f"gate_missing:{gate}"); continue
        if item.passed is not True: blockers.append(f"gate_not_passed:{gate}"); continue
        if not isinstance(item.evidence_ref, str) or not item.evidence_ref.strip(): blockers.append(f"evidence_reference_missing:{gate}"); continue
        if not isinstance(item.reviewer_ref, str) or not item.reviewer_ref.strip(): blockers.append(f"reviewer_reference_missing:{gate}"); continue
        passed.append(gate)
    blockers = tuple(sorted(set(blockers)))
    return GateDecision(not blockers and len(passed) == len(required_gates), supplied_policy_version if isinstance(supplied_policy_version, str) else "", tuple(passed), blockers)
