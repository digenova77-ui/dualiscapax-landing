"""Iris port. Capability exists ≠ authorized ≠ invoked ≠ executed."""
from __future__ import annotations


class IrisPort:
    available = True
    authorized = False

    def invoke(self, *_a, **_k):
        return {
            "invocation": "INVOCATION_BLOCKED",
            "execution": None,
            "status": "INVOCATION_BLOCKED",
            "reason": "iris_port_has_no_authorized_delegation",
            "authority_effect": "NONE",
        }
