"""Validate the typed Diamond/Graphene/Frontier derivative registry.

This is metadata validation, not a credential issuer, ecological sensor, or actuator.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Mapping

from swarm_protocol import ProtocolError

ROOT = Path(__file__).resolve().parents[2]
REGISTRY_PATH = ROOT / "config" / "dualis.derivative_registry.v1.json"
LAYER_KEYS = {"diamond", "graphene", "frontier", "core", "derivative_keys", "decision_energy"}
KEY_TYPES = {
    "POLICY_ROOT",
    "PUBLIC_TRUST_ANCHOR",
    "DOMAIN_MASTER",
    "DERIVED_SERVICE_KEY",
    "INDIVIDUAL_CREDENTIAL",
    "HUMAN_DECISION_AUTHORIZATION",
}
EVIDENCE_STATES = {
    "OBSERVED", "INFERRED", "HYPOTHESIS",
    "INDEPENDENTLY_VALIDATED", "REJECTED", "UNRESOLVED",
}
SIGNAL_CLASSES = {
    "HUMAN_REPORT", "ECOLOGICAL_OBSERVATION", "ASTRONOMICAL_OBSERVATION",
    "MACHINE_TELEMETRY", "SIMULATION_OUTPUT",
}


def load_registry(path: str | Path = REGISTRY_PATH) -> dict[str, Any]:
    try:
        registry = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ProtocolError("DERIVATIVE_REGISTRY_UNREADABLE_OR_INVALID") from exc
    return validate_registry(registry)


def validate_registry(registry: Any) -> dict[str, Any]:
    if not isinstance(registry, dict):
        raise ProtocolError("DERIVATIVE_REGISTRY_MUST_BE_OBJECT")
    if registry.get("protocol") != "dualis.derivatives.v1":
        raise ProtocolError("DERIVATIVE_PROTOCOL_MISMATCH")
    if registry.get("seed_ref") != "dualis-capax-one-seed" or registry.get("version") != 1:
        raise ProtocolError("DERIVATIVE_SEED_OR_VERSION_MISMATCH")
    if registry.get("status") not in {"PROPOSED", "ACTIVE"}:
        raise ProtocolError("DERIVATIVE_STATUS_INVALID")

    layers = registry.get("layers")
    if not isinstance(layers, list) or len(layers) != len(LAYER_KEYS):
        raise ProtocolError("DERIVATIVE_LAYER_COUNT_MISMATCH")
    layer_map = {}
    ids = set()
    for layer in layers:
        if not isinstance(layer, dict):
            raise ProtocolError("DERIVATIVE_LAYER_MUST_BE_OBJECT")
        key, layer_id = layer.get("key"), layer.get("id")
        if key not in LAYER_KEYS or key in layer_map:
            raise ProtocolError("DERIVATIVE_LAYER_KEY_INVALID_OR_DUPLICATE")
        if not isinstance(layer_id, str) or not layer_id.strip() or layer_id in ids:
            raise ProtocolError("DERIVATIVE_LAYER_ID_INVALID_OR_DUPLICATE")
        if not isinstance(layer.get("purpose"), str) or not layer["purpose"].strip():
            raise ProtocolError("DERIVATIVE_LAYER_PURPOSE_REQUIRED")
        layer_map[key] = layer
        ids.add(layer_id)

    domains = registry.get("domain_registry")
    if not isinstance(domains, list) or not domains:
        raise ProtocolError("DOMAIN_REGISTRY_REQUIRED")
    domain_ids, domain_keys = set(), set()
    for domain in domains:
        if not isinstance(domain, dict):
            raise ProtocolError("DOMAIN_ENTRY_MUST_BE_OBJECT")
        domain_id, key = domain.get("id"), domain.get("key")
        if not isinstance(domain_id, str) or not domain_id.strip() or domain_id in domain_ids:
            raise ProtocolError("DOMAIN_ID_INVALID_OR_DUPLICATE")
        if not isinstance(key, str) or not key.strip() or key in domain_keys:
            raise ProtocolError("DOMAIN_KEY_INVALID_OR_DUPLICATE")
        if domain.get("ring") not in {"A", "B", "C"}:
            raise ProtocolError("DOMAIN_RING_INVALID:" + str(key))
        if not isinstance(domain.get("master_key_role"), str) or not domain["master_key_role"].strip():
            raise ProtocolError("DOMAIN_MASTER_KEY_ROLE_REQUIRED:" + str(key))
        domain_ids.add(domain_id)
        domain_keys.add(key)

    if set(registry.get("key_types", [])) != KEY_TYPES:
        raise ProtocolError("KEY_TYPE_REGISTRY_MISMATCH")
    if set(registry.get("signal_classes", [])) != SIGNAL_CLASSES:
        raise ProtocolError("SIGNAL_CLASS_REGISTRY_MISMATCH")
    if set(registry.get("evidence_states", [])) != EVIDENCE_STATES:
        raise ProtocolError("EVIDENCE_STATE_REGISTRY_MISMATCH")
    invariants = registry.get("invariants")
    required = {
        "layers_are_typed",
        "connections_do_not_imply_truth",
        "connections_do_not_grant_authority",
        "cosmic_consciousness_is_hypothesis_not_default_fact",
        "ecological_signals_require_provenance",
        "unknowns_preserved",
        "no_live_biosynthetic_or_cyberkinetic_actuation",
        "no_secret_keys_in_registry",
    }
    if not isinstance(invariants, dict) or any(invariants.get(k) is not True for k in required):
        raise ProtocolError("DERIVATIVE_REQUIRED_INVARIANT_DISABLED")
    # A registry is metadata only; any field suggestive of secret key material is forbidden.
    forbidden = {"private_key", "secret_key", "seed_secret", "credential_value"}
    if any(str(k).lower() in forbidden for k in registry.keys()):
        raise ProtocolError("SECRET_MATERIAL_FORBIDDEN_IN_REGISTRY")
    return registry


def validate_signal(signal: Any) -> dict[str, Any]:
    """Validate an incoming frontier observation without treating it as established truth."""
    if not isinstance(signal, Mapping):
        raise ProtocolError("FRONTIER_SIGNAL_MUST_BE_OBJECT")
    required = {"signal_id", "signal_class", "source", "observed_at", "content", "evidence_state"}
    missing = sorted(required - signal.keys())
    if missing:
        raise ProtocolError("FRONTIER_SIGNAL_MISSING_FIELDS:" + ",".join(missing))
    for field in ("signal_id", "source", "observed_at"):
        if not isinstance(signal[field], str) or not signal[field].strip():
            raise ProtocolError("FRONTIER_SIGNAL_INVALID_FIELD:" + field)
    if signal["signal_class"] not in SIGNAL_CLASSES:
        raise ProtocolError("FRONTIER_SIGNAL_CLASS_UNKNOWN")
    if signal["evidence_state"] not in EVIDENCE_STATES:
        raise ProtocolError("FRONTIER_EVIDENCE_STATE_UNKNOWN")
    if signal["evidence_state"] == "INDEPENDENTLY_VALIDATED":
        refs = signal.get("validation_refs")
        if not isinstance(refs, list) or not refs or any(not isinstance(x, str) or not x.strip() for x in refs):
            raise ProtocolError("VALIDATED_SIGNAL_REQUIRES_VALIDATION_REFS")
    if signal["signal_class"] in {"ECOLOGICAL_OBSERVATION", "ASTRONOMICAL_OBSERVATION", "MACHINE_TELEMETRY"}:
        if not isinstance(signal.get("measurement_context"), Mapping):
            raise ProtocolError("FRONTIER_MEASUREMENT_CONTEXT_REQUIRED")
    if signal["signal_class"] == "SIMULATION_OUTPUT" and signal["evidence_state"] == "OBSERVED":
        raise ProtocolError("SIMULATION_CANNOT_BE_LABELED_DIRECT_OBSERVATION")
    return dict(signal)
