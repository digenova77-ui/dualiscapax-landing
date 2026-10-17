"""Canonical one-seed, three-ring, dual-pipeline architecture primitives.

The seed defines roles and invariants; it does not grant identity, permissions,
execution authority, distributed consensus, or production access.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Mapping

from swarm_protocol import ProtocolError

ROOT = Path(__file__).resolve().parents[2]
SEED_PATH = ROOT / "config" / "dualis.seed.v1.json"
RING_KEYS = ("philosophy", "physics", "law")
RING_VERDICTS = {"SUPPORT", "CHALLENGE", "NOT_APPLICABLE_WITH_REASON", "UNRESOLVED"}
CORRELATION_TYPES = {
    "PHYSICAL_COUPLING",
    "MATHEMATICAL_CORRESPONDENCE",
    "EMPIRICAL_HYPOTHESIS",
    "PHILOSOPHICAL_CORRESPONDENCE",
}
GATE_DECISIONS = {
    "ACCEPT",
    "DECLINE",
    "BLOCKED_WITH_EXACT_MISSING_PRIMITIVE",
    "UNRESOLVED",
}


def load_seed(path: str | Path = SEED_PATH) -> dict[str, Any]:
    """Load and validate the canonical seed document."""
    try:
        value = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ProtocolError("SEED_UNREADABLE_OR_INVALID_JSON") from exc
    return validate_seed(value)


def validate_seed(seed: Any) -> dict[str, Any]:
    """Reject incomplete or altered seed structure instead of repairing it."""
    if not isinstance(seed, dict):
        raise ProtocolError("SEED_MUST_BE_OBJECT")
    if seed.get("protocol") != "dualis.seed.v1" or seed.get("seed_id") != "dualis-capax-one-seed":
        raise ProtocolError("SEED_IDENTITY_MISMATCH")
    if seed.get("version") != 1:
        raise ProtocolError("UNSUPPORTED_SEED_VERSION")
    if seed.get("event_protocol") != "dualis.swarm.event.v1":
        raise ProtocolError("SEED_EVENT_PROTOCOL_MISMATCH")
    expected_roles = {
        "iris", "scout", "builder", "sentinel", "verifier",
        "infrastructure", "economics_ledger", "trinity_dclm",
    }
    if not isinstance(seed.get("roles"), list) or set(seed["roles"]) != expected_roles:
        raise ProtocolError("SEED_ROLE_REGISTRY_MISMATCH")
    if seed.get("status") not in {"PROPOSED", "ACTIVE"}:
        raise ProtocolError("INVALID_SEED_STATUS")
    if seed.get("governing_laws") != [
        "TRUTH_OR_NOTHING", "NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST"
    ]:
        raise ProtocolError("SEED_GOVERNING_LAWS_MISMATCH")
    rings = seed.get("rings")
    if not isinstance(rings, list) or len(rings) != 3:
        raise ProtocolError("SEED_REQUIRES_EXACTLY_THREE_RINGS")
    actual = {ring.get("key"): ring for ring in rings if isinstance(ring, dict)}
    if set(actual) != set(RING_KEYS):
        raise ProtocolError("SEED_RING_IDENTITIES_MISMATCH")
    expected_ids = {"philosophy": "A", "physics": "B", "law": "C"}
    for key, ring in actual.items():
        if ring.get("id") != expected_ids[key] or not isinstance(ring.get("remit"), list):
            raise ProtocolError("SEED_RING_DEFINITION_INVALID:" + key)
        if set(ring.get("verdicts", [])) != RING_VERDICTS:
            raise ProtocolError("SEED_RING_VERDICTS_MISMATCH:" + key)
    pipelines = seed.get("pipelines")
    if not isinstance(pipelines, list) or {p.get("key") for p in pipelines if isinstance(p, dict)} != {
        "discovery_execution", "independent_validation"
    }:
        raise ProtocolError("SEED_REQUIRES_BOTH_PIPELINES")
    if set(seed.get("correlation_types", [])) != CORRELATION_TYPES:
        raise ProtocolError("SEED_CORRELATION_TYPES_MISMATCH")
    invariants = seed.get("invariants")
    if not isinstance(invariants, dict):
        raise ProtocolError("SEED_INVARIANTS_MISSING")
    required_true = {
        "rings_are_distinct",
        "all_required_rings_review_same_claim",
        "no_majority_vote_truth",
        "independent_validation_required",
        "gate_does_not_grant_execution_authority",
        "correlations_must_be_typed",
        "unknowns_and_disagreements_are_preserved",
    }
    if any(invariants.get(key) is not True for key in required_true):
        raise ProtocolError("SEED_REQUIRED_INVARIANT_DISABLED")
    if invariants.get("live_actuators_enabled_by_seed") is not False:
        raise ProtocolError("SEED_MUST_NOT_ENABLE_LIVE_ACTUATORS")
    return seed


def validate_correlation(correlation: Any) -> dict[str, Any]:
    """Validate a typed cross-domain relationship without upgrading its evidence."""
    if not isinstance(correlation, dict):
        raise ProtocolError("CORRELATION_MUST_BE_OBJECT")
    required = {"correlation_id", "source_domain", "target_domain", "type", "claim", "evidence_refs"}
    missing = sorted(required - correlation.keys())
    if missing:
        raise ProtocolError("CORRELATION_MISSING_FIELDS:" + ",".join(missing))
    for field in ("correlation_id", "source_domain", "target_domain", "claim"):
        if not isinstance(correlation[field], str) or not correlation[field].strip():
            raise ProtocolError("CORRELATION_INVALID_FIELD:" + field)
    if correlation["source_domain"] == correlation["target_domain"]:
        raise ProtocolError("CORRELATION_DOMAINS_MUST_DIFFER")
    if correlation["type"] not in CORRELATION_TYPES:
        raise ProtocolError("CORRELATION_TYPE_UNRECOGNIZED")
    refs = correlation["evidence_refs"]
    if not isinstance(refs, list) or any(not isinstance(ref, str) or not ref.strip() for ref in refs):
        raise ProtocolError("CORRELATION_EVIDENCE_REFS_INVALID")
    status = correlation.get("status", "PROPOSED")
    if status not in {"PROPOSED", "SUPPORTED", "REJECTED", "UNRESOLVED"}:
        raise ProtocolError("CORRELATION_STATUS_INVALID")
    # A status label is metadata, not proof. Validation evidence is still required
    # by the independent pipeline before a proposed link can be treated as supported.
    if status == "SUPPORTED" and not correlation.get("validation_refs"):
        raise ProtocolError("SUPPORTED_CORRELATION_REQUIRES_VALIDATION_REFS")
    return correlation


def evaluate_gate(
    *,
    ring_reviews: Mapping[str, Mapping[str, Any]],
    independent_validation: Mapping[str, Any] | None,
    authorized: bool,
    missing_primitive: str | None = None,
) -> dict[str, Any]:
    """Evaluate review completeness. This function never grants execution authority."""
    if not isinstance(authorized, bool):
        raise ProtocolError("AUTHORIZATION_FLAG_MUST_BE_BOOLEAN")
    if missing_primitive is not None and (
        not isinstance(missing_primitive, str) or not missing_primitive.strip()
    ):
        raise ProtocolError("MISSING_PRIMITIVE_MUST_BE_EXACT")
    if not isinstance(ring_reviews, Mapping):
        raise ProtocolError("RING_REVIEWS_MUST_BE_MAPPING")

    missing_rings = [key for key in RING_KEYS if key not in ring_reviews]
    if missing_rings:
        primitive = "ring_review:" + missing_rings[0]
        return _gate_result("BLOCKED_WITH_EXACT_MISSING_PRIMITIVE", primitive, ring_reviews)

    for key in RING_KEYS:
        review = ring_reviews[key]
        if not isinstance(review, Mapping):
            raise ProtocolError("RING_REVIEW_MUST_BE_OBJECT:" + key)
        verdict = review.get("verdict")
        if verdict not in RING_VERDICTS:
            raise ProtocolError("RING_VERDICT_INVALID:" + key)
        if verdict == "NOT_APPLICABLE_WITH_REASON" and not (
            isinstance(review.get("reason"), str) and review["reason"].strip()
        ):
            raise ProtocolError("NOT_APPLICABLE_REQUIRES_REASON:" + key)

    if missing_primitive:
        return _gate_result("BLOCKED_WITH_EXACT_MISSING_PRIMITIVE", missing_primitive, ring_reviews)
    if not authorized:
        return _gate_result(
            "BLOCKED_WITH_EXACT_MISSING_PRIMITIVE", "explicit_authorization", ring_reviews
        )
    if not isinstance(independent_validation, Mapping):
        return _gate_result(
            "BLOCKED_WITH_EXACT_MISSING_PRIMITIVE", "independent_validation", ring_reviews
        )
    validation = independent_validation.get("verdict")
    if validation == "FAIL":
        return _gate_result("DECLINE", None, ring_reviews)
    if validation != "PASS":
        return _gate_result(
            "BLOCKED_WITH_EXACT_MISSING_PRIMITIVE", "independent_validation:PASS", ring_reviews
        )

    verdicts = [ring_reviews[key]["verdict"] for key in RING_KEYS]
    if any(v in {"CHALLENGE", "UNRESOLVED"} for v in verdicts):
        return _gate_result("UNRESOLVED", None, ring_reviews)
    return _gate_result("ACCEPT", None, ring_reviews)


def _gate_result(
    decision: str,
    missing_primitive: str | None,
    ring_reviews: Mapping[str, Mapping[str, Any]],
) -> dict[str, Any]:
    return {
        "protocol": "dualis.seed.v1",
        "decision": decision,
        "missing_primitive": missing_primitive,
        "ring_verdicts": {
            key: ring_reviews[key].get("verdict")
            for key in RING_KEYS if key in ring_reviews and isinstance(ring_reviews[key], Mapping)
        },
        "execution_authorized": False,
        "note": "A review decision never grants runtime permissions or authorizes external side effects.",
    }
