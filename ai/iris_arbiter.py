#!/usr/bin/env python3
"""
iris_arbiter.py — hybrid arbiter for the DualisCapax / Iris domain path.

Deterministic law judges + pattern intuition, integrated under the
fixed LAW-WINS decision table. Pattern side never overrides a
deterministic refusal.
"""

from __future__ import annotations
import math
from typing import Any, Callable, Dict, Optional

# ---------------------------------------------------------------------------
# Law judges (deterministic)
# ---------------------------------------------------------------------------

def plus_one_rate(usdc_amount: float, cohort_growth_rate: float, tier: int = 1) -> float:
    """PLUS_ONE_INCENTIVE.md §1.2 — exact, no approximation.
    rate = 0.001 * (1 + cohort_growth_rate) * (1 + 0.1 * (tier - 1))
    Returns the payable amount in USDC (6 decimals)."""
    if usdc_amount < 0:
        raise ValueError("usdc_amount must be >= 0")
    rate = 0.001 * (1 + cohort_growth_rate) * (1 + 0.1 * (tier - 1))
    return round(usdc_amount * rate, 6)


LAW_JUDGES: Dict[str, Callable[[Dict[str, Any]], Dict[str, Any]]] = {}


def register_judge(domain: str, judge_fn: Callable[[Dict[str, Any]], Dict[str, Any]]) -> None:
    """Register or replace a deterministic law judge for a domain.
    The judge must return a dict containing at least:
      {"mode": "deterministic", "verdict": "PASS"|"REFUSE"|"PENDING", ...}
    """
    if not callable(judge_fn):
        raise TypeError("judge_fn must be callable")
    LAW_JUDGES[domain] = judge_fn


def unregister_judge(domain: str) -> bool:
    """Remove a registered judge. Returns True if it existed."""
    if domain in LAW_JUDGES:
        del LAW_JUDGES[domain]
        return True
    return False


# ---------------------------------------------------------------------------
# Pattern intuition (probabilistic lean)
# ---------------------------------------------------------------------------

def pattern_score(features: Dict[str, Any]) -> Dict[str, Any]:
    """Return a lean (PURE / IMPURE / TIE) and a margin from supplied features.
    This is the probabilistic side. It never decides alone."""
    if "forced_lean" in features:
        lean = features["forced_lean"]
        margin = float(features.get("forced_margin", 0.5))
        return {
            "lean": lean,
            "margin": margin,
            "honest_label": f"forced lean={lean} margin={margin}",
        }
    return {
        "lean": "TIE",
        "margin": 0.0,
        "honest_label": "pattern side abstained — no decisive features",
    }


# ---------------------------------------------------------------------------
# Hybrid engine
# ---------------------------------------------------------------------------

def _arbitrate_domain(domain: str, law_input: Dict[str, Any],
                      pattern_input: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Hybrid engine: deterministic law + pattern intuition, integrated
    per the LAW-WINS decision table."""
    law_result = LAW_JUDGES[domain](law_input) if domain in LAW_JUDGES else None

    if law_result is None and domain == "plus_one_math":
        r = plus_one_rate(**law_input)
        law_result = {
            "mode": "deterministic",
            "verdict": "PASS",
            "law": "PLUS_ONE_INCENTIVE.md §1.2",
            "reason": "exact function evaluated",
            "rate": r,
        }

    if law_result is None:
        law_result = {
            "mode": "deterministic",
            "verdict": "REFUSE",
            "reason": "no judge registered — fail closed",
        }

    # A malformed judge result must never be interpreted as approval.
    if not isinstance(law_result, dict) or law_result.get("verdict") not in {"PASS", "REFUSE", "PENDING"}:
        law_result = {
            "mode": "deterministic",
            "verdict": "REFUSE",
            "reason": "missing or invalid judge verdict — fail closed",
        }

    if pattern_input is None:
        pattern = {
            "lean": "TIE",
            "margin": 0.0,
            "honest_label": "pattern side abstained — no features supplied",
        }
    else:
        pattern = pattern_score(pattern_input)

    law_v = law_result["verdict"]
    lean = pattern["lean"]

    if law_v == "REFUSE":
        verdict, confidence, note = "REFUSE", 1.0, \
            "LAW WINS — deterministic refusal stands; pattern lean recorded, never acted on"
    elif law_v == "PENDING":
        if lean == "IMPURE":
            verdict, confidence, note = "PENDING", 0.35, \
                "held for evidence; pattern intuition dissents — do not act"
        elif lean == "PURE":
            verdict, confidence, note = "PENDING", 0.75, \
                "held for evidence; pattern intuition agrees it is honest"
        else:
            verdict, confidence, note = "PENDING", 0.5, \
                "held for evidence"
    else:  # PASS
        if lean == "PURE":
            verdict, confidence, note = "PASS", 0.95, \
                "law and intuition agree — confidence amplified"
        elif lean == "IMPURE":
            verdict, confidence, note = "PASS", 0.6, \
                "RESIDUAL: law passes but pattern intuition dissents — verdict stands (law wins), flagged for watch layer"
        else:
            verdict, confidence, note = "PASS", 0.8, \
                "law passes; pattern side abstained"

    return {
        "mode": "hybrid-arbiter",
        "domain": domain,
        "verdict": verdict,
        "confidence": confidence,
        "integration_note": note,
        "deterministic": law_result,
        "probabilistic": pattern,
        "conflict_rule": "LAW WINS — intuition never overrides a deterministic refusal",
    }


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def arbitrate(domain: Optional[str] = None,
              law_input: Optional[Dict[str, Any]] = None,
              pattern_input: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Public entry. When a domain is supplied, runs the hybrid engine.
    Otherwise returns an abstention."""
    if domain is None:
        return {
            "mode": "hybrid-arbiter",
            "verdict": "ABSTAIN",
            "confidence": 0.0,
            "integration_note": "no domain supplied — abstaining",
            "conflict_rule": "LAW WINS — intuition never overrides a deterministic refusal",
        }
    return _arbitrate_domain(domain, law_input or {}, pattern_input)
