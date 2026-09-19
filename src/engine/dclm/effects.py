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
    def admit(self, executed: bool, verified: bool, authorized: bool, proof_id: str | None = None) -> EffectRecord:
        """Caller booleans alone never mint ADMITTED authority.

        proof_id must be a non-empty bound ProofObject id from AuthorityKernel.
        Even then, this boundary records admission claim — it does not promote.
        """
        if not executed:
            return EffectRecord(False, False, "NONE", "not_executed")
        if executed and not verified:
            return EffectRecord(True, False, "NONE", "EXECUTED_NOT_PROVEN_EFFECTIVE")
        if executed and verified and not authorized:
            return EffectRecord(True, True, "NONE", "UNAUTHORIZED")
        if not proof_id:
            return EffectRecord(True, True, "NONE", "CALLER_BOOLEANS_ARE_NOT_AUTHORITY")
        # Bound proof present: still NONE authority_effect — admission ≠ promotion.
        return EffectRecord(True, True, "NONE", "bound_proof_observed_not_promoted")
