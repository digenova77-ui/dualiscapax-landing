import tempfile
import unittest
from pathlib import Path

from autonomy.durable_queue import SQLiteJobQueue


class DurableQueueTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.queue = SQLiteJobQueue(Path(self.temp.name) / "jobs.sqlite3")

    def test_enqueue_is_idempotent_and_persistent(self):
        first = self.queue.enqueue("inspect", {"path": "README.md"}, idempotency_key="one")
        second = self.queue.enqueue("inspect", {"path": "README.md"}, idempotency_key="one")
        self.assertEqual(first.job_id, second.job_id)
        reopened = SQLiteJobQueue(Path(self.temp.name) / "jobs.sqlite3")
        self.assertEqual(reopened.get(first.job_id).state, "queued")

    def test_idempotency_key_cannot_change_payload(self):
        self.queue.enqueue("inspect", {"path": "a"}, idempotency_key="same")
        with self.assertRaises(ValueError):
            self.queue.enqueue("inspect", {"path": "b"}, idempotency_key="same")

    def test_only_one_worker_claims_a_queued_job(self):
        self.queue.enqueue("inspect", {}, idempotency_key="claim")
        first = self.queue.claim("worker-a", now=100, lease_seconds=30)
        second = self.queue.claim("worker-b", now=100, lease_seconds=30)
        self.assertEqual(first.state, "running")
        self.assertEqual(first.lease_owner, "worker-a")
        self.assertIsNone(second)

    def test_lease_owner_and_expiry_are_enforced(self):
        job = self.queue.enqueue("inspect", {}, idempotency_key="lease")
        claimed = self.queue.claim("worker-a", now=100, lease_seconds=10)
        with self.assertRaises(PermissionError):
            self.queue.complete(job.job_id, "worker-b", success=True, now=101)
        with self.assertRaises(PermissionError):
            self.queue.complete(job.job_id, "worker-a", success=True, now=110)
        self.assertEqual(claimed.state, "running")

    def test_expired_lease_is_reclaimed_with_bounded_attempts(self):
        job = self.queue.enqueue("inspect", {}, idempotency_key="retry", max_attempts=2)
        first = self.queue.claim("worker-a", now=100, lease_seconds=5)
        second = self.queue.claim("worker-b", now=106, lease_seconds=5)
        self.assertEqual(first.job_id, job.job_id)
        self.assertEqual(second.job_id, job.job_id)
        self.assertEqual(second.attempts, 2)
        exhausted = self.queue.claim("worker-c", now=112, lease_seconds=5)
        self.assertIsNone(exhausted)
        self.assertEqual(self.queue.get(job.job_id).state, "exhausted")

    def test_nonretryable_failure_blocks_and_success_completes(self):
        blocked_job = self.queue.enqueue("write", {}, idempotency_key="block")
        running = self.queue.claim("worker", now=100, lease_seconds=30)
        blocked = self.queue.complete(blocked_job.job_id, "worker", success=False, retryable=False, now=101)
        self.assertEqual(blocked.state, "blocked")

        success_job = self.queue.enqueue("read", {}, idempotency_key="success")
        running2 = self.queue.claim("worker", now=200, lease_seconds=30)
        self.assertEqual(running2.job_id, success_job.job_id)
        done = self.queue.complete(success_job.job_id, "worker", success=True, now=201)
        self.assertEqual(done.state, "succeeded")


if __name__ == "__main__":
    unittest.main()
