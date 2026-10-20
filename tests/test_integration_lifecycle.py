import unittest

from autonomy.integration_lifecycle import IntegrationRequest, State, transition


class IntegrationLifecycleTests(unittest.TestCase):
    def setUp(self):
        self.request = IntegrationRequest(
            provider="official-example",
            requested_scopes=frozenset({"profile:read", "issues:write"}),
        )

    def test_happy_path_requires_owner_consent_and_verified_oauth(self):
        request = transition(self.request, State.CONSENT_REQUIRED)
        request = transition(
            request, State.AUTHORIZED, owner_approved=True,
            official_flow=True, terms_accepted_by_owner=True,
        )
        request = transition(
            request, State.CONNECTED, official_flow=True, oauth_verified=True,
            granted_scopes=frozenset({"profile:read", "issues:write"}),
        )
        self.assertEqual(request.state, State.CONNECTED)

    def test_agent_cannot_self_authorize(self):
        request = transition(self.request, State.CONSENT_REQUIRED)
        with self.assertRaises(PermissionError):
            transition(
                request, State.AUTHORIZED, owner_approved=False,
                official_flow=True, terms_accepted_by_owner=True,
            )

    def test_unofficial_flow_is_blocked(self):
        request = transition(self.request, State.CONSENT_REQUIRED)
        with self.assertRaises(PermissionError):
            transition(
                request, State.AUTHORIZED, owner_approved=True,
                official_flow=False, terms_accepted_by_owner=True,
            )

    def test_excess_scopes_are_blocked(self):
        request = transition(self.request, State.CONSENT_REQUIRED)
        request = transition(
            request, State.AUTHORIZED, owner_approved=True,
            official_flow=True, terms_accepted_by_owner=True,
        )
        with self.assertRaises(PermissionError):
            transition(
                request, State.CONNECTED, official_flow=True, oauth_verified=True,
                granted_scopes=frozenset({"profile:read", "issues:write", "admin:all"}),
            )

    def test_revoked_and_blocked_states_are_terminal(self):
        blocked = transition(self.request, State.BLOCKED)
        with self.assertRaises(ValueError):
            transition(blocked, State.CONSENT_REQUIRED)
        request = transition(self.request, State.CONSENT_REQUIRED)
        request = transition(
            request, State.AUTHORIZED, owner_approved=True,
            official_flow=True, terms_accepted_by_owner=True,
        )
        request = transition(
            request, State.CONNECTED, official_flow=True, oauth_verified=True,
            granted_scopes=frozenset({"profile:read", "issues:write"}),
        )
        revoked = transition(request, State.REVOKED)
        with self.assertRaises(ValueError):
            transition(revoked, State.CONNECTED)


if __name__ == "__main__":
    unittest.main()
