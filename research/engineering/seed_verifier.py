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


def _reject_binary_float(value: Any, path: str = "$") -> None:
    if isinstance(value, float):
        raise ManifestError(
            f"binary floating-point value at {path}; use an integer or explicit decimal/rational string"
        )
    if isinstance(value, dict):
        for key, child in value.items():
            _reject_binary_float(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            _reject_binary_float(child, f"{path}[{index}]")


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
    _reject_binary_float(value)
    validate_manifest(value)
    return value


def validate_manifest(manifest: dict[str, Any]) -> None:
    """Validate required fields and supported version without executing rules."""
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
    _reject_binary_float(manifest)
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
