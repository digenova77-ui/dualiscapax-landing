import unittest

from autonomy.affinity import Integration, Task, evaluate, rank


class AffinityTests(unittest.TestCase):
    def setUp(self):
        self.task = Task(
            required_capabilities=frozenset({"read_metrics", "create_issue"}),
            required_scopes=frozenset({"metrics:read", "issues:write"}),
            max_cost_units=10,
            allowed_side_effects=frozenset({"read", "create_issue"}),
            approval_granted=True,
        )
        self.integration = Integration(
            provider="official-example",
            capabilities=frozenset({"read_metrics", "create_issue"}),
            available_scopes=frozenset({"metrics:read", "issues:write"}),
            reliability=1.0,
            estimated_cost_units=2,
            side_effects=frozenset({"read", "create_issue"}),
            official_api=True,
            terms_compliant=True,
            connected=True,
            owner_authorized_scopes=frozenset({"metrics:read", "issues:write"}),
        )

    def test_perfect_fit_can_be_eligible_only_after_authorization(self):
        decision = evaluate(self.task, self.integration)
        self.assertEqual(decision.affinity, 99)
        self.assertTrue(decision.eligible)
        self.assertEqual(decision.reasons, ())

    def test_high_affinity_never_substitutes_for_task_approval(self):
        task = Task(
            self.task.required_capabilities,
            self.task.required_scopes,
            self.task.max_cost_units,
            self.task.allowed_side_effects,
            approval_granted=False,
        )
        decision = evaluate(task, self.integration)
        self.assertFalse(decision.eligible)
        self.assertIn("task_authorization_missing", decision.reasons)

    def test_missing_owner_scope_blocks_execution(self):
        candidate = Integration(**{
            **self.integration.__dict__,
            "owner_authorized_scopes": frozenset({"metrics:read"}),
        })
        decision = evaluate(self.task, candidate)
        self.assertFalse(decision.eligible)
        self.assertIn("owner_scope_authorization_missing", decision.reasons)

    def test_unofficial_or_noncompliant_provider_is_blocked(self):
        candidate = Integration(**{
            **self.integration.__dict__,
            "official_api": False,
            "terms_compliant": False,
        })
        decision = evaluate(self.task, candidate)
        self.assertFalse(decision.eligible)
        self.assertIn("official_integration_required", decision.reasons)
        self.assertIn("provider_terms_not_verified", decision.reasons)

    def test_undeclared_side_effect_is_blocked(self):
        candidate = Integration(**{
            **self.integration.__dict__,
            "side_effects": frozenset({"read", "create_issue", "invite_users"}),
        })
        decision = evaluate(self.task, candidate)
        self.assertFalse(decision.eligible)
        self.assertIn("side_effect_outside_task_policy", decision.reasons)

    def test_ranking_prefers_eligible_candidates(self):
        blocked = Integration(**{**self.integration.__dict__, "connected": False})
        decisions = rank(self.task, (blocked, self.integration))
        self.assertEqual(decisions[0].provider, "official-example")
        self.assertTrue(decisions[0].eligible)
        self.assertFalse(decisions[1].eligible)


if __name__ == "__main__":
    unittest.main()
