"""Small fail-closed state machine for service integration requests.

No network calls, account creation, OAuth exchange, or credential handling occur here.
"""
from dataclasses import dataclass
from enum import Enum
from typing import FrozenSet


class State(str, Enum):
    DISCOVERED = "discovered"
    CONSENT_REQUIRED = "consent_required"
    AUTHORIZED = "authorized"
    CONNECTED = "connected"
    REVOKED = "revoked"
    BLOCKED = "blocked"


@dataclass(frozen=True)
class IntegrationRequest:
    provider: str
    requested_scopes: FrozenSet[str]
    state: State = State.DISCOVERED
    granted_scopes: FrozenSet[str] = frozenset()


def transition(
    request: IntegrationRequest,
    target: State,
    *,
    owner_approved: bool = False,
    official_flow: bool = False,
    terms_accepted_by_owner: bool = False,
    oauth_verified: bool = False,
    granted_scopes: FrozenSet[str] = frozenset(),
) -> IntegrationRequest:
    """Validate one state transition; missing authority always refuses."""
    if request.state in {State.REVOKED, State.BLOCKED}:
        raise ValueError(f"terminal state cannot transition: {request.state.value}")

    if target == State.BLOCKED:
        return IntegrationRequest(
            request.provider, request.requested_scopes, State.BLOCKED
        )

    if request.state == State.DISCOVERED and target == State.CONSENT_REQUIRED:
        return IntegrationRequest(
            request.provider, request.requested_scopes, State.CONSENT_REQUIRED
        )

    if request.state == State.CONSENT_REQUIRED and target == State.AUTHORIZED:
        if not (owner_approved and official_flow and terms_accepted_by_owner):
            raise PermissionError("owner approval, official flow, and owner terms acceptance required")
        return IntegrationRequest(
            request.provider, request.requested_scopes, State.AUTHORIZED
        )

    if request.state == State.AUTHORIZED and target == State.CONNECTED:
        if not official_flow or not oauth_verified:
            raise PermissionError("verified provider-supported authorization required")
        if not granted_scopes.issubset(request.requested_scopes):
            raise PermissionError("provider granted scopes exceed requested least-privilege scope")
        if not request.requested_scopes.issubset(granted_scopes):
            raise PermissionError("required scopes were not granted; do not silently expand access")
        return IntegrationRequest(
            request.provider, request.requested_scopes, State.CONNECTED, granted_scopes
        )

    if request.state == State.CONNECTED and target == State.REVOKED:
        return IntegrationRequest(
            request.provider, request.requested_scopes, State.REVOKED
        )

    raise ValueError(f"invalid transition: {request.state.value} -> {target.value}")
