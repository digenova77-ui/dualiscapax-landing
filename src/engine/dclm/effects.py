"""Effect boundary. Execution ≠ effectiveness ≠ authority."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class EffectRecord:
    executed: bool
    effect_verified: bool
    authority: str
    reason: str


class EffectBoundary:
    def admit(self, executed: bool, verified: bool, authorized: bool) -> EffectRecord:
        if not executed:
            return EffectRecord(False, False, "NONE", "not_executed")
        if executed and not verified:
            return EffectRecord(True, False, "NONE", "EXECUTED_NOT_PROVEN_EFFECTIVE")
        if executed and verified and not authorized:
            return EffectRecord(True, True, "NONE", "UNAUTHORIZED")
        return EffectRecord(True, True, "ADMITTED", "authorized_verified_effect")
