"""Deterministic, bounded selection of proposed swarm work.

This is a pure planning primitive: it does not invoke models, run tasks, grant
permissions, or execute side effects. Scores are scheduling hints, not truth.
"""
from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Any, Iterable

from swarm_protocol import ProtocolError


@dataclass(frozen=True)
class WorkCandidate:
    task_id: str
    scope: str
    expected_value: float
    risk: float
    estimated_cost: float
    evidence_strength: float
    dependencies_ready: bool = True
    status: str = "PROPOSED"


def _bounded_number(name: str, value: Any, low: float, high: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ProtocolError(f"{name.upper()}_MUST_BE_NUMERIC")
    number = float(value)
    if not math.isfinite(number) or not low <= number <= high:
        raise ProtocolError(f"{name.upper()}_OUT_OF_RANGE")
    return number


def candidate_score(candidate: WorkCandidate) -> float:
    """Return a deterministic prioritization score; higher is scheduled first.

    expected_value is a relative benefit estimate >= 0, risk and evidence_strength
    are in [0, 1], and estimated_cost must be positive. Evidence reduces priority
    when weak; risk reduces priority when high. This is not a truth probability.
    """
    value = _bounded_number("expected_value", candidate.expected_value, 0, 1_000_000)
    risk = _bounded_number("risk", candidate.risk, 0, 1)
    cost = _bounded_number("estimated_cost", candidate.estimated_cost, 0.000001, 1_000_000)
    evidence = _bounded_number("evidence_strength", candidate.evidence_strength, 0, 1)
    return (value * evidence * (1.0 - risk)) / cost


def plan_wave(
    candidates: Iterable[WorkCandidate],
    *,
    max_items: int,
    budget: float,
) -> dict[str, Any]:
    """Select a stable, bounded set of eligible candidates without executing them.

    Only PROPOSED work with ready dependencies is eligible. Invalid candidates
    fail closed rather than being silently repaired. Stable task-ID tie-breaking
    makes the plan reproducible for the same inputs.
    """
    if isinstance(max_items, bool) or not isinstance(max_items, int) or max_items < 0:
        raise ProtocolError("MAX_ITEMS_MUST_BE_NONNEGATIVE_INTEGER")
    budget_value = _bounded_number("budget", budget, 0, 1_000_000)
    items = list(candidates)
    seen: set[str] = set()
    scored: list[tuple[float, str, WorkCandidate]] = []
    for item in items:
        if not isinstance(item, WorkCandidate):
            raise ProtocolError("CANDIDATE_TYPE_INVALID")
        if not isinstance(item.task_id, str) or not item.task_id.strip():
            raise ProtocolError("TASK_ID_REQUIRED")
        if item.task_id in seen:
            raise ProtocolError("DUPLICATE_TASK_ID")
        seen.add(item.task_id)
        if not isinstance(item.scope, str) or not item.scope.strip():
            raise ProtocolError("SCOPE_REQUIRED")
        if not isinstance(item.dependencies_ready, bool):
            raise ProtocolError("DEPENDENCY_STATE_INVALID")
        if item.status != "PROPOSED" or not item.dependencies_ready:
            continue
        score = candidate_score(item)
        cost = float(item.estimated_cost)
        scored.append((score, item.task_id, item))

    scored.sort(key=lambda row: (-row[0], row[1]))
    selected: list[dict[str, Any]] = []
    deferred: list[dict[str, Any]] = []
    spent = 0.0
    for score, task_id, item in scored:
        cost = float(item.estimated_cost)
        row = {"task_id": task_id, "scope": item.scope, "score": score, "estimated_cost": cost}
        if len(selected) < max_items and spent + cost <= budget_value:
            selected.append(row)
            spent += cost
        else:
            deferred.append(row)

    return {
        "status": "PLANNED",
        "execution_authorized": False,
        "selected": selected,
        "deferred": deferred,
        "selected_count": len(selected),
        "estimated_cost_total": spent,
        "budget": budget_value,
        "remaining_budget": budget_value - spent,
        "scoring_note": "Scheduling heuristic only; not a truth score or execution permission.",
    }
