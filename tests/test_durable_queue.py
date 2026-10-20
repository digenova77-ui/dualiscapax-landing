import tempfile
import unittest
from pathlib import Path

from autonomy.durable_queue import MAX_PAYLOAD_BYTES, SQLiteJobQueue


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


    def test_payload_must_be_a_json_object(self):
        with self.assertRaises(ValueError):
            self.queue.enqueue("inspect", ["not", "an", "object"], idempotency_key="payload-array")

    def test_nonfinite_payload_values_are_rejected(self):
        with self.assertRaises(ValueError):
            self.queue.enqueue("inspect", {"number": float("nan")}, idempotency_key="payload-nan")

    def test_oversized_payload_is_rejected(self):
        with self.assertRaises(ValueError):
            self.queue.enqueue(
                "inspect", {"data": "x" * MAX_PAYLOAD_BYTES},
                idempotency_key="payload-large",
            )

    def test_control_characters_and_unbounded_identifiers_are_rejected(self):
        with self.assertRaises(ValueError):
            self.queue.enqueue("inspect\nrun", {}, idempotency_key="bad-task")
        with self.assertRaises(ValueError):
            self.queue.enqueue("inspect", {}, idempotency_key="x" * 257)

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


    def test_live_lease_can_be_renewed_by_owner(self):
        job = self.queue.enqueue("inspect", {}, idempotency_key="renew")
        claimed = self.queue.claim("worker-a", now=100, lease_seconds=5)
        renewed = self.queue.renew_lease(job.job_id, "worker-a", now=104, lease_seconds=20)
        self.assertEqual(renewed.lease_owner, "worker-a")
        self.assertEqual(renewed.lease_until, 124)
        done = self.queue.complete(job.job_id, "worker-a", success=True, now=123)
        self.assertEqual(done.state, "succeeded")

    def test_wrong_worker_cannot_renew_lease(self):
        job = self.queue.enqueue("inspect", {}, idempotency_key="renew-owner")
        self.queue.claim("worker-a", now=100, lease_seconds=10)
        with self.assertRaises(PermissionError):
            self.queue.renew_lease(job.job_id, "worker-b", now=101, lease_seconds=20)

    def test_expired_lease_cannot_be_resurrected(self):
        job = self.queue.enqueue("inspect", {}, idempotency_key="renew-expired")
        self.queue.claim("worker-a", now=100, lease_seconds=5)
        with self.assertRaises(PermissionError):
            self.queue.renew_lease(job.job_id, "worker-a", now=105, lease_seconds=20)

    def test_lease_renewal_duration_is_bounded(self):
        job = self.queue.enqueue("inspect", {}, idempotency_key="renew-bound")
        self.queue.claim("worker-a", now=100, lease_seconds=5)
        with self.assertRaises(ValueError):
            self.queue.renew_lease(job.job_id, "worker-a", now=101, lease_seconds=3601)


    def test_queued_job_can_be_cancelled_without_claim(self):
        job = self.queue.enqueue("inspect", {}, idempotency_key="cancel-queued")
        cancelled = self.queue.request_cancel(job.job_id)
        self.assertEqual(cancelled.state, "cancelled")
        self.assertIsNone(self.queue.claim("worker-a", now=100))
        self.assertTrue(self.queue.is_cancel_requested(job.job_id))

    def test_running_job_requires_cooperative_cancel_acknowledgement(self):
        job = self.queue.enqueue("inspect", {}, idempotency_key="cancel-running")
        self.queue.claim("worker-a", now=100, lease_seconds=30)
        requested = self.queue.request_cancel(job.job_id)
        self.assertEqual(requested.state, "cancel_requested")
        self.assertTrue(self.queue.is_cancel_requested(job.job_id))
        with self.assertRaises(PermissionError):
            self.queue.acknowledge_cancel(job.job_id, "worker-b", now=101)
        cancelled = self.queue.acknowledge_cancel(job.job_id, "worker-a", now=101)
        self.assertEqual(cancelled.state, "cancelled")
        self.assertIsNone(cancelled.lease_owner)

    def test_expired_cancel_request_is_recovered_as_cancelled(self):
        job = self.queue.enqueue("inspect", {}, idempotency_key="cancel-crash")
        self.queue.claim("worker-a", now=100, lease_seconds=5)
        self.queue.request_cancel(job.job_id)
        self.assertIsNone(self.queue.claim("worker-b", now=106))
        self.assertEqual(self.queue.get(job.job_id).state, "cancelled")

    def test_terminal_job_cannot_be_cancelled(self):
        job = self.queue.enqueue("inspect", {}, idempotency_key="cancel-terminal")
        self.queue.claim("worker-a", now=100, lease_seconds=30)
        self.queue.complete(job.job_id, "worker-a", success=True, now=101)
        with self.assertRaises(ValueError):
            self.queue.request_cancel(job.job_id)

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
