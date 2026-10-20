import unittest

from autonomy.adapters import AdapterCapabilities, ExecutionResult
from autonomy.orchestrator import AuthorizationDecision, Orchestrator
from autonomy.supervisor import JobState


class FakeAdapter:
    def __init__(self, *, official=True, required_scopes=frozenset({"repo:read"}), raises=False, describe_raises=False):
        self.official = official
        self.required_scopes = required_scopes
        self.raises = raises
        self.describe_raises = describe_raises
        self.calls = 0

    def describe(self):
        if self.describe_raises:
            raise RuntimeError("provider metadata unavailable")
        return AdapterCapabilities(
            provider="test-provider", capabilities=frozenset({"read"}),
            required_scopes=self.required_scopes, official_api=self.official,
            terms_version="test-terms-v1",
        )

    def execute(self, request):
        self.calls += 1
        if self.raises:
            raise RuntimeError("outcome uncertain")
        return ExecutionResult(
            success=True, result={"ok": True}, evidence_digest="a" * 64
        )


def approved_gate(job_id, task_type, scopes):
    return AuthorizationDecision(
        approved=True, task_id=job_id, authority_id="owner-approval-1",
        allowed_scopes=scopes, policy_version="trinity-test-v1",
        owner_terms_accepted=True,
    )


class OrchestratorTests(unittest.TestCase):
    def test_malformed_policy_gate_results_fail_closed_without_adapter_calls(self):
        for bad_result in (None, {"approved": True}, object()):
            with self.subTest(result_type=type(bad_result).__name__):
                adapter = FakeAdapter()
                result = Orchestrator(policy_gate=lambda *_args, value=bad_result: value).run_once(
                    task_type="read", payload={}, idempotency_key="bad-" + type(bad_result).__name__,
                    adapter=adapter, required_scopes=frozenset({"repo:read"}),
                )
                self.assertFalse(result.executed)
                self.assertEqual(result.reason, "authorization_decision_invalid")
                self.assertEqual(adapter.calls, 0)

    def test_malformed_decision_fields_fail_closed(self):
        def malformed(job_id, task_type, scopes):
            return AuthorizationDecision(
                approved=1, task_id=job_id, authority_id="owner",
                allowed_scopes=scopes, policy_version="v1", owner_terms_accepted=True,
            )
        adapter = FakeAdapter()
        result = Orchestrator(policy_gate=malformed).run_once(
            task_type="read", payload={}, idempotency_key="malformed-fields",
            adapter=adapter, required_scopes=frozenset({"repo:read"}),
        )
        self.assertEqual(result.reason, "authorization_decision_malformed")
        self.assertEqual(adapter.calls, 0)

    def test_malformed_adapter_description_fails_closed(self):
        class MalformedAdapter(FakeAdapter):
            def describe(self):
                return None
        adapter = MalformedAdapter()
        result = Orchestrator(policy_gate=approved_gate).run_once(
            task_type="read", payload={}, idempotency_key="bad-capabilities",
            adapter=adapter, required_scopes=frozenset({"repo:read"}),
        )
        self.assertEqual(result.reason, "adapter_capability_contract_invalid")
        self.assertEqual(adapter.calls, 0)

    def test_missing_policy_gate_fails_closed(self):
        adapter = FakeAdapter()
        result = Orchestrator().run_once(
            task_type="read", payload={}, idempotency_key="a",
            adapter=adapter, required_scopes=frozenset({"repo:read"}),
        )
        self.assertFalse(result.executed)
        self.assertEqual(result.reason, "policy_gate_unavailable")
        self.assertEqual(adapter.calls, 0)

    def test_approved_path_executes_and_records_evidence(self):
        adapter = FakeAdapter()
        orchestrator = Orchestrator(policy_gate=approved_gate)
        result = orchestrator.run_once(
            task_type="read", payload={}, idempotency_key="b",
            adapter=adapter, required_scopes=frozenset({"repo:read"}),
        )
        self.assertTrue(result.executed)
        self.assertTrue(result.result.success)
        self.assertEqual(result.job.state, JobState.SUCCEEDED)
        self.assertTrue(result.job.result_digest)
        self.assertTrue(orchestrator.supervisor.ledger.verify())

    def test_unofficial_adapter_is_never_called(self):
        adapter = FakeAdapter(official=False)
        result = Orchestrator(policy_gate=approved_gate).run_once(
            task_type="read", payload={}, idempotency_key="c",
            adapter=adapter, required_scopes=frozenset({"repo:read"}),
        )
        self.assertFalse(result.executed)
        self.assertEqual(result.reason, "official_adapter_required")
        self.assertEqual(adapter.calls, 0)

    def test_missing_terms_acceptance_blocks_execution(self):
        def no_terms(job_id, task_type, scopes):
            return AuthorizationDecision(
                approved=True, task_id=job_id, authority_id="owner-approval-2",
                allowed_scopes=scopes, policy_version="trinity-test-v1",
                owner_terms_accepted=False,
            )
        adapter = FakeAdapter()
        result = Orchestrator(policy_gate=no_terms).run_once(
            task_type="read", payload={}, idempotency_key="d",
            adapter=adapter, required_scopes=frozenset({"repo:read"}),
        )
        self.assertFalse(result.executed)
        self.assertEqual(adapter.calls, 0)

    def test_excess_scope_grant_blocks_execution(self):
        def excess_scope(job_id, task_type, scopes):
            return AuthorizationDecision(
                approved=True, task_id=job_id, authority_id="owner-approval-extra",
                allowed_scopes=frozenset({"repo:read", "admin:all"}),
                policy_version="trinity-test-v1", owner_terms_accepted=True,
            )
        adapter = FakeAdapter()
        result = Orchestrator(policy_gate=excess_scope).run_once(
            task_type="read", payload={}, idempotency_key="extra",
            adapter=adapter, required_scopes=frozenset({"repo:read"}),
        )
        self.assertFalse(result.executed)
        self.assertEqual(adapter.calls, 0)

    def test_wrong_task_grant_blocks_execution(self):
        def wrong_task(job_id, task_type, scopes):
            return AuthorizationDecision(
                approved=True, task_id="different-job", authority_id="owner-approval-3",
                allowed_scopes=scopes, policy_version="trinity-test-v1",
                owner_terms_accepted=True,
            )
        adapter = FakeAdapter()
        result = Orchestrator(policy_gate=wrong_task).run_once(
            task_type="read", payload={}, idempotency_key="e",
            adapter=adapter, required_scopes=frozenset({"repo:read"}),
        )
        self.assertFalse(result.executed)
        self.assertEqual(adapter.calls, 0)

    def test_replay_does_not_execute_same_job_twice(self):
        adapter = FakeAdapter()
        orchestrator = Orchestrator(policy_gate=approved_gate)
        first = orchestrator.run_once(
            task_type="read", payload={}, idempotency_key="same",
            adapter=adapter, required_scopes=frozenset({"repo:read"}),
        )
        second = orchestrator.run_once(
            task_type="read", payload={}, idempotency_key="same",
            adapter=adapter, required_scopes=frozenset({"repo:read"}),
        )
        self.assertTrue(first.executed)
        self.assertFalse(second.executed)
        self.assertEqual(second.reason, "idempotent_replay_existing_job")
        self.assertEqual(adapter.calls, 1)

    def test_adapter_description_failure_blocks_before_execute(self):
        adapter = FakeAdapter(describe_raises=True)
        result = Orchestrator(policy_gate=approved_gate).run_once(
            task_type="read", payload={}, idempotency_key="describe-error",
            adapter=adapter, required_scopes=frozenset({"repo:read"}),
        )
        self.assertFalse(result.executed)
        self.assertEqual(result.reason, "adapter_description_unavailable")
        self.assertEqual(adapter.calls, 0)

    def test_unknown_adapter_exception_is_not_retried(self):
        adapter = FakeAdapter(raises=True)
        result = Orchestrator(policy_gate=approved_gate).run_once(
            task_type="write", payload={}, idempotency_key="f",
            adapter=adapter, required_scopes=frozenset({"repo:read"}),
        )
        self.assertFalse(result.executed)
        self.assertEqual(result.reason, "adapter_outcome_unknown")
        self.assertEqual(result.job.state, JobState.BLOCKED)
        self.assertEqual(adapter.calls, 1)


if __name__ == "__main__":
    unittest.main()
