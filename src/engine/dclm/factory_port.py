"""Factory port. A workflow success is not downstream authorization."""
from __future__ import annotations


class FactoryPort:
    def admit_downstream(self, upstream_status: str, downstream_action: str) -> dict:
        return {
            "upstream_status": upstream_status,
            "downstream_action": downstream_action,
            "authorized": False,
            "decision": "UNKNOWN",
            "reason": "upstream_success_is_not_downstream_authority",
            "authority_effect": "NONE",
        }
