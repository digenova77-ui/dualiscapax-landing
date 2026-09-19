"""Twain counterexample surface — honest stub.

FLOOR_V01: evaluator object was MISSING IMPLEMENTATION.
Independent replay against Twain is UNKNOWN, not AGREEMENT.

This module exists so `from engine.twain import Twain` imports without
pretending a full dual-oracle evaluator exists. It never returns AGREE
or AUTHORIZED. It never invents a counterexample finding.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass(frozen=True)
class TwainResult:
    """Result of a Twain evaluation attempt.

    status is always UNKNOWN from this stub unless an explicit
    counterexample flag is supplied by the *caller* (not invented here).
    """

    status: str  # UNKNOWN | DISAGREE (caller-supplied only) — never AGREE from stub
    reason: str
    independent_replay: str = "UNKNOWN"
    authority_effect: str = "NONE"
    claims_agreed: bool = False
    residuals: list[str] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "reason": self.reason,
            "independent_replay": self.independent_replay,
            "authority_effect": self.authority_effect,
            "claims_agreed": self.claims_agreed,
            "residuals": list(self.residuals),
            "evaluator": "Twain",
            "implementation": "STUB_NOT_FULL_EVALUATOR",
        }


class Twain:
    """Honest stub evaluator.

    Does not claim dual-oracle agreement. Does not mint authority.
    Callers that need a counterexample must supply evidence externally;
    this class will not fabricate DISAGREE or AGREE from thin air.
    """

    version = "factory-floor-v0.1-stub"
    implementation = "STUB_NOT_FULL_EVALUATOR"

    def evaluate(self, claim: Any = None, evidence: Any = None, **_: Any) -> TwainResult:
        return TwainResult(
            status="UNKNOWN",
            reason="TWAIN_EVALUATOR_NOT_IMPLEMENTED",
            independent_replay="UNKNOWN",
            authority_effect="NONE",
            claims_agreed=False,
            residuals=["twain_full_evaluator_absent"],
        )

    def counterexample(self, claim: Any = None, evidence: Any = None, **_: Any) -> TwainResult:
        """Search for a counterexample — not implemented; returns UNKNOWN."""
        return self.evaluate(claim, evidence)

    def independent_replay(self, claim: Any = None, evidence: Any = None, **_: Any) -> TwainResult:
        """Independent replay — not runnable; UNKNOWN not AGREEMENT."""
        return TwainResult(
            status="UNKNOWN",
            reason="TWAIN_INDEPENDENT_REPLAY_NOT_RUNNABLE",
            independent_replay="UNKNOWN",
            authority_effect="NONE",
            claims_agreed=False,
            residuals=["twain_replay_absent"],
        )
