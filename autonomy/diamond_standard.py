"""Diamond Standard v1: evidence-gated conformance, never a self-issued safety claim.

A standard claim passes only when every mandatory requirement has a PASS result,
a non-empty evidence reference, an independent reviewer reference, and the exact
required policy version. This evaluates supplied attestations; it does not
authenticate those references or independently execute the tests.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple

STANDARD_ID = "DUALISCAPAX-DIAMOND-1.0"
REQUIREMENTS = (
    "authority_fail_closed",
    "evidence_integrity",
    "policy_binding",
    "execution_containment",
    "idempotency_and_recovery",
    "audit_tamper_evidence",
    "independent_verification",
    "scientific_validity",
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


def evaluate_conformance(
    evidence: Tuple[RequirementEvidence, ...],
    *,
    required_policy_version: str,
    supplied_policy_version: str,
    owner_authorized: bool,
) -> ConformanceReport:
    """Evaluate conformance claims deterministically; any ambiguity blocks."""
    blockers = []
    if not isinstance(required_policy_version, str) or not required_policy_version.strip():
        blockers.append("required_policy_version_missing")
    if not isinstance(supplied_policy_version, str) or supplied_policy_version != required_policy_version:
        blockers.append("policy_version_mismatch")
    if owner_authorized is not True:
        blockers.append("owner_authorization_missing")
    if not isinstance(evidence, (tuple, list)):
        evidence = ()
        blockers.append("evidence_collection_invalid")
    if len(evidence) > 1000:
        evidence = ()
        blockers.append("evidence_collection_limit_exceeded")

    by_requirement = {}
    for index, item in enumerate(evidence):
        if not isinstance(item, RequirementEvidence):
            blockers.append(f"evidence_record_invalid:{index}")
            continue
        if not isinstance(item.requirement, str) or item.requirement not in REQUIREMENTS:
            blockers.append(f"unknown_requirement:{index}")
            continue
        if item.requirement in by_requirement:
            blockers.append(f"duplicate_requirement:{item.requirement}")
            continue
        by_requirement[item.requirement] = item

    passed = []
    for requirement in REQUIREMENTS:
        item = by_requirement.get(requirement)
        if item is None:
            blockers.append(f"requirement_missing:{requirement}")
            continue
        if not isinstance(item.result, str) or item.result not in ALLOWED_RESULTS:
            blockers.append(f"result_invalid:{requirement}")
            continue
        if item.result != "PASS":
            blockers.append(f"requirement_not_passed:{requirement}:{item.result}")
            continue
        if not isinstance(item.evidence_ref, str) or not item.evidence_ref.strip():
            blockers.append(f"evidence_reference_missing:{requirement}")
            continue
        if not isinstance(item.reviewer_ref, str) or not item.reviewer_ref.strip():
            blockers.append(f"reviewer_reference_missing:{requirement}")
            continue
        passed.append(requirement)

    blockers = tuple(sorted(set(blockers)))
    score = round(100 * len(passed) / len(REQUIREMENTS))
    return ConformanceReport(
        STANDARD_ID, supplied_policy_version if isinstance(supplied_policy_version, str) else "",
        score == 100 and not blockers, score, blockers, tuple(passed),
    )
