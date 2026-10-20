"""Diamond Standard v1 profile evaluated by the canonical Trinity gate."""
from dataclasses import dataclass
from typing import Tuple
from autonomy.trinity import GateEvidence, TRINITY_POLICY_VERSION, decide

STANDARD_ID = "DUALISCAPAX-DIAMOND-1.0"
REQUIREMENTS = (
    "authority_fail_closed", "evidence_integrity", "policy_binding",
    "execution_containment", "idempotency_and_recovery", "audit_tamper_evidence",
    "independent_verification", "scientific_validity",
)
ALLOWED_RESULTS = frozenset({"PASS", "FAIL", "UNKNOWN"})

@dataclass(frozen=True)
class RequirementEvidence:
    requirement: str
    result: str
    evidence_ref: str
    reviewer_ref: str

@dataclass(frozen=True)
class ConformanceReport:
    standard_id: str
    policy_version: str
    passed: bool
    score: int
    blockers: Tuple[str, ...]
    passed_requirements: Tuple[str, ...]

def evaluate_conformance(evidence: Tuple[RequirementEvidence, ...], *, required_policy_version: str = TRINITY_POLICY_VERSION, supplied_policy_version: str, owner_authorized: bool) -> ConformanceReport:
    """Translate the standard vocabulary to Trinity; no second decision engine."""
    pre = []
    if not isinstance(evidence, (tuple, list)):
        evidence = (); pre.append("evidence_collection_invalid")
    if len(evidence) > 1000:
        evidence = (); pre.append("evidence_collection_limit_exceeded")
    converted = []
    for i, item in enumerate(evidence):
        if not isinstance(item, RequirementEvidence): pre.append(f"evidence_record_invalid:{i}"); continue
        if not isinstance(item.result, str) or item.result not in ALLOWED_RESULTS:
            pre.append(f"result_invalid:{item.requirement}"); continue
        converted.append(GateEvidence(item.requirement, item.result == "PASS", item.evidence_ref, item.reviewer_ref))
        if item.result != "PASS": pre.append(f"requirement_not_passed:{item.requirement}:{item.result}")
    decision = decide(REQUIREMENTS, tuple(converted), required_policy_version=required_policy_version, supplied_policy_version=supplied_policy_version, owner_authorized=owner_authorized)
    mapped = []
    for blocker in decision.blockers:
        if blocker.startswith("gate_missing:"): mapped.append("requirement_missing:" + blocker.split(":", 1)[1])
        elif blocker.startswith("duplicate_gate:"): mapped.append("duplicate_requirement:" + blocker.split(":", 1)[1])
        elif blocker.startswith("unknown_gate:"): mapped.append("unknown_requirement:" + blocker.split(":", 1)[1])
        elif blocker.startswith("gate_not_passed:"): mapped.append("requirement_not_passed:" + blocker.split(":", 1)[1] + ":FAIL")
        else: mapped.append(blocker)
    blockers = tuple(sorted(set(mapped + pre)))
    failed = {b.split(":")[1] for b in pre if b.startswith("requirement_not_passed:") or b.startswith("result_invalid:")}
    passed = tuple(x for x in decision.passed_gates if x not in failed)
    score = round(100 * len(passed) / len(REQUIREMENTS))
    return ConformanceReport(STANDARD_ID, decision.policy_version, decision.allowed and not pre, score, blockers, passed)
