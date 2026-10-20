"""Fail-closed worker runner for the durable queue.

This is a synchronous reference runner, not an OS sandbox or background daemon.
The caller must supply a real authorization gate and an executor with its own
provider-side idempotency and scope enforcement. Unknown exceptions are blocked,
never retried automatically.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Optional

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


class KnownRetryableFailure(Exception):
    """Use only when the provider proves no side effect occurred or deduplicates it."""
    def __init__(self, message: str, *, retry_safe: bool = False) -> None:
        super().__init__(message)
        self.retry_safe = retry_safe


Policy = Callable[[QueueJob], WorkerAuthorization]
Executor = Callable[[QueueJob, WorkerAuthorization], object]


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
            or not grant.approved
            or grant.task_id != job.job_id
            or not grant.authority_id.strip()
            or not grant.policy_version.strip()
            or grant.granted_scopes != grant.required_scopes
            or not grant.owner_terms_accepted
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
        try:
            self.executor(job, grant)
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

        # Do not turn a completed external side effect into "cancelled" merely
        # because cancellation arrived during execution; preserve its outcome.
        completed = self.queue.complete(
            job.job_id, self.worker_id, success=True, now=now
        )
        return WorkerOutcome(completed, True, "executed")
