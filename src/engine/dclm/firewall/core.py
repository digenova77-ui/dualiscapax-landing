"""Isolated DCLM epistemic firewall V2.

Applies ratified GAMMA deltas only:
  DELTA-01 — 12 dimensions map onto existing structures (DIM12_MAP.json)
  DELTA-02 — non-zero dependence is not causality
  DELTA-03 — HMAC is LOCAL_IPC only; not sovereign authorization

Stdlib only. Not a production solver. Not a deploy.
"""
from __future__ import annotations

import dataclasses
import enum
import hashlib
import hmac
import json
from typing import Any, Dict, List, Optional


class CausalScope(str, enum.Enum):
    DESCRIPTIVE = "DESCRIPTIVE"
    CORRELATIVE = "CORRELATIVE"
    CAUSAL_DEMONSTRATED = "CAUSAL_DEMONSTRATED"


class PermittedUse(int, enum.Enum):
    NO_USE = 0
    REFERENCE_ONLY = 1
    ANALYSIS_ONLY = 2
    MODEL_INPUT = 3
    DECISION_SUPPORT = 4
    AUTOMATED_ACTION = 5
    PRODUCTION_CRITICAL = 6


class FirewallState(str, enum.Enum):
    ALLOW = "ALLOW"
    LIMIT = "LIMIT"
    BLOCK = "BLOCK"
    UNRESOLVED = "UNRESOLVED"
    REQUIRES_EVIDENCE = "REQUIRES_EVIDENCE"
    REQUIRES_AUTHORIZATION = "REQUIRES_AUTHORIZATION"
    SIGNATURE_INVALID = "SIGNATURE_INVALID"
    PERMISSION_ERROR = "PERMISSION_ERROR"


class TicketScheme(str, enum.Enum):
    LOCAL_IPC_HMAC = "LOCAL_IPC_HMAC"
    SOVEREIGN_ED25519_RFC8785 = "SOVEREIGN_ED25519_RFC8785"


@dataclasses.dataclass(frozen=True)
class ClaimObject:
    claim_id: str
    statement: str
    integrity_ok: bool = True
    provenance_ok: bool = True
    observation: str = "DIRECT_SENSOR"
    measurement_ok: bool = True
    verification: str = "UNVERIFIED"
    validation: str = "UNVALIDATED"
    fresh: bool = True
    temporal_ok: bool = True
    spatial_ok: bool = True
    population: str = "SINGLE_ACTOR"
    causal_scope: CausalScope = CausalScope.DESCRIPTIVE
    causal_mechanism: Optional[str] = None
    requested: PermittedUse = PermittedUse.ANALYSIS_ONLY
    origin: str = "MACHINE_OBSERVED"
    merkle_ok: bool = True
    contradiction: bool = False
    self_citing: bool = False
    hallucinated: bool = False
    operator_override: bool = False
    taint_ceiling: PermittedUse = PermittedUse.PRODUCTION_CRITICAL


@dataclasses.dataclass
class FirewallResult:
    claim_id: str
    firewall_state: FirewallState
    authorized_permitted_use: PermittedUse
    reasons: List[str]


@dataclasses.dataclass(frozen=True)
class ActionCapabilityTicket:
    ticket_id: str
    claim_id: str
    action_class: str
    scheme: TicketScheme
    envelope: Dict[str, Any]
    signature: str

    def body(self) -> str:
        env = json.dumps(self.envelope, sort_keys=True, separators=(",", ":"))
        return f"{self.ticket_id}|{self.claim_id}|{self.action_class}|{self.scheme.value}|{env}"

    def verify_hmac(self, secret: str) -> bool:
        if self.scheme != TicketScheme.LOCAL_IPC_HMAC:
            return False
        expected = hmac.new(secret.encode("utf-8"), self.body().encode("utf-8"), hashlib.sha256).hexdigest()
        return hmac.compare_digest(self.signature, expected)

    def is_sovereign_authorized(self) -> bool:
        """DELTA-03: HMAC is never sovereign/root authorization.

        A non-empty signature string is NOT Ed25519 verification. Until a real
        SOVEREIGN_ED25519_RFC8785 verifier binds this ticket, always False.
        """
        if self.scheme != TicketScheme.SOVEREIGN_ED25519_RFC8785:
            return False
        # Presence of bytes ≠ cryptographic verification.
        return False


class EpistemicFirewall:
    LOCAL_SECRET = "dclm-local-ipc-only"

    def evaluate(self, c: ClaimObject) -> FirewallResult:
        reasons: List[str] = []
        use = min(c.requested, c.taint_ceiling, key=lambda x: x.value)
        state = FirewallState.ALLOW

        if c.hallucinated or c.self_citing or not c.integrity_ok or not c.merkle_ok:
            return FirewallResult(c.claim_id, FirewallState.BLOCK, PermittedUse.NO_USE, ["integrity_or_self_cite"])
        if c.contradiction:
            return FirewallResult(c.claim_id, FirewallState.UNRESOLVED, PermittedUse.ANALYSIS_ONLY, ["symmetric_contradiction"])
        if not c.provenance_ok:
            return FirewallResult(c.claim_id, FirewallState.REQUIRES_EVIDENCE, PermittedUse.NO_USE, ["provenance_missing"])
        if not c.measurement_ok:
            return FirewallResult(c.claim_id, FirewallState.BLOCK, PermittedUse.NO_USE, ["measurement_fail"])
        if not c.fresh:
            use = PermittedUse.REFERENCE_ONLY
            state = FirewallState.LIMIT
            reasons.append("stale")
        if c.population == "GENERAL_POPULATION" and c.validation != "EXTERNAL_GROUND_TRUTH":
            use = min(use, PermittedUse.LIMIT and PermittedUse.REFERENCE_ONLY, key=lambda x: x.value)
            use = PermittedUse.REFERENCE_ONLY if use.value > PermittedUse.REFERENCE_ONLY.value else use
            state = FirewallState.LIMIT
            reasons.append("instance_not_population")

        # DELTA-02: dependence / correlation is not causality.
        if c.causal_scope == CausalScope.CORRELATIVE and not c.causal_mechanism:
            if use.value > PermittedUse.DECISION_SUPPORT.value:
                use = PermittedUse.DECISION_SUPPORT
            state = FirewallState.LIMIT
            reasons.append("correlation_is_not_causality")
        if c.causal_scope == CausalScope.CAUSAL_DEMONSTRATED and not c.causal_mechanism:
            return FirewallResult(
                c.claim_id,
                FirewallState.BLOCK,
                PermittedUse.NO_USE,
                ["causal_promotion_without_mechanism"],
            )

        if c.operator_override and c.origin == "HUMAN_DERIVED":
            # Operator override is a CLAIM, not PRODUCTION_CRITICAL authority.
            return FirewallResult(
                c.claim_id,
                FirewallState.REQUIRES_AUTHORIZATION,
                PermittedUse.NO_USE,
                ["operator_override_is_claim_not_authority"],
            )

        if state == FirewallState.ALLOW and use.value <= PermittedUse.MODEL_INPUT.value:
            pass
        elif state == FirewallState.ALLOW and use.value >= PermittedUse.AUTOMATED_ACTION.value:
            state = FirewallState.REQUIRES_AUTHORIZATION
            reasons.append("action_needs_ticket")

        return FirewallResult(c.claim_id, state, use, reasons or ["ok"])

    def issue_local_ticket(self, claim_id: str, action_class: str, envelope: Dict[str, Any]) -> ActionCapabilityTicket:
        tid = hashlib.sha256(f"{claim_id}|{action_class}".encode()).hexdigest()[:16]
        ticket = ActionCapabilityTicket(
            ticket_id=tid,
            claim_id=claim_id,
            action_class=action_class,
            scheme=TicketScheme.LOCAL_IPC_HMAC,
            envelope=envelope,
            signature="",
        )
        sig = hmac.new(self.LOCAL_SECRET.encode(), ticket.body().encode(), hashlib.sha256).hexdigest()
        return dataclasses.replace(ticket, signature=sig)

    def authorize_action(self, ticket: ActionCapabilityTicket, want_sovereign: bool) -> FirewallState:
        if want_sovereign:
            if ticket.scheme == TicketScheme.LOCAL_IPC_HMAC:
                return FirewallState.PERMISSION_ERROR
            # Ed25519 verify not implemented — never ALLOW on scheme+sig presence.
            if not ticket.is_sovereign_authorized():
                return FirewallState.REQUIRES_AUTHORIZATION
            return FirewallState.REQUIRES_AUTHORIZATION
        if not ticket.verify_hmac(self.LOCAL_SECRET):
            return FirewallState.SIGNATURE_INVALID
        # Local IPC HMAC may proceed for non-sovereign IPC only — not production authority.
        return FirewallState.ALLOW
