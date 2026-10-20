"""Fail-closed reviewer-attestation verification contract.

Cryptographic verification is injected deliberately. Production callers MUST
supply a verifier backed by an approved signature algorithm and managed trust
roots; this module does not implement signing or treat hashes as identity.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Callable, Mapping

_DIGEST = re.compile(r"^[0-9a-f]{64}$")
_MAX_SIGNATURE_CHARS = 4096
_MAX_ATTESTATION_LIFETIME_SECONDS = 31 * 24 * 60 * 60


@dataclass(frozen=True)
class ReviewerAttestation:
    attestation_id: str
    subject_digest: str
    reviewer_id: str
    key_id: str
    policy_version: str
    decision: str
    issued_at: str
    expires_at: str
    signature: str


@dataclass(frozen=True)
class AttestationVerification:
    verified: bool
    blockers: tuple[str, ...]
    signed_payload: bytes = b""


def _parse_timestamp(value: str) -> datetime | None:
    if not isinstance(value, str) or not value or len(value) > 64:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        return None
    return parsed.astimezone(timezone.utc)


def canonical_signed_payload(attestation: ReviewerAttestation) -> bytes:
    """Canonical UTF-8 bytes covered by the reviewer signature."""
    payload = {
        "schema_version": "trinity-review-attestation-v1",
        "attestation_id": attestation.attestation_id,
        "subject_digest": attestation.subject_digest,
        "reviewer_id": attestation.reviewer_id,
        "key_id": attestation.key_id,
        "policy_version": attestation.policy_version,
        "decision": attestation.decision,
        "issued_at": attestation.issued_at,
        "expires_at": attestation.expires_at,
    }
    return json.dumps(
        payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False
    ).encode("utf-8")


def verify_reviewer_attestation(
    attestation: ReviewerAttestation,
    *,
    trusted_keys: Mapping[str, str],
    signature_verifier: Callable[[str, bytes, str], bool],
    expected_subject_digest: str,
    required_policy_version: str,
    now: datetime | None = None,
) -> AttestationVerification:
    """Verify binding, trust, time, policy, and a caller-supplied signature.

    Any malformed input, untrusted key, callback exception, or non-True
    verifier result fails closed. The callback must perform real cryptographic
    verification; a boolean stub is suitable only for unit tests.
    """
    blockers: list[str] = []
    if not isinstance(attestation, ReviewerAttestation):
        return AttestationVerification(False, ("attestation_invalid",))
    for name in ("attestation_id", "reviewer_id", "key_id", "policy_version"):
        value = getattr(attestation, name)
        if not isinstance(value, str) or not value.strip() or len(value) > 256:
            blockers.append(f"{name}_invalid")
    if attestation.decision not in ("approve", "reject"):
        blockers.append("decision_invalid")
    if not isinstance(attestation.subject_digest, str) or not _DIGEST.fullmatch(attestation.subject_digest):
        blockers.append("subject_digest_invalid")
    if not isinstance(expected_subject_digest, str) or not _DIGEST.fullmatch(expected_subject_digest):
        blockers.append("expected_subject_digest_invalid")
    elif attestation.subject_digest != expected_subject_digest:
        blockers.append("subject_digest_mismatch")
    if not isinstance(required_policy_version, str) or not required_policy_version.strip():
        blockers.append("required_policy_version_missing")
    elif attestation.policy_version != required_policy_version:
        blockers.append("policy_version_mismatch")
    if not isinstance(attestation.signature, str) or not attestation.signature.strip() or len(attestation.signature) > _MAX_SIGNATURE_CHARS:
        blockers.append("signature_invalid")
    try:
        key_is_trusted = (
            isinstance(trusted_keys, Mapping)
            and isinstance(attestation.key_id, str)
            and isinstance(attestation.reviewer_id, str)
            and trusted_keys.get(attestation.key_id) == attestation.reviewer_id
        )
    except Exception:
        key_is_trusted = False
    if not key_is_trusted:
        blockers.append("reviewer_key_untrusted")
    if not callable(signature_verifier):
        blockers.append("signature_verifier_missing")

    issued = _parse_timestamp(attestation.issued_at)
    expires = _parse_timestamp(attestation.expires_at)
    if issued is None:
        blockers.append("issued_at_invalid")
    if expires is None:
        blockers.append("expires_at_invalid")
    current = now or datetime.now(timezone.utc)
    if current.tzinfo is None or current.utcoffset() is None:
        blockers.append("verification_time_must_be_timezone_aware")
    else:
        current = current.astimezone(timezone.utc)
        if issued is not None and issued.timestamp() > current.timestamp() + 60:
            blockers.append("attestation_not_yet_valid")
        if expires is not None and expires <= current:
            blockers.append("attestation_expired")
        if issued is not None and expires is not None:
            lifetime = (expires - issued).total_seconds()
            if lifetime <= 0 or lifetime > _MAX_ATTESTATION_LIFETIME_SECONDS:
                blockers.append("attestation_lifetime_invalid")

    blockers = sorted(set(blockers))
    if blockers:
        return AttestationVerification(False, tuple(blockers))
    try:
        payload = canonical_signed_payload(attestation)
        verified = signature_verifier(attestation.key_id, payload, attestation.signature) is True
    except Exception:
        verified = False
        payload = b""
    if not verified:
        return AttestationVerification(False, ("signature_verification_failed",))
    if attestation.decision != "approve":
        return AttestationVerification(False, ("reviewer_rejected_subject",), payload)
    return AttestationVerification(True, (), payload)
