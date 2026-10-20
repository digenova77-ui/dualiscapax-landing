import unittest

from autonomy.provisioning import (
    ProvisionedIdentity, ProvisioningRequest, ProvisioningStatus,
    plan_provisioning, provision_service_identity,
)


class FakeProvisioner:
    def __init__(self, *, provider="official-example", scopes=frozenset({"repo:read"})):
        self.provider = provider
        self.scopes = scopes
        self.calls = 0

    def create_service_identity(self, plan):
        self.calls += 1
        return ProvisionedIdentity(
            provider=self.provider, identity_id="machine-123",
            granted_scopes=self.scopes, external_reference="provider-service-account-123",
        )


def request(**overrides):
    values = dict(
        provider="official-example", purpose="read repository build evidence",
        required_scopes=frozenset({"repo:read"}), idempotency_key="provision-once",
        supports_service_accounts=True, official_provisioning_api=True,
        terms_version="terms-v3", owner_approved=True, owner_terms_accepted=True,
        approval_id="owner-approval-123",
    )
    values.update(overrides)
    return ProvisioningRequest(**values)


class ProvisioningTests(unittest.TestCase):
    def test_approved_official_service_account_can_be_provisioned(self):
        plan = plan_provisioning(request())
        self.assertEqual(plan.status, ProvisioningStatus.READY)
        provisioner = FakeProvisioner()
        identity = provision_service_identity(plan, provisioner)
        self.assertEqual(identity.identity_id, "machine-123")
        self.assertEqual(provisioner.calls, 1)

    def test_missing_owner_approval_never_calls_provider(self):
        plan = plan_provisioning(request(owner_approved=False))
        provisioner = FakeProvisioner()
        with self.assertRaises(PermissionError):
            provision_service_identity(plan, provisioner)
        self.assertEqual(provisioner.calls, 0)

    def test_arbitrary_signup_without_official_service_account_api_is_blocked(self):
        plan = plan_provisioning(request(
            supports_service_accounts=False, official_provisioning_api=False,
        ))
        self.assertEqual(plan.status, ProvisioningStatus.UNSUPPORTED)
        provisioner = FakeProvisioner()
        with self.assertRaises(PermissionError):
            provision_service_identity(plan, provisioner)
        self.assertEqual(provisioner.calls, 0)

    def test_terms_must_be_explicitly_accepted_by_owner(self):
        plan = plan_provisioning(request(owner_terms_accepted=False))
        self.assertEqual(plan.status, ProvisioningStatus.REQUIRES_OWNER)

    def test_provider_cannot_grant_excess_scopes(self):
        plan = plan_provisioning(request())
        provisioner = FakeProvisioner(scopes=frozenset({"repo:read", "admin:all"}))
        with self.assertRaises(PermissionError):
            provision_service_identity(plan, provisioner)
        self.assertEqual(provisioner.calls, 1)

    def test_provider_mismatch_is_rejected(self):
        plan = plan_provisioning(request())
        provisioner = FakeProvisioner(provider="unexpected-provider")
        with self.assertRaises(PermissionError):
            provision_service_identity(plan, provisioner)


if __name__ == "__main__":
    unittest.main()
