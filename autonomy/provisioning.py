"""Provider-approved machine service identity provisioning contract.

Only official programmatic service-account flows are eligible. This module never
automates arbitrary consumer signup, bypasses identity checks, or handles secrets.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol


class ProvisioningStatus(str, Enum):
    READY = "ready"
    REQUIRES_OWNER = "requires_owner"
    UNSUPPORTED = "unsupported"


@dataclass(frozen=True)
class ProvisioningRequest:
    provider: str
    purpose: str
    required_scopes: frozenset[str]
    idempotency_key: str
    supports_service_accounts: bool
    official_provisioning_api: bool
    terms_version: str
    owner_approved: bool = False
    owner_terms_accepted: bool = False
    approval_id: str = ""


@dataclass(frozen=True)
class ProvisioningPlan:
    status: ProvisioningStatus
    provider: str
    purpose: str
    required_scopes: frozenset[str]
    idempotency_key: str
    terms_version: str
    approval_id: str
    reason: str


@dataclass(frozen=True)
class ProvisionedIdentity:
    provider: str
    identity_id: str
    granted_scopes: frozenset[str]
    external_reference: str


class ServiceIdentityProvisioner(Protocol):
    def create_service_identity(self, plan: ProvisioningPlan) -> ProvisionedIdentity:
        """Call the provider's official provisioning API; never return secret material."""
        ...


def plan_provisioning(request: ProvisioningRequest) -> ProvisioningPlan:
    if not request.provider.strip() or not request.purpose.strip() or not request.idempotency_key.strip():
        return ProvisioningPlan(
            ProvisioningStatus.REQUIRES_OWNER, request.provider, request.purpose,
            request.required_scopes, request.idempotency_key, request.terms_version,
            request.approval_id, "provider_purpose_and_idempotency_key_required",
        )
    if not request.supports_service_accounts or not request.official_provisioning_api:
        return ProvisioningPlan(
            ProvisioningStatus.UNSUPPORTED, request.provider, request.purpose,
            request.required_scopes, request.idempotency_key, request.terms_version,
            request.approval_id, "official_service_account_api_required",
        )
    if not request.terms_version.strip():
        return ProvisioningPlan(
            ProvisioningStatus.REQUIRES_OWNER, request.provider, request.purpose,
            request.required_scopes, request.idempotency_key, request.terms_version,
            request.approval_id, "provider_terms_version_unverified",
        )
    if not request.owner_approved or not request.owner_terms_accepted or not request.approval_id.strip():
        return ProvisioningPlan(
            ProvisioningStatus.REQUIRES_OWNER, request.provider, request.purpose,
            request.required_scopes, request.idempotency_key, request.terms_version,
            request.approval_id, "explicit_owner_approval_and_terms_acceptance_required",
        )
    return ProvisioningPlan(
        ProvisioningStatus.READY, request.provider, request.purpose,
        request.required_scopes, request.idempotency_key, request.terms_version,
        request.approval_id, "",
    )


def provision_service_identity(
    plan: ProvisioningPlan, provisioner: ServiceIdentityProvisioner
) -> ProvisionedIdentity:
    """Provision only an explicitly approved plan through an injected official adapter."""
    if plan.status is not ProvisioningStatus.READY:
        raise PermissionError(f"provisioning blocked: {plan.reason or plan.status.value}")
    identity = provisioner.create_service_identity(plan)
    if identity.provider != plan.provider:
        raise PermissionError("provider identity mismatch")
    if not identity.identity_id.strip() or not identity.external_reference.strip():
        raise ValueError("provider returned incomplete identity metadata")
    if not identity.granted_scopes.issubset(plan.required_scopes):
        raise PermissionError("provider granted scopes exceed approved least-privilege scopes")
    if not plan.required_scopes.issubset(identity.granted_scopes):
        raise PermissionError("provider did not grant all required scopes")
    return identity
