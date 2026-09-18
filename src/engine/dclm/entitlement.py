"""Entitlement mediator. Client fuel is a projection, never authority."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class FuelProjection:
    source: str
    value: Optional[float]
    authoritative: bool = False


class EntitlementMediator:
    """Fail-closed: absent server ledger ⇒ no paid capability."""

    def resolve(self, header_fuel, body_fuel, server_balance: Optional[float]):
        if header_fuel is not None and body_fuel is not None:
            try:
                if float(header_fuel) != float(body_fuel):
                    return {
                        "decision": "UNKNOWN",
                        "reason": "HEADER_BODY_FUEL_CONFLICT",
                        "tier": "OPEN",
                        "authoritative_balance": None,
                    }
            except (TypeError, ValueError):
                return {
                    "decision": "UNKNOWN",
                    "reason": "MALFORMED_FUEL",
                    "tier": "OPEN",
                    "authoritative_balance": None,
                }
        if server_balance is None:
            return {
                "decision": "INSUFFICIENT_EVIDENCE",
                "reason": "NO_SERVER_LEDGER",
                "tier": "OPEN",
                "authoritative_balance": 0.0,
                "client_claim": body_fuel if body_fuel is not None else header_fuel,
            }
        try:
            bal = float(server_balance)
        except (TypeError, ValueError):
            return {
                "decision": "UNKNOWN",
                "reason": "MALFORMED_SERVER_BALANCE",
                "tier": "OPEN",
                "authoritative_balance": None,
            }
        if bal != bal or bal in (float("inf"), float("-inf")):
            return {
                "decision": "DENIED",
                "reason": "NON_FINITE_SERVER_BALANCE",
                "tier": "OPEN",
                "authoritative_balance": None,
            }
        if bal < 0:
            return {
                "decision": "DENIED",
                "reason": "NEGATIVE_FUEL",
                "tier": "OPEN",
                "authoritative_balance": None,
            }
        return {
            "decision": "AUTHORIZED" if bal > 0 else "INSUFFICIENT_EVIDENCE",
            "reason": "SERVER_LEDGER",
            "tier": "METERED" if bal > 0 else "OPEN",
            "authoritative_balance": bal,
        }
