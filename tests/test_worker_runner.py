"""Fail-closed durable worker runner tests."""
import tempfile
import unittest
from pathlib import Path

from autonomy.durable_queue import SQLiteJobQueue
from autonomy.worker_runner import (
    KnownRetryableFailure,
    WorkerAuthorization,
    WorkerRunner,
)


class WorkerRunnerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.queue = SQLiteJobQueue(Path(self.temp.name) / "jobs.sqlite3")
        self.job = self.queue.enqueue(
            "inspect", {"file": "README.md"}, idempotency_key="runner-1"
        )
        self.executed = []

    def grant(self, job):
        return WorkerAuthorization(
            approved=True, task_id=job.job_id, authority_id="owner-approval-1",
            policy_version="trinity-v1", granted_scopes=frozenset({"repo:read"}),
            required_scopes=frozenset({"repo:read"}), owner_terms_accepted=True,
        )

    def runner(self, policy=None, executor=None):
        return WorkerRunner(
            queue=self.queue, worker_id="worker-a",
            policy=self.grant if policy is None else policy,
            executor=(lambda job: self.executed.append(job.job_id)) if executor is None else executor,
            lease_seconds=30,
        )

    def test_approved_job_executes_once_and_completes(self):
        outcome = self.runner().run_one(now=100)
        self.assertTrue(outcome.executed)
        self.assertEqual(outcome.job.state, "succeeded")
        self.assertEqual(self.executed, [self.job.job_id])
        self.assertIsNone(self.runner().run_one(now=101))

    def test_missing_policy_fails_closed_before_executor(self):
        outcome = self.runner(policy=None).run_one(now=100) if False else None
        runner = WorkerRunner(
            queue=self.queue, worker_id="worker-a", policy=None,
            executor=lambda job: self.executed.append(job.job_id),
        )
        outcome = runner.run_one(now=100)
        self.assertEqual(outcome.job.state, "blocked")
        self.assertEqual(outcome.reason, "policy_gate_unavailable")
        self.assertEqual(self.executed, [])

    def test_policy_exception_blocks_before_executor(self):
        def broken(_job):
            raise RuntimeError("policy backend unavailable")
        outcome = self.runner(policy=broken).run_one(now=100)
        self.assertEqual(outcome.job.state, "blocked")
        self.assertEqual(outcome.reason, "policy_gate_error")
        self.assertEqual(self.executed, [])

    def test_wrong_task_or_excess_scope_blocks(self):
        def wrong_task(job):
            grant = self.grant(job)
            return WorkerAuthorization(
                **{**grant.__dict__, "task_id": "other-task"}
            )
        outcome = self.runner(policy=wrong_task).run_one(now=100)
        self.assertEqual(outcome.job.state, "blocked")
        self.assertEqual(self.executed, [])

    def test_terms_not_accepted_blocks(self):
        def no_terms(job):
            grant = self.grant(job)
            return WorkerAuthorization(
                **{**grant.__dict__, "owner_terms_accepted": False}
            )
        outcome = self.runner(policy=no_terms).run_one(now=100)
        self.assertEqual(outcome.job.state, "blocked")
        self.assertEqual(self.executed, [])

    def test_unknown_executor_exception_is_blocked_not_retried(self):
        def uncertain(_job):
            raise RuntimeError("remote outcome uncertain")
        outcome = self.runner(executor=uncertain).run_one(now=100)
        self.assertEqual(outcome.job.state, "blocked")
        self.assertEqual(outcome.reason, "executor_outcome_unknown_manual_reconciliation_required")
        self.assertIsNone(self.queue.claim("worker-b", now=101))

    def test_retryable_failure_retries_only_when_explicitly_safe(self):
        def safe_retry(_job):
            raise KnownRetryableFailure("provider confirms no side effect", retry_safe=True)
        outcome = self.runner(executor=safe_retry).run_one(now=100)
        self.assertEqual(outcome.job.state, "retryable_failure")
        self.assertIsNotNone(self.queue.claim("worker-b", now=101))

    def test_retryable_exception_without_safety_proof_is_blocked(self):
        def unsafe_retry(_job):
            raise KnownRetryableFailure("timeout", retry_safe=False)
        outcome = self.runner(executor=unsafe_retry).run_one(now=100)
        self.assertEqual(outcome.job.state, "blocked")
        self.assertIsNone(self.queue.claim("worker-b", now=101))

    def test_cancellation_during_policy_prevents_execution(self):
        def cancel_in_policy(job):
            self.queue.request_cancel(job.job_id)
            return self.grant(job)
        outcome = self.runner(policy=cancel_in_policy).run_one(now=100)
        self.assertEqual(outcome.job.state, "cancelled")
        self.assertEqual(self.executed, [])

    def test_invalid_authorization_type_fails_closed(self):
        outcome = self.runner(policy=lambda _job: {"approved": True}).run_one(now=100)
        self.assertEqual(outcome.job.state, "blocked")
        self.assertEqual(self.executed, [])


if __name__ == "__main__":
    unittest.main()
