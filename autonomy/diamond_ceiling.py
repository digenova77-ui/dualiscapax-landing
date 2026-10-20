"""Diamond Ceiling: a hard-gated integrity assessment, not a safety certificate.

Scores summarize evidence coverage. They never override a failed gate. This
module evaluates declared evidence only; it does not authenticate evidence,
prove OS isolation, or independently validate scientific claims.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple


DIMENSIONS = (
    "authority",
    "evidence_integrity",
    "mesh_integrity",
    "execution_safety",
    "scientific_validity",
)


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


def assess_diamond_ceiling(
    evidence: Tuple[DimensionEvidence, ...],
    *,
    required_policy_version: str,
    supplied_policy_version: str,
    owner_authorized: bool,
) -> CeilingAssessment:
    """Return a deterministic coverage score plus non-bypassable hard gates."""
    blockers = []
    if not required_policy_version.strip():
        blockers.append("required_policy_version_missing")
    if supplied_policy_version != required_policy_version:
        blockers.append("policy_version_mismatch")
    if owner_authorized is not True:
        blockers.append("owner_authorization_missing")

    by_dimension = {}
    for item in evidence:
        if item.dimension not in DIMENSIONS:
            blockers.append(f"unknown_dimension:{item.dimension}")
            continue
        if item.dimension in by_dimension:
            blockers.append(f"duplicate_dimension:{item.dimension}")
            continue
        by_dimension[item.dimension] = item

    passed = []
    for dimension in DIMENSIONS:
        item = by_dimension.get(dimension)
        if item is None:
            blockers.append(f"dimension_missing:{dimension}")
            continue
        if item.passed is not True:
            blockers.append(f"dimension_not_passed:{dimension}")
            continue
        if not isinstance(item.evidence_ref, str) or not item.evidence_ref.strip():
            blockers.append(f"evidence_reference_missing:{dimension}")
            continue
        if not isinstance(item.reviewer_ref, str) or not item.reviewer_ref.strip():
            blockers.append(f"reviewer_reference_missing:{dimension}")
            continue
        passed.append(dimension)

    # Coverage is descriptive only: 100% coverage cannot bypass any blocker.
    score = round(100 * len(passed) / len(DIMENSIONS))
    blockers = sorted(set(blockers))
    reached = score == 100 and not blockers
    return CeilingAssessment(score, reached, tuple(blockers), tuple(passed))
