import unittest

from autonomy.supervisor import JobState, Supervisor


class SupervisorTests(unittest.TestCase):
    def test_submit_is_idempotent(self):
        supervisor = Supervisor()
        first = supervisor.submit("test", {"x": 1}, idempotency_key="once")
        second = supervisor.submit("test", {"x": 1}, idempotency_key="once")
        self.assertEqual(first.job_id, second.job_id)
        self.assertEqual(len(supervisor.jobs), 1)

    def test_reusing_key_for_different_payload_is_rejected(self):
        supervisor = Supervisor()
        supervisor.submit("test", {"x": 1}, idempotency_key="once")
        with self.assertRaises(ValueError):
            supervisor.submit("test", {"x": 2}, idempotency_key="once")

    def test_missing_authorization_blocks_before_running(self):
        supervisor = Supervisor()
        job = supervisor.submit("write", {"target": "repo"}, idempotency_key="job")
        blocked = supervisor.start(job.job_id, authorized=False)
        self.assertEqual(blocked.state, JobState.BLOCKED)
        self.assertEqual(blocked.attempts, 0)

    def test_retry_count_is_bounded_and_recorded(self):
        supervisor = Supervisor()
        job = supervisor.submit("read", {}, idempotency_key="retry", max_attempts=2)
        running = supervisor.start(job.job_id, authorized=True)
        retry = supervisor.finish(running.job_id, success=False)
        self.assertEqual(retry.state, JobState.RETRYABLE_FAILURE)
        running = supervisor.start(retry.job_id, authorized=True)
        exhausted = supervisor.finish(running.job_id, success=False)
        self.assertEqual(exhausted.state, JobState.EXHAUSTED)
        with self.assertRaises(ValueError):
            supervisor.start(exhausted.job_id, authorized=True)
        self.assertTrue(supervisor.ledger.verify())

    def test_success_records_result_digest(self):
        supervisor = Supervisor()
        job = supervisor.submit("read", {}, idempotency_key="success")
        running = supervisor.start(job.job_id, authorized=True)
        done = supervisor.finish(running.job_id, success=True, result={"ok": True})
        self.assertEqual(done.state, JobState.SUCCEEDED)
        self.assertEqual(len(done.result_digest), 64)
        self.assertTrue(supervisor.ledger.verify())


if __name__ == "__main__":
    unittest.main()
