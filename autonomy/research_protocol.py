"""Fail-closed protocol checks for non-invasive plant/material research.

This validates a written study plan only. It does not approve experiments,
authenticate reviewers, certify materials, or operate laboratory equipment.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple


@dataclass(frozen=True)
class ResearchProtocol:
    protocol_id: str
    hypothesis: str
    species: str
    intervention: str
    sample_size_per_group: int
    control_description: str
    measurement_metrics: Tuple[str, ...]
    calibration_evidence_ref: str
    success_criteria: str
    stop_conditions: str
    human_reviewer_id: str
    human_review_record: str


@dataclass(frozen=True)
class ProtocolDecision:
    accepted: bool
    blockers: Tuple[str, ...]


# Initial software gate supports observation-only studies. Physical grafting,
# implantation, genetic modification, material release, and actuation are not
# authorized by this module and require a separate qualified review process.
ALLOWED_INTERVENTION = "non_invasive_observation"
ALLOWED_METRICS = frozenset({
    "leaf_temperature", "air_temperature", "relative_humidity",
    "soil_moisture", "light_intensity", "soil_ph",
})


def validate_protocol(protocol: ResearchProtocol) -> ProtocolDecision:
    """Check minimum study-plan completeness; fail closed on missing safeguards."""
    blockers = []
    required = (
        ("protocol_id", protocol.protocol_id),
        ("hypothesis", protocol.hypothesis),
        ("species", protocol.species),
        ("control_description", protocol.control_description),
        ("calibration_evidence_ref", protocol.calibration_evidence_ref),
        ("success_criteria", protocol.success_criteria),
        ("stop_conditions", protocol.stop_conditions),
        ("human_reviewer_id", protocol.human_reviewer_id),
        ("human_review_record", protocol.human_review_record),
    )
    for field, value in required:
        if not isinstance(value, str) or not value.strip():
            blockers.append(f"{field}_required")
    if protocol.intervention != ALLOWED_INTERVENTION:
        blockers.append("intervention_not_authorized_by_observation_gate")
    if not isinstance(protocol.sample_size_per_group, int) or isinstance(protocol.sample_size_per_group, bool) or protocol.sample_size_per_group < 2:
        blockers.append("sample_size_per_group_must_be_at_least_2")
    if not protocol.measurement_metrics:
        blockers.append("measurement_metrics_required")
    elif any(metric not in ALLOWED_METRICS for metric in protocol.measurement_metrics):
        blockers.append("measurement_metric_not_supported")
    if len(set(protocol.measurement_metrics)) != len(protocol.measurement_metrics):
        blockers.append("duplicate_measurement_metric")
    return ProtocolDecision(not blockers, tuple(blockers))
