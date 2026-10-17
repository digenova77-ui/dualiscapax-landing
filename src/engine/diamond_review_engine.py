"""Bidirectional Diamond review engine for evidence-bounded claims.

The engine checks supplied records and declared coverage. It does not discover
all reality, connect to sensors, infer scientific truth from labels, or actuate.
"""
from __future__ import annotations

import hashlib
import json
from typing import Any, Mapping, Sequence

from swarm_protocol import ProtocolError, canonical_json

RINGS = ("philosophy", "physics", "law")
RING_VERDICTS = {"SUPPORT", "CHALLENGE", "NOT_APPLICABLE_WITH_REASON", "UNRESOLVED"}
EVIDENCE_STATES = {
    "OBSERVED", "INFERRED", "HYPOTHESIS",
    "INDEPENDENTLY_VALIDATED", "REJECTED", "UNRESOLVED",
}
REQUIRED_OBSERVATION_FIELDS = {
    "record_id", "axis_id", "channel", "source", "observed_at",
    "value_or_payload", "units_or_encoding", "method",
    "calibration_or_method_version", "uncertainty", "detection_limits",
    "evidence_state",
}
REQUIRED_COVERAGE_FIELDS = {
    "domain_id", "observable", "status", "method_or_reason", "evidence_refs"
}
COVERAGE_STATUSES = {"MEASURED", "PARTIALLY_MEASURED", "NOT_MEASURED", "NOT_APPLICABLE", "UNKNOWN"}
MAX_RECORDS = 10000


def _nonempty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_observation(record: Any) -> dict[str, Any]:
    """Validate provenance and uncertainty fields without upgrading evidence."""
    if not isinstance(record, dict):
        raise ProtocolError("OBSERVATION_MUST_BE_OBJECT")
    missing = sorted(REQUIRED_OBSERVATION_FIELDS - record.keys())
    if missing:
        raise ProtocolError("OBSERVATION_MISSING_FIELDS:" + ",".join(missing))
    for field in ("record_id", "axis_id", "channel", "source", "observed_at", "method", "calibration_or_method_version"):
        if not _nonempty_string(record[field]):
            raise ProtocolError("OBSERVATION_INVALID_FIELD:" + field)
    if record["evidence_state"] not in EVIDENCE_STATES:
        raise ProtocolError("OBSERVATION_EVIDENCE_STATE_INVALID")
    if record["uncertainty"] is None or record["detection_limits"] is None:
        raise ProtocolError("OBSERVATION_UNCERTAINTY_AND_DETECTION_LIMITS_REQUIRED")
    if record["evidence_state"] == "INDEPENDENTLY_VALIDATED":
        refs = record.get("validation_refs")
        if not isinstance(refs, list) or not refs or any(not _nonempty_string(ref) for ref in refs):
            raise ProtocolError("OBSERVATION_VALIDATION_REFS_REQUIRED")
    if record.get("signal_class") == "SIMULATION_OUTPUT" and record["evidence_state"] == "OBSERVED":
        raise ProtocolError("SIMULATION_CANNOT_BE_LABELED_DIRECT_OBSERVATION")
    return record


def validate_coverage(entry: Any) -> dict[str, Any]:
    """Validate one explicit coverage item; missing coverage must be stated."""
    if not isinstance(entry, dict):
        raise ProtocolError("COVERAGE_ENTRY_MUST_BE_OBJECT")
    missing = sorted(REQUIRED_COVERAGE_FIELDS - entry.keys())
    if missing:
        raise ProtocolError("COVERAGE_MISSING_FIELDS:" + ",".join(missing))
    for field in ("domain_id", "observable", "method_or_reason"):
        if not _nonempty_string(entry[field]):
            raise ProtocolError("COVERAGE_INVALID_FIELD:" + field)
    if entry["status"] not in COVERAGE_STATUSES:
        raise ProtocolError("COVERAGE_STATUS_INVALID")
    if not isinstance(entry["evidence_refs"], list) or any(not _nonempty_string(x) for x in entry["evidence_refs"]):
        raise ProtocolError("COVERAGE_EVIDENCE_REFS_INVALID")
    if entry["status"] == "MEASURED" and not entry["evidence_refs"]:
        raise ProtocolError("MEASURED_COVERAGE_REQUIRES_EVIDENCE")
    if entry["status"] in {"NOT_MEASURED", "UNKNOWN"} and not entry["method_or_reason"].strip():
        raise ProtocolError("UNMEASURED_COVERAGE_REQUIRES_REASON")
    return entry


def run_diamond_review(
    *,
    claim: str,
    observations: Sequence[Mapping[str, Any]],
    coverage: Sequence[Mapping[str, Any]],
    ring_reviews: Mapping[str, Mapping[str, Any]],
    independent_validation: Mapping[str, Any] | None,
    pass_number: int = 1,
    prior_review_hash: str | None = None,
) -> dict[str, Any]:
    """Run one deterministic review pass in both directions and report hard limits.

    The result is a review record, not a declaration that the claim is true.
    """
    if not _nonempty_string(claim):
        raise ProtocolError("CLAIM_REQUIRED")
    if not isinstance(pass_number, int) or isinstance(pass_number, bool) or pass_number < 1:
        raise ProtocolError("PASS_NUMBER_MUST_BE_POSITIVE_INTEGER")
    if not isinstance(observations, (list, tuple)) or not isinstance(coverage, (list, tuple)):
        raise ProtocolError("OBSERVATIONS_AND_COVERAGE_MUST_BE_SEQUENCES")
    if len(observations) > MAX_RECORDS or len(coverage) > MAX_RECORDS:
        raise ProtocolError("REVIEW_INPUT_LIMIT_EXCEEDED")
    if not isinstance(ring_reviews, Mapping):
        raise ProtocolError("RING_REVIEWS_REQUIRED")

    valid_observations = [validate_observation(dict(item)) for item in observations]
    ids = [item["record_id"] for item in valid_observations]
    if len(ids) != len(set(ids)):
        raise ProtocolError("DUPLICATE_OBSERVATION_RECORD_ID")

    valid_coverage = [validate_coverage(dict(item)) for item in coverage]
    coverage_ids = [item["domain_id"] + "::" + item["observable"] for item in valid_coverage]
    if len(coverage_ids) != len(set(coverage_ids)):
        raise ProtocolError("DUPLICATE_COVERAGE_ITEM")

    ring_results = {}
    missing_primitives = []
    for ring in RINGS:
        review = ring_reviews.get(ring)
        if not isinstance(review, Mapping):
            ring_results[ring] = {"verdict": "UNRESOLVED", "reason": "RING_REVIEW_MISSING"}
            missing_primitives.append("ring_review:" + ring)
            continue
        verdict = review.get("verdict")
        reason = review.get("reason")
        if verdict not in RING_VERDICTS:
            raise ProtocolError("RING_VERDICT_INVALID:" + ring)
        if verdict in {"CHALLENGE", "UNRESOLVED", "NOT_APPLICABLE_WITH_REASON"} and not _nonempty_string(reason):
            raise ProtocolError("RING_REASON_REQUIRED:" + ring)
        ring_results[ring] = {"verdict": verdict, "reason": reason}
        if verdict == "UNRESOLVED":
            missing_primitives.append("ring_resolution:" + ring)
        elif verdict == "CHALLENGE":
            missing_primitives.append("ring_challenge_resolution:" + ring)

    if independent_validation is None:
        validation = {"verdict": "UNRESOLVED", "reason": "INDEPENDENT_VALIDATION_NOT_SUPPLIED"}
        missing_primitives.append("independent_validation_record")
    else:
        if not isinstance(independent_validation, Mapping):
            raise ProtocolError("INDEPENDENT_VALIDATION_MUST_BE_OBJECT")
        verdict = independent_validation.get("verdict")
        if verdict not in {"PASS", "FAIL", "UNRESOLVED"}:
            raise ProtocolError("INDEPENDENT_VALIDATION_VERDICT_INVALID")
        refs = independent_validation.get("evidence_refs", [])
        if not isinstance(refs, list) or any(not _nonempty_string(ref) for ref in refs):
            raise ProtocolError("INDEPENDENT_VALIDATION_REFS_INVALID")
        if verdict == "PASS" and not refs:
            raise ProtocolError("PASS_REQUIRES_INDEPENDENT_VALIDATION_EVIDENCE")
        validation = {"verdict": verdict, "evidence_refs": refs, "reason": independent_validation.get("reason")}
        if verdict != "PASS":
            missing_primitives.append("independent_validation:" + verdict.lower())

    coverage_counts = {status: 0 for status in sorted(COVERAGE_STATUSES)}
    for item in valid_coverage:
        coverage_counts[item["status"]] += 1
        if item["status"] in {"NOT_MEASURED", "UNKNOWN"}:
            missing_primitives.append("coverage:" + item["domain_id"] + "::" + item["observable"])
    if not valid_coverage:
        missing_primitives.append("coverage_inventory")

    # The engine only calls out missing/unknown coverage that was declared.
    # It never infers that the supplied inventory exhausts the universe.
    has_challenge = any(item["verdict"] == "CHALLENGE" for item in ring_results.values())
    has_unresolved_ring = any(item["verdict"] == "UNRESOLVED" for item in ring_results.values())
    all_support = all(item["verdict"] in {"SUPPORT", "NOT_APPLICABLE_WITH_REASON"} for item in ring_results.values())
    if validation["verdict"] == "FAIL" or has_challenge:
        disposition = "DECLINE"
    elif missing_primitives or has_unresolved_ring or not all_support or validation["verdict"] != "PASS":
        disposition = "BLOCKED_WITH_EXACT_MISSING_PRIMITIVE"
    else:
        disposition = "REVIEW_COMPLETE_WITHIN_DECLARED_SCOPE"

    review = {
        "protocol": "dualis.diamond.review.v1",
        "status": "PROPOSED",
        "claim": claim,
        "pass_number": pass_number,
        "prior_review_hash": prior_review_hash,
        "directions": {
            "ceiling_to_floor": "derive testable expectations and required observables from declared claim",
            "floor_to_ceiling": "challenge claim against supplied observations, coverage, uncertainty, and independent validation",
        },
        "rings": ring_results,
        "observation_count": len(valid_observations),
        "observation_ids": ids,
        "coverage_counts": coverage_counts,
        "coverage_inventory_is_exhaustive": False,
        "independent_validation": validation,
        "disposition": disposition,
        "missing_primitives": sorted(set(missing_primitives)),
        "limits": [
            "No universal claim of measuring everything.",
            "Only caller-supplied observations and declared coverage were reviewed.",
            "No live sensor access, credential issuance, or actuator authority.",
            "Repeated passes do not upgrade evidence without new data or independent validation.",
        ],
        "authority": "NONE",
        "live_actuator": False,
    }
    review["review_hash"] = hashlib.sha256(canonical_json(review)).hexdigest()
    return review
