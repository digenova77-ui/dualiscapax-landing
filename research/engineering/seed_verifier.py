"""Strict, deterministic manifest validation and content commitment.

This module validates a model description as data. It never evaluates rules or
executes code contained in a manifest. Numeric measurements should be encoded
as integers or explicit strings (for example, "0.125" or "1/8") so the
canonical JSON representation does not silently depend on binary floats.
"""
from __future__ import annotations

import hashlib
import json
from typing import Any

REQUIRED = {
    "model_id",
    "schema_version",
    "state",
    "rules",
    "units",
    "precision",
    "boundary_conditions",
    "observables",
    "invariants",
    "limits",
}
SCHEMA_VERSION = "dualis.seed.v1"
MAX_SAFE_INTEGER = (1 << 53) - 1


class ManifestError(ValueError):
    """Manifest is malformed, ambiguous, or outside the supported schema."""


def _unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ManifestError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def _reject_constant(value: str) -> None:
    raise ManifestError(f"non-finite JSON numeric constant is forbidden: {value}")


def _validate_portable_value(value: Any, path: str = "$") -> None:
    """Restrict values to the cross-language canonical JSON subset."""
    if value is None or isinstance(value, bool):
        return
    if isinstance(value, int):
        if abs(value) > MAX_SAFE_INTEGER:
            raise ManifestError(f"integer outside cross-language safe range at {path}")
        return
    if isinstance(value, float):
        raise ManifestError(
            f"binary floating-point value at {path}; use an integer or explicit decimal/rational string"
        )
    if isinstance(value, str):
        if any(0xD800 <= ord(char) <= 0xDFFF for char in value):
            raise ManifestError(f"unpaired surrogate code point at {path}")
        return
    if isinstance(value, list):
        for index, child in enumerate(value):
            _validate_portable_value(child, f"{path}[{index}]")
        return
    if isinstance(value, dict):
        for key, child in value.items():
            if not isinstance(key, str):
                raise ManifestError(f"object key must be a string at {path}")
            if not key.isascii():
                raise ManifestError(f"non-ASCII object key at {path}: {key!r}")
            _validate_portable_value(child, f"{path}.{key}")
        return
    raise ManifestError(f"unsupported value type at {path}: {type(value).__name__}")


def parse_manifest(source: str) -> dict[str, Any]:
    """Parse strict JSON, rejecting duplicate keys and non-finite/floating numbers."""
    try:
        value = json.loads(
            source,
            object_pairs_hook=_unique_object,
            parse_constant=_reject_constant,
        )
    except ManifestError:
        raise
    except (json.JSONDecodeError, TypeError) as exc:
        raise ManifestError(f"invalid JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise ManifestError("manifest root must be a JSON object")
    validate_manifest(value)
    return value


def validate_manifest(manifest: dict[str, Any]) -> None:
    """Validate the portable JSON subset and supported schema without executing rules."""
    if not isinstance(manifest, dict):
        raise ManifestError("manifest root must be a JSON object")
    _validate_portable_value(manifest)
    missing = sorted(REQUIRED - manifest.keys())
    extra = sorted(manifest.keys() - REQUIRED)
    if missing:
        raise ManifestError("missing required fields: " + ", ".join(missing))
    if extra:
        raise ManifestError("unsupported fields: " + ", ".join(extra))
    if manifest["schema_version"] != SCHEMA_VERSION:
        raise ManifestError(
            f"unsupported schema_version: {manifest['schema_version']!r}"
        )
    for key in ("model_id", "precision"):
        if not isinstance(manifest[key], str) or not manifest[key].strip():
            raise ManifestError(f"{key} must be a non-empty string")
    for key in (
        "state",
        "rules",
        "units",
        "boundary_conditions",
        "observables",
        "invariants",
        "limits",
    ):
        if not isinstance(manifest[key], (dict, list)):
            raise ManifestError(f"{key} must be a JSON object or array")


def canonical_bytes(manifest: dict[str, Any]) -> bytes:
    """Return UTF-8 canonical JSON bytes for an already validated manifest."""
    validate_manifest(manifest)
    encoded = json.dumps(
        manifest,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    )
    return encoded.encode("utf-8")


def commitment_sha256(manifest: dict[str, Any]) -> str:
    """Return SHA-256 commitment to canonical manifest bytes; not a proof of truth."""
    return hashlib.sha256(canonical_bytes(manifest)).hexdigest()


def verification_report(manifest: dict[str, Any]) -> dict[str, str]:
    """Return the limited checks this module actually performs."""
    validate_manifest(manifest)
    return {
        "status": "PASS",
        "schema": SCHEMA_VERSION,
        "canonical_sha256": commitment_sha256(manifest),
        "scope": "schema-and-canonical-commitment-only",
        "truth_claim": "not-established-by-hash",
        "execution": "no-user-code-executed",
    }
