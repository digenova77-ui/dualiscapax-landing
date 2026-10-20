"""Fail-closed worker runner for the durable queue.

This is a synchronous reference runner, not an OS sandbox or background daemon.
The caller must supply a real authorization gate and an executor with its own
provider-side idempotency and scope enforcement. Unknown exceptions are blocked,
never retried automatically.
"""
from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Callable, Optional
import time

from autonomy.durable_queue import QueueJob, SQLiteJobQueue


@dataclass(frozen=True)
class WorkerAuthorization:
    approved: bool
    task_id: str
    authority_id: str
    policy_version: str
    granted_scopes: frozenset[str]
    required_scopes: frozenset[str]
    owner_terms_accepted: bool
    reason: str = ""


@dataclass(frozen=True)
class WorkerOutcome:
    job: QueueJob
    executed: bool
    reason: str


@dataclass(frozen=True)
class WorkerExecutionResult:
    success: bool
    result_digest: str
    retry_safe: bool = False


class KnownRetryableFailure(Exception):
    """Use only when the provider proves no side effect occurred or deduplicates it."""
    def __init__(self, message: str, *, retry_safe: bool = False) -> None:
        super().__init__(message)
        self.retry_safe = retry_safe


Policy = Callable[[QueueJob], WorkerAuthorization]
class CancellationRequested(Exception):
    """Cooperative cancellation observed at a worker checkpoint."""


class WorkerLeaseLost(Exception):
    """The worker can no longer prove it owns a live lease."""


@dataclass
class WorkerExecutionContext:
    queue: SQLiteJobQueue
    job_id: str
    worker_id: str
    lease_seconds: int
    clock: Callable[[], float]

    def checkpoint(self) -> QueueJob:
        """Observe cancellation and renew the lease before more work or side effects."""
        current = self.queue.get(self.job_id)
        now = self.clock()
        if current.state == "cancel_requested":
            self.queue.acknowledge_cancel(self.job_id, self.worker_id, now=now)
            raise CancellationRequested("cancellation acknowledged")
        if current.state == "cancelled":
            raise CancellationRequested("job already cancelled")
        try:
            return self.queue.renew_lease(
                self.job_id, self.worker_id,
                lease_seconds=self.lease_seconds, now=now,
            )
        except (PermissionError, KeyError) as exc:
            raise WorkerLeaseLost("worker lease is no longer valid") from exc


Executor = Callable[[QueueJob, WorkerAuthorization, WorkerExecutionContext], object]


class WorkerRunner:
    def __init__(
        self,
        *,
        queue: SQLiteJobQueue,
        worker_id: str,
        policy: Optional[Policy],
        executor: Executor,
        lease_seconds: int = 60,
    ) -> None:
        if not worker_id.strip():
            raise ValueError("worker_id is required")
        if not 1 <= lease_seconds <= 3600:
            raise ValueError("lease_seconds must be between 1 and 3600")
        self.queue = queue
        self.worker_id = worker_id
        self.policy = policy
        self.executor = executor
        self.lease_seconds = lease_seconds

    def run_one(self, *, now: float | None = None) -> WorkerOutcome | None:
        job = self.queue.claim(
            self.worker_id, lease_seconds=self.lease_seconds, now=now
        )
        if job is None:
            return None

        def cancelled() -> bool:
            current = self.queue.get(job.job_id)
            if current.state == "cancel_requested":
                self.queue.acknowledge_cancel(
                    job.job_id, self.worker_id, now=now
                )
                return True
            return current.state == "cancelled"

        if cancelled():
            return WorkerOutcome(self.queue.get(job.job_id), False, "cancelled_before_authorization")
        if self.policy is None:
            blocked = self.queue.complete(
                job.job_id, self.worker_id, success=False, now=now
            )
            return WorkerOutcome(blocked, False, "policy_gate_unavailable")
        try:
            grant = self.policy(job)
        except Exception:
            blocked = self.queue.complete(
                job.job_id, self.worker_id, success=False, now=now
            )
            return WorkerOutcome(blocked, False, "policy_gate_error")

        if (
            not isinstance(grant, WorkerAuthorization)
            or grant.approved is not True
            or not isinstance(grant.task_id, str)
            or grant.task_id != job.job_id
            or not isinstance(grant.authority_id, str)
            or not grant.authority_id.strip()
            or not isinstance(grant.policy_version, str)
            or not grant.policy_version.strip()
            or not isinstance(grant.granted_scopes, frozenset)
            or not isinstance(grant.required_scopes, frozenset)
            or grant.granted_scopes != grant.required_scopes
            or grant.owner_terms_accepted is not True
        ):
            if cancelled():
                return WorkerOutcome(self.queue.get(job.job_id), False, "cancelled_during_authorization")
            blocked = self.queue.complete(
                job.job_id, self.worker_id, success=False, now=now
            )
            return WorkerOutcome(
                blocked, False,
                grant.reason if isinstance(grant, WorkerAuthorization) and grant.reason
                else "authorization_or_scope_gate_failed",
            )

        # Cancellation and authorization are checked immediately before handing
        # control to the executor. A real executor must still enforce its own
        # deadline, cancellation and provider idempotency.
        if cancelled():
            return WorkerOutcome(self.queue.get(job.job_id), False, "cancelled_before_execution")
        context = WorkerExecutionContext(
            queue=self.queue, job_id=job.job_id, worker_id=self.worker_id,
            lease_seconds=self.lease_seconds,
            clock=(lambda: now) if now is not None else time.time,
        )
        try:
            execution = self.executor(job, grant, context)
        except CancellationRequested:
            return WorkerOutcome(self.queue.get(job.job_id), False, "cancelled_at_checkpoint")
        except WorkerLeaseLost:
            return WorkerOutcome(self.queue.get(job.job_id), False, "worker_lease_lost_stop_execution")
        except KnownRetryableFailure as exc:
            # The exception type alone is insufficient: retry must be explicitly
            # declared safe for this exact operation.
            completed = self.queue.complete(
                job.job_id, self.worker_id, success=False,
                retryable=exc.retry_safe, now=now,
            )
            reason = "known_retryable_failure" if exc.retry_safe else "retry_safety_not_proven"
            return WorkerOutcome(completed, False, reason)
        except Exception:
            blocked = self.queue.complete(
                job.job_id, self.worker_id, success=False, now=now
            )
            return WorkerOutcome(blocked, False, "executor_outcome_unknown_manual_reconciliation_required")

        if (
            not isinstance(execution, WorkerExecutionResult)
            or not isinstance(execution.success, bool)
            or not isinstance(execution.result_digest, str)
            or re.fullmatch(r"[0-9a-f]{64}", execution.result_digest) is None
            or not isinstance(execution.retry_safe, bool)
        ):
            blocked = self.queue.complete(
                job.job_id, self.worker_id, success=False, now=now
            )
            return WorkerOutcome(blocked, False, "invalid_executor_result_blocked")
        if not execution.success:
            completed = self.queue.complete(
                job.job_id, self.worker_id, success=False,
                retryable=execution.retry_safe, now=now,
            )
            reason = "retryable_failure" if execution.retry_safe else "executor_failure_not_retry_safe"
            return WorkerOutcome(completed, False, reason)

        # Do not turn a completed external side effect into "cancelled" merely
        # because cancellation arrived during execution; preserve its outcome.
        completed = self.queue.complete(
            job.job_id, self.worker_id, success=True, now=now
        )
        return WorkerOutcome(completed, True, "executed")
