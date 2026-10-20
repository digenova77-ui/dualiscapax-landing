"""Deterministic, bounded, secret-redacted evidence envelopes for autonomy.

This is an evidence preparation utility, not a secret manager or an external
attestation system. Hashes establish content identity only; they do not prove
who produced the evidence.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
from dataclasses import dataclass
from typing import Any

_REDACTED = "[REDACTED]"
_SECRET_KEY_MARKERS = (
    "password", "passwd", "secret", "token", "api_key", "apikey",
    "private_key", "credential", "authorization", "cookie", "access_key", "refresh_token", "client_secret",
)
_PATTERNS = (
    re.compile(r"(?i)\bBearer\s+[A-Za-z0-9._~+/=-]+"),
    re.compile(r"(?i)\b(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9]{12,})\b"),
    re.compile(r"(?i)\b(?:glpat-[A-Za-z0-9_-]{12,}|xox[baprs]-[A-Za-z0-9-]{10,})\b"),
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(r"(?i)\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b"),
    re.compile(r"(?i)(api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*[^\s,;]+"),
)
MAX_DEPTH = 12
MAX_ITEMS = 1000
MAX_STRING_CHARS = 8192
MAX_KEY_CHARS = 256
MAX_ENVELOPE_BYTES = 65536


@dataclass(frozen=True)
class EvidenceEnvelope:
    schema_version: str
    task_id: str
    outcome: str
    evidence: Any
    canonical_json: str
    sha256: str


def _secret_key(key: str) -> bool:
    normalized = re.sub(r"[^a-z0-9]", "", key.lower())
    markers = (re.sub(r"[^a-z0-9]", "", marker.lower()) for marker in _SECRET_KEY_MARKERS)
    return any(marker in normalized for marker in markers)


def _clean_string(value: str) -> str:
    # Reject oversize input in envelope validation; this clipping is retained
    # for the standalone redaction helper's bounded diagnostic output.
    clipped = value[:MAX_STRING_CHARS]
    for pattern in _PATTERNS:
        clipped = pattern.sub(_REDACTED, clipped)
    return clipped


def _validate_evidence(value: Any, *, depth: int = 0, budget: list[int] | None = None) -> None:
    """Reject ambiguous or truncated data before a digest can be issued."""
    if budget is None:
        budget = [0]
    budget[0] += 1
    if budget[0] > MAX_ITEMS:
        raise ValueError("evidence exceeds maximum item count")
    if depth > MAX_DEPTH:
        raise ValueError("evidence exceeds maximum nesting depth")
    if value is None or isinstance(value, (bool, int)):
        return
    if isinstance(value, float):
        if not math.isfinite(value):
            raise ValueError("evidence contains non-finite number")
        return
    if isinstance(value, str):
        if len(value) > MAX_STRING_CHARS:
            raise ValueError("evidence string exceeds maximum length")
        return
    if isinstance(value, dict):
        if len(value) > MAX_ITEMS:
            raise ValueError("evidence mapping exceeds maximum item count")
        safe_keys: set[str] = set()
        for key, child in value.items():
            if not isinstance(key, str):
                raise ValueError("evidence mapping keys must be strings")
            if len(key) > MAX_KEY_CHARS:
                raise ValueError("evidence mapping key exceeds maximum length")
            safe_key = _clean_string(key)
            if safe_key in safe_keys:
                raise ValueError("evidence mapping keys collide after redaction")
            safe_keys.add(safe_key)
            budget[0] += 1
            if budget[0] > MAX_ITEMS:
                raise ValueError("evidence exceeds maximum item count")
            if depth + 1 > MAX_DEPTH:
                raise ValueError("evidence exceeds maximum nesting depth")
            _validate_evidence(child, depth=depth + 1, budget=budget)
        return
    if isinstance(value, (list, tuple)):
        if len(value) > MAX_ITEMS:
            raise ValueError("evidence sequence exceeds maximum item count")
        for child in value:
            _validate_evidence(child, depth=depth + 1, budget=budget)
        return
    raise ValueError(f"unsupported evidence value type: {type(value).__name__}")


def redact(value: Any, *, _depth: int = 0) -> Any:
    """Return a JSON-safe, bounded diagnostic copy with credential-like fields redacted.

    This convenience helper may label unsupported/truncated values. Use
    create_evidence_envelope for integrity-sensitive, fail-closed envelopes.
    """
    if _depth > MAX_DEPTH:
        return "[TRUNCATED:MAX_DEPTH]"
    if value is None or isinstance(value, (bool, int)):
        return value
    if isinstance(value, float):
        if not math.isfinite(value):
            return str(value)
        return value
    if isinstance(value, str):
        return _clean_string(value)
    if isinstance(value, dict):
        output: dict[str, Any] = {}
        for index, key in enumerate(sorted(value, key=lambda item: str(item))):
            if index >= MAX_ITEMS:
                output["_truncated"] = "MAX_ITEMS"
                break
            safe_key = _clean_string(str(key))[:MAX_KEY_CHARS]
            output[safe_key] = _REDACTED if _secret_key(safe_key) else redact(value[key], _depth=_depth + 1)
        return output
    if isinstance(value, (list, tuple)):
        output = [redact(item, _depth=_depth + 1) for item in value[:MAX_ITEMS]]
        if len(value) > MAX_ITEMS:
            output.append("[TRUNCATED:MAX_ITEMS]")
        return output
    return f"[UNSUPPORTED:{type(value).__name__}]"


def create_evidence_envelope(*, task_id: str, outcome: str, evidence: Any) -> EvidenceEnvelope:
    """Create a deterministic, bounded, redacted envelope or fail closed."""
    if (
        not isinstance(task_id, str) or not task_id.strip()
        or len(task_id) > 256 or any(ord(char) < 32 for char in task_id)
    ):
        raise ValueError("task_id is required and must be a valid bounded string")
    if not isinstance(outcome, str) or outcome not in {
        "succeeded", "failed", "blocked", "cancelled", "unknown"
    }:
        raise ValueError("unsupported outcome")
    _validate_evidence(evidence)
    safe = redact(evidence)
    body = {
        "schema_version": "trinity-evidence-v1",
        "task_id": task_id,
        "outcome": outcome,
        "evidence": safe,
    }
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
    encoded = canonical.encode("utf-8")
    if len(encoded) > MAX_ENVELOPE_BYTES:
        raise ValueError("evidence envelope exceeds maximum size")
    return EvidenceEnvelope(
        schema_version=body["schema_version"],
        task_id=task_id,
        outcome=outcome,
        evidence=safe,
        canonical_json=canonical,
        sha256=hashlib.sha256(encoded).hexdigest(),
    )
