"""Evidence-first graph model for diamond/graphene/plant-system research.

This is a software representation of relationships and measurements. It does
not simulate material properties, prove physical compatibility, or authorize
laboratory/field actions.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import math
from typing import Iterable, Tuple


ALLOWED_LAYERS = frozenset({"foundation", "mesh", "biology"})

# Small explicit catalog: values outside this contract require reviewed schema
# expansion, not silent acceptance. Bounds are plausibility guards, not calibration.
METRIC_CONTRACTS = {
    "leaf_temperature": ("degC", -80.0, 100.0),
    "air_temperature": ("degC", -80.0, 100.0),
    "relative_humidity": ("percent", 0.0, 100.0),
    "soil_moisture": ("fraction", 0.0, 1.0),
    "light_intensity": ("lux", 0.0, 200000.0),
    "soil_ph": ("pH", 0.0, 14.0),
}


@dataclass(frozen=True, order=True)
class MeshNode:
    node_id: str
    layer: str
    label: str


@dataclass(frozen=True, order=True)
class MeshEdge:
    source: str
    target: str
    relation: str


@dataclass(frozen=True, order=True)
class PlantObservation:
    """A sourced observation; values are measurements, not inferred facts."""

    observation_id: str
    subject_id: str
    metric: str
    value: float
    unit: str
    measured_at: str
    source_id: str
    evidence_ref: str


@dataclass(frozen=True)
class MeshValidation:
    node_count: int
    edge_count: int
    component_count: int
    isolated_nodes: Tuple[str, ...]
    observation_count: int


def _required_text(value: str, field: str) -> None:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field}_required")


def _component_count(node_ids: set[str], edges: Iterable[MeshEdge]) -> int:
    adjacency = {node_id: set() for node_id in node_ids}
    for edge in edges:
        adjacency[edge.source].add(edge.target)
        adjacency[edge.target].add(edge.source)
    unseen = set(node_ids)
    count = 0
    while unseen:
        count += 1
        pending = [min(unseen)]
        unseen.remove(pending[0])
        while pending:
            current = pending.pop()
            for neighbor in sorted(adjacency[current] & unseen):
                unseen.remove(neighbor)
                pending.append(neighbor)
    return count


def validate_mesh(
    nodes: Iterable[MeshNode],
    edges: Iterable[MeshEdge],
    observations: Iterable[PlantObservation] = (),
) -> MeshValidation:
    """Validate identity, topology, and observation provenance fail-closed."""
    node_list = tuple(nodes)
    edge_list = tuple(edges)
    observation_list = tuple(observations)

    node_ids: set[str] = set()
    for node in node_list:
        _required_text(node.node_id, "node_id")
        _required_text(node.label, "node_label")
        if node.layer not in ALLOWED_LAYERS:
            raise ValueError("unknown_node_layer")
        if node.node_id in node_ids:
            raise ValueError("duplicate_node_id")
        node_ids.add(node.node_id)

    seen_edges: set[tuple[str, str, str]] = set()
    for edge in edge_list:
        _required_text(edge.source, "edge_source")
        _required_text(edge.target, "edge_target")
        _required_text(edge.relation, "edge_relation")
        if edge.source not in node_ids or edge.target not in node_ids:
            raise ValueError("edge_endpoint_missing")
        if edge.source == edge.target:
            raise ValueError("self_edge_forbidden")
        key = (min(edge.source, edge.target), max(edge.source, edge.target), edge.relation)
        if key in seen_edges:
            raise ValueError("duplicate_edge")
        seen_edges.add(key)

    observation_ids: set[str] = set()
    for item in observation_list:
        for field in ("observation_id", "subject_id", "metric", "unit",
                      "measured_at", "source_id", "evidence_ref"):
            _required_text(getattr(item, field), field)
        if item.observation_id in observation_ids:
            raise ValueError("duplicate_observation_id")
        observation_ids.add(item.observation_id)
        if item.subject_id not in node_ids:
            raise ValueError("observation_subject_missing")
        if not isinstance(item.value, (int, float)) or isinstance(item.value, bool):
            raise ValueError("observation_value_must_be_numeric")
        if not math.isfinite(item.value):
            raise ValueError("observation_value_must_be_finite")
        contract = METRIC_CONTRACTS.get(item.metric)
        if contract is None:
            raise ValueError("observation_metric_unknown")
        expected_unit, minimum, maximum = contract
        if item.unit != expected_unit:
            raise ValueError("observation_unit_mismatch")
        if not minimum <= item.value <= maximum:
            raise ValueError("observation_value_out_of_range")
        try:
            measured_at = datetime.fromisoformat(item.measured_at.replace("Z", "+00:00"))
        except (TypeError, ValueError) as exc:
            raise ValueError("observation_timestamp_invalid") from exc
        if measured_at.tzinfo is None or measured_at.utcoffset() is None:
            raise ValueError("observation_timestamp_must_be_timezone_aware")

    adjacency = {node_id: set() for node_id in node_ids}
    for edge in edge_list:
        adjacency[edge.source].add(edge.target)
        adjacency[edge.target].add(edge.source)
    isolated = tuple(sorted(node_id for node_id, neighbors in adjacency.items() if not neighbors))

    return MeshValidation(
        node_count=len(node_list),
        edge_count=len(edge_list),
        component_count=_component_count(node_ids, edge_list),
        isolated_nodes=isolated,
        observation_count=len(observation_list),
    )
