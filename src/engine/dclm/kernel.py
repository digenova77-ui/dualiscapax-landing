"""AuthorityKernel — single decision point. UNKNOWN is not AUTHORIZED."""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

from .proof import ProofObject


class Decision(str, Enum):
    AUTHORIZED = "AUTHORIZED"
    DENIED = "DENIED"
    UNKNOWN = "UNKNOWN"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    ORACLE_DISAGREEMENT = "ORACLE_DISAGREEMENT"


StateAuthorityKernel = None

def _load_twain_class():
    try:
        from engine.twain.counterexample import Twain  # type: ignore
        return Twain
    except Exception:
        try:
            import importlib.util
            from pathlib import Path
            path = Path(__file__).resolve().parents[1] / "twain" / "counterexample.py"
            spec = importlib.util.spec_from_file_location("_twain_floor_bind", path)
            if spec is None or spec.loader is None:
                return None
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            return mod.Twain
        except Exception:
            return None


def _twain_live_agree(claim) -> tuple[str, str]:
    """Second-order safe: class attribute alone cannot mint AGREE.

    Calls Twain.independent_replay / evaluate. Stub returns UNKNOWN.
    Mutating Twain.implementation = 'FULL_EVALUATOR' does not confirm.
    """
    Twain = _load_twain_class()
    if Twain is None:
        return "MISSING", "UNKNOWN"
    impl = str(getattr(Twain, "implementation", None) or "MISSING")
    try:
        result = Twain().independent_replay(claim)
        replay = str(getattr(result, "independent_replay", None) or getattr(result, "status", "UNKNOWN"))
    except Exception:
        return impl, "UNKNOWN"
    return impl, replay




@dataclass
class AuthorityEffect:
    decision: Decision
    reasons: List[str]
    proof_id: Optional[str] = None
    effect_class: str = "NONE"
    residuals: List[str] = field(default_factory=list)
    claims_promoted: List[str] = field(default_factory=list)


@dataclass
class TransitionRequest:
    transition_id: str
    principal: str
    action: str
    resource: str
    capability: Optional[str] = None
    delegation: Optional[str] = None
    invocation: Optional[str] = None
    execution: Optional[str] = None
    evidence: Optional[ProofObject] = None
    authority_epoch: Optional[int] = None
    current_epoch: Optional[int] = None
    revoked: bool = False
    in_scope: bool = True
    evaluator_acceptable: bool = True
    evidence_fresh: bool = True
    twain_counterexample: bool = False
    dclm_obligations_open: List[str] = field(default_factory=list)
    independent_replay: Optional[str] = None
    identity_valid: bool = True
    claims: Dict[str, Any] = field(default_factory=dict)


class AuthorityKernel:
    version = "factory-floor-v0.1"

    def decide(self, req: TransitionRequest) -> AuthorityEffect:
        if req.twain_counterexample and req.independent_replay == "DISAGREE":
            return AuthorityEffect(Decision.ORACLE_DISAGREEMENT, ["twain_vs_replay"], effect_class="NONE")
        if req.twain_counterexample:
            return AuthorityEffect(Decision.DENIED, ["twain_counterexample"], effect_class="NONE")
        if req.revoked:
            return AuthorityEffect(Decision.REVOKED, ["authority_revoked"], effect_class="NONE")
        if req.authority_epoch is not None and req.current_epoch is not None and req.authority_epoch != req.current_epoch:
            return AuthorityEffect(Decision.EXPIRED, [f"stale_epoch:{req.authority_epoch}!={req.current_epoch}"], effect_class="NONE")
        if not req.in_scope:
            return AuthorityEffect(Decision.OUT_OF_SCOPE, ["resource_or_action_out_of_scope"], effect_class="NONE")
        if not req.identity_valid:
            return AuthorityEffect(Decision.DENIED, ["identity_invalid"], effect_class="NONE")
        if not req.evaluator_acceptable:
            return AuthorityEffect(Decision.UNKNOWN, ["evaluator_not_admissible"], effect_class="NONE")
        if not req.evidence_fresh:
            return AuthorityEffect(Decision.EXPIRED, ["stale_evidence"], effect_class="NONE")
        if req.dclm_obligations_open:
            return AuthorityEffect(Decision.INSUFFICIENT_EVIDENCE, ["dclm_open_obligations"] + list(req.dclm_obligations_open), residuals=list(req.dclm_obligations_open), effect_class="NONE")
        if req.evidence is None:
            return AuthorityEffect(Decision.INSUFFICIENT_EVIDENCE, ["no_proof_object"], effect_class="NONE")
        if req.independent_replay is None:
            return AuthorityEffect(Decision.UNKNOWN, ["independent_replay_not_run"], proof_id=req.evidence.proof_id, effect_class="NONE")
        if req.independent_replay == "DISAGREE":
            return AuthorityEffect(Decision.ORACLE_DISAGREEMENT, ["replay_disagree"], effect_class="NONE")
        if req.independent_replay not in ("AGREE", "PASS"):
            return AuthorityEffect(Decision.UNKNOWN, [f"replay_result={req.independent_replay}"], effect_class="NONE")
        # Caller-supplied AGREE/PASS is not Twain agreement.
        # Live probe required; stub returns UNKNOWN. Attribute forgery is insufficient.
        twain_impl, twain_replay = _twain_live_agree({
            "transition_id": req.transition_id,
            "proof_id": req.evidence.proof_id,
            "action": req.action,
        })
        if twain_impl != "FULL_EVALUATOR" or twain_replay not in ("AGREE", "PASS"):
            return AuthorityEffect(
                Decision.UNKNOWN,
                [
                    "independent_replay_agree_unbound",
                    f"twain_implementation={twain_impl}",
                    f"twain_live_replay={twain_replay}",
                    "caller_agree_is_not_evaluator_agree",
                ],
                proof_id=req.evidence.proof_id,
                effect_class="NONE",
            )
        if not req.capability:
            return AuthorityEffect(Decision.DENIED, ["no_capability"], effect_class="NONE")
        return AuthorityEffect(Decision.AUTHORIZED, ["proof_present", "replay_agree", "epoch_current", "twain_live_agree"], proof_id=req.evidence.proof_id, effect_class="AUTHORITY_EFFECT")


StateAuthorityKernel = AuthorityKernel
