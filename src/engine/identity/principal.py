"""Explicit principal. Email is metadata. unbound@local is not an identity."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class Principal:
    principal_id: str
    issuer: str
    subject: str
    tenant: str
    authority_status: str
    issued_at: str
    expires_at: Optional[str]
    revocation_epoch: int
    email: Optional[str] = None

    def is_active(self, now: str, current_epoch: int) -> bool:
        if self.authority_status != "ACTIVE":
            return False
        if self.expires_at and now >= self.expires_at:
            return False
        if current_epoch != self.revocation_epoch and current_epoch > self.revocation_epoch:
            return self.authority_status == "ACTIVE" and current_epoch == self.revocation_epoch
        return True


class PrincipalRegistry:
    def __init__(self) -> None:
        self._by_id = {}
        self.epoch = 1

    def issue(self, principal: Principal) -> Principal:
        if principal.principal_id == "unbound@local":
            raise ValueError("FALLBACK_PRINCIPAL_FORBIDDEN")
        if not principal.principal_id:
            raise ValueError("MISSING_PRINCIPAL")
        p = Principal(**{**principal.__dict__, "revocation_epoch": self.epoch})
        self._by_id[p.principal_id] = p
        return p

    def revoke(self, principal_id: str) -> None:
        self.epoch += 1
        if principal_id in self._by_id:
            self._by_id[principal_id].authority_status = "REVOKED"
            self._by_id[principal_id].revocation_epoch = self.epoch

    def get(self, principal_id: str) -> Optional[Principal]:
        return self._by_id.get(principal_id)

    def authorize_cross(self, actor_id: str, resource_owner_id: str, now: str) -> dict:
        actor = self.get(actor_id)
        owner = self.get(resource_owner_id)
        if actor is None or owner is None:
            return {"ok": False, "decision": "UNKNOWN", "reason": "UNKNOWN_PRINCIPAL"}
        if not actor.is_active(now, self.epoch):
            return {"ok": False, "decision": "REVOKED" if actor.authority_status == "REVOKED" else "EXPIRED"}
        if actor_id != resource_owner_id:
            return {"ok": False, "decision": "DENIED", "reason": "CROSS_PRINCIPAL"}
        return {"ok": True, "decision": "AUTHORIZED"}
