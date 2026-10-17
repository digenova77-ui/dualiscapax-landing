"""Decision-level communication accounting with explicit energy provenance.

This module records resource costs against validated decision outcomes. It does
not infer human value or measure physical energy by itself.
"""
from __future__ import annotations

from typing import Any, Mapping

from swarm_protocol import ProtocolError

ENERGY_BASES = {"MEASURED", "ESTIMATED", "SIMULATED", "UNKNOWN"}
DECISION_STATES = {"PROPOSED", "ACCEPTED", "REJECTED", "UNRESOLVED", "VALIDATED"}


def evaluate_decision_cost(record: Any) -> dict[str, Any]:
    """Validate a communication record and derive decision-level metrics."""
    if not isinstance(record, Mapping):
        raise ProtocolError("DECISION_COST_RECORD_MUST_BE_OBJECT")
    required = {
        "communication_id", "output_units", "output_unit",
        "energy_joules", "energy_basis", "decisions",
    }
    missing = sorted(required - record.keys())
    if missing:
        raise ProtocolError("DECISION_COST_MISSING_FIELDS:" + ",".join(missing))
    if not isinstance(record["communication_id"], str) or not record["communication_id"].strip():
        raise ProtocolError("COMMUNICATION_ID_REQUIRED")
    units = record["output_units"]
    if isinstance(units, bool) or not isinstance(units, (int, float)) or units < 0:
        raise ProtocolError("OUTPUT_UNITS_MUST_BE_NONNEGATIVE_NUMBER")
    if not isinstance(record["output_unit"], str) or not record["output_unit"].strip():
        raise ProtocolError("OUTPUT_UNIT_REQUIRED")
    basis = record["energy_basis"]
    if basis not in ENERGY_BASES:
        raise ProtocolError("ENERGY_BASIS_INVALID")
    energy = record["energy_joules"]
    if basis == "UNKNOWN":
        if energy is not None:
            raise ProtocolError("UNKNOWN_ENERGY_MUST_BE_NULL")
    elif isinstance(energy, bool) or not isinstance(energy, (int, float)) or energy < 0:
        raise ProtocolError("ENERGY_JOULES_MUST_BE_NONNEGATIVE_NUMBER")
    decisions = record["decisions"]
    if not isinstance(decisions, list):
        raise ProtocolError("DECISIONS_MUST_BE_LIST")
    for index, decision in enumerate(decisions):
        if not isinstance(decision, Mapping):
            raise ProtocolError(f"DECISION_{index}_MUST_BE_OBJECT")
        if decision.get("state") not in DECISION_STATES:
            raise ProtocolError(f"DECISION_{index}_STATE_INVALID")
        if decision["state"] == "VALIDATED":
            ref = decision.get("validation_ref")
            if not isinstance(ref, str) or not ref.strip():
                raise ProtocolError(f"DECISION_{index}_VALIDATION_REF_REQUIRED")
    validated = sum(d["state"] == "VALIDATED" for d in decisions)
    resolved = sum(d["state"] in {"VALIDATED", "ACCEPTED", "REJECTED"} for d in decisions)
    result = {
        "protocol": "dualis.decision-energy.v1",
        "communication_id": record["communication_id"],
        "output_units": units,
        "output_unit": record["output_unit"],
        "energy_basis": basis,
        "energy_joules": energy,
        "decision_count": len(decisions),
        "resolved_decision_count": resolved,
        "validated_decision_count": validated,
        "joules_per_output_unit": None,
        "joules_per_validated_decision": None,
        "joules_per_resolved_decision": None,
        "comparability": "MATCHING_BOUNDARIES_AND_ENERGY_BASIS_REQUIRED",
        "quality_warning": (
            "Lower energy per decision is not inherently better. Assess correctness, safety, "
            "reversibility, fairness, and task difficulty alongside resource cost."
        ),
    }
    if basis != "UNKNOWN":
        result["joules_per_output_unit"] = energy / units if units else None
        result["joules_per_validated_decision"] = energy / validated if validated else None
        result["joules_per_resolved_decision"] = energy / resolved if resolved else None
    return result
