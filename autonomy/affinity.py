"""Deterministic, offline affinity scoring with a separate authorization gate.

This module ranks integration candidates. It never creates accounts, handles
credentials, contacts providers, or performs side effects.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import FrozenSet, Tuple


@dataclass(frozen=True)
class Task:
    required_capabilities: FrozenSet[str]
    required_scopes: FrozenSet[str]
    max_cost_units: float
    allowed_side_effects: FrozenSet[str]
    approval_granted: bool = False


@dataclass(frozen=True)
class Integration:
    provider: str
    capabilities: FrozenSet[str]
    available_scopes: FrozenSet[str]
    reliability: float
    estimated_cost_units: float
    side_effects: FrozenSet[str]
    official_api: bool
    terms_compliant: bool
    connected: bool
    owner_authorized_scopes: FrozenSet[str] = frozenset()


@dataclass(frozen=True)
class Decision:
    provider: str
    affinity: int
    eligible: bool
    reasons: Tuple[str, ...]


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def evaluate(task: Task, integration: Integration) -> Decision:
    """Score task fit from 0..100; independently enforce non-negotiable gates."""
    reasons = []
    capability_fit = (
        len(task.required_capabilities & integration.capabilities)
        / len(task.required_capabilities)
        if task.required_capabilities else 1.0
    )
    scope_fit = (
        len(task.required_scopes & integration.available_scopes)
        / len(task.required_scopes)
        if task.required_scopes else 1.0
    )
    if task.max_cost_units <= 0:
        cost_fit = 1.0 if integration.estimated_cost_units <= 0 else 0.0
    else:
        cost_fit = _clamp(
            1.0 - integration.estimated_cost_units / task.max_cost_units, 0.0, 1.0
        )
        if integration.estimated_cost_units <= task.max_cost_units:
            cost_fit = 1.0 - 0.25 * (
                integration.estimated_cost_units / task.max_cost_units
            )
    score = round(100 * (
        0.45 * capability_fit
        + 0.25 * _clamp(integration.reliability, 0.0, 1.0)
        + 0.20 * cost_fit
        + 0.10 * scope_fit
    ))
    if capability_fit < 1:
        reasons.append("required_capability_missing")
    if scope_fit < 1:
        reasons.append("required_scope_unavailable")
    if not integration.official_api:
        reasons.append("official_integration_required")
    if not integration.terms_compliant:
        reasons.append("provider_terms_not_verified")
    if not integration.connected:
        reasons.append("connection_required")
    if not task.required_scopes.issubset(integration.owner_authorized_scopes):
        reasons.append("owner_scope_authorization_missing")
    if not integration.side_effects.issubset(task.allowed_side_effects):
        reasons.append("side_effect_outside_task_policy")
    if integration.estimated_cost_units > task.max_cost_units:
        reasons.append("cost_limit_exceeded")
    if not task.approval_granted:
        reasons.append("task_authorization_missing")

    hard_blocks = {
        "required_capability_missing",
        "required_scope_unavailable",
        "official_integration_required",
        "provider_terms_not_verified",
        "connection_required",
        "owner_scope_authorization_missing",
        "side_effect_outside_task_policy",
        "cost_limit_exceeded",
        "task_authorization_missing",
    }
    eligible = score >= 80 and not any(reason in hard_blocks for reason in reasons)
    if not eligible and not reasons:
        reasons.append("affinity_below_threshold")
    return Decision(integration.provider, score, eligible, tuple(reasons))


def rank(task: Task, integrations: Tuple[Integration, ...]) -> Tuple[Decision, ...]:
    """Return best-fit candidates first; eligibility never follows from score alone."""
    return tuple(sorted(
        (evaluate(task, candidate) for candidate in integrations),
        key=lambda item: (item.eligible, item.affinity, item.provider),
        reverse=True,
    ))
