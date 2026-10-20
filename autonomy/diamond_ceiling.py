"""Diamond Ceiling coverage profile evaluated by the canonical Trinity gate."""
from dataclasses import dataclass
from typing import Tuple
from autonomy.trinity import GateEvidence, decide

DIMENSIONS = ("authority", "evidence_integrity", "mesh_integrity", "execution_safety", "scientific_validity")

@dataclass(frozen=True)
class DimensionEvidence:
    dimension: str
    passed: bool
    evidence_ref: str
    reviewer_ref: str = ""

@dataclass(frozen=True)
class CeilingAssessment:
    score: int
    ceiling_reached: bool
    blockers: Tuple[str, ...]
    dimensions_passed: Tuple[str, ...]

def assess_diamond_ceiling(evidence: Tuple[DimensionEvidence, ...], *, required_policy_version: str, supplied_policy_version: str, owner_authorized: bool) -> CeilingAssessment:
    """Calculate descriptive coverage through Trinity; coverage never overrides blockers."""
    pre = []
    if not isinstance(evidence, (tuple, list)):
        evidence = (); pre.append("evidence_collection_invalid")
    if len(evidence) > 1000:
        evidence = (); pre.append("evidence_collection_limit_exceeded")
    converted = []
    for i, item in enumerate(evidence):
        if not isinstance(item, DimensionEvidence): pre.append(f"evidence_record_invalid:{i}"); continue
        converted.append(GateEvidence(item.dimension, item.passed, item.evidence_ref, item.reviewer_ref))
    decision = decide(DIMENSIONS, tuple(converted), required_policy_version=required_policy_version, supplied_policy_version=supplied_policy_version, owner_authorized=owner_authorized)
    mapped = []
    for blocker in decision.blockers:
        if blocker.startswith("gate_missing:"): mapped.append("dimension_missing:" + blocker.split(":", 1)[1])
        elif blocker.startswith("duplicate_gate:"): mapped.append("duplicate_dimension:" + blocker.split(":", 1)[1])
        elif blocker.startswith("unknown_gate:"): mapped.append("unknown_dimension:" + blocker.split(":", 1)[1])
        elif blocker.startswith("gate_not_passed:"): mapped.append("dimension_not_passed:" + blocker.split(":", 1)[1])
        else: mapped.append(blocker)
    blockers = tuple(sorted(set(mapped + pre)))
    passed = tuple(decision.passed_gates)
    score = round(100 * len(passed) / len(DIMENSIONS))
    return CeilingAssessment(score, score == 100 and not blockers, blockers, passed)
