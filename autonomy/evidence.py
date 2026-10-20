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
    "private_key", "credential", "authorization", "cookie", "access_key",
)
_PATTERNS = (
    re.compile(r"(?i)\bBearer\s+[A-Za-z0-9._~+/=-]+"),
    re.compile(r"(?i)\b(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9]{12,})\b"),
    re.compile(r"(?i)(api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*[^\s,;]+"),
)
MAX_DEPTH = 12
MAX_ITEMS = 1000
MAX_STRING_CHARS = 8192
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
    normalized = re.sub(r"[^a-z0-9_]", "", key.lower())
    return any(marker in normalized for marker in _SECRET_KEY_MARKERS)


def _clean_string(value: str) -> str:
    clipped = value[:MAX_STRING_CHARS]
    for pattern in _PATTERNS:
        clipped = pattern.sub(_REDACTED, clipped)
    return clipped


def redact(value: Any, *, _depth: int = 0) -> Any:
    """Return a JSON-safe, bounded copy with credential-like fields redacted."""
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
            safe_key = _clean_string(str(key))[:256]
            output[safe_key] = _REDACTED if _secret_key(safe_key) else redact(value[key], _depth=_depth + 1)
        return output
    if isinstance(value, (list, tuple)):
        output = [redact(item, _depth=_depth + 1) for item in value[:MAX_ITEMS]]
        if len(value) > MAX_ITEMS:
            output.append("[TRUNCATED:MAX_ITEMS]")
        return output
    return f"[UNSUPPORTED:{type(value).__name__}]"


def create_evidence_envelope(*, task_id: str, outcome: str, evidence: Any) -> EvidenceEnvelope:
    """Create a deterministic, size-bounded, redacted envelope or fail closed."""
    if not task_id or not task_id.strip():
        raise ValueError("task_id is required")
    if len(task_id) > 256 or any(ord(char) < 32 for char in task_id):
        raise ValueError("task_id is invalid or exceeds 256 characters")
    if outcome not in {"succeeded", "failed", "blocked", "cancelled", "unknown"}:
        raise ValueError("unsupported outcome")
    safe = redact(evidence)
    body = {
        "schema_version": "trinity-evidence-v1",
        "task_id": task_id,
        "outcome": outcome,
        "evidence": safe,
    }
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
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
