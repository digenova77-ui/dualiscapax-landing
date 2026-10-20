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
from autonomy.sqlite_ledger import SQLiteHashChainLedger


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
    lease_generation: int
    clock: Callable[[], float]

    def checkpoint(self) -> QueueJob:
        """Observe cancellation and renew the lease before more work or side effects."""
        current = self.queue.get(self.job_id)
        now = self.clock()
        if current.state == "cancel_requested":
            self.queue.acknowledge_cancel(self.job_id, self.worker_id, lease_generation=self.lease_generation, now=now)
            raise CancellationRequested("cancellation acknowledged")
        if current.state == "cancelled":
            raise CancellationRequested("job already cancelled")
        try:
            return self.queue.renew_lease(
                self.job_id, self.worker_id, lease_generation=self.lease_generation,
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
        ledger: SQLiteHashChainLedger,
        worker_id: str,
        policy: Optional[Policy],
        executor: Executor,
        lease_seconds: int = 60,
    ) -> None:
        if (
            not isinstance(worker_id, str) or not worker_id.strip()
            or len(worker_id) > 128 or any(ord(char) < 32 for char in worker_id)
        ):
            raise ValueError("worker_id must be a valid bounded string")
        if not 1 <= lease_seconds <= 3600:
            raise ValueError("lease_seconds must be between 1 and 3600")
        self.queue = queue
        self.ledger = ledger
        self.worker_id = worker_id
        self.policy = policy
        self.executor = executor
        self.lease_seconds = lease_seconds

    def _audit(self, event_type: str, job_id: str, **details: object) -> None:
        if not self.ledger.verify():
            raise RuntimeError("worker audit ledger integrity check failed")
        self.ledger.append({
            "type": event_type, "job_id": job_id,
            "worker_id": self.worker_id, **details,
        })
        if not self.ledger.verify():
            raise RuntimeError("worker audit ledger failed post-append verification")

    def run_one(self, *, now: float | None = None) -> WorkerOutcome | None:
        if not self.ledger.verify():
            raise RuntimeError("worker audit ledger integrity check failed")
        job = self.queue.claim(
            self.worker_id, lease_seconds=self.lease_seconds, now=now
        )
        if job is None:
            return None
        self._audit(
            "worker_claimed", job.job_id,
            attempt=job.attempts, lease_until=job.lease_until,
        )

        def cancelled() -> bool:
            current = self.queue.get(job.job_id)
            if current.state == "cancel_requested":
                self.queue.acknowledge_cancel(
                    job.job_id, self.worker_id, lease_generation=job.lease_generation, now=now
                )
                return True
            return current.state == "cancelled"

        if cancelled():
            self._audit("worker_cancelled", job.job_id, phase="before_authorization")
            return WorkerOutcome(self.queue.get(job.job_id), False, "cancelled_before_authorization")
        if self.policy is None:
            self._audit("worker_authorization_refused", job.job_id, reason="policy_gate_unavailable")
            blocked = self.queue.complete(
                job.job_id, self.worker_id, lease_generation=job.lease_generation, success=False, now=now
            )
            return WorkerOutcome(blocked, False, "policy_gate_unavailable")
        try:
            grant = self.policy(job)
        except Exception:
            self._audit("worker_authorization_refused", job.job_id, reason="policy_gate_error")
            blocked = self.queue.complete(
                job.job_id, self.worker_id, lease_generation=job.lease_generation, success=False, now=now
            )
            return WorkerOutcome(blocked, False, "policy_gate_error")

        if (
            not isinstance(grant, WorkerAuthorization)
            or grant.approved is not True
            or not isinstance(grant.task_id, str)
            or grant.task_id != job.job_id
            or not isinstance(grant.authority_id, str)
            or not grant.authority_id.strip()
            or len(grant.authority_id) > 256
            or any(ord(char) < 32 for char in grant.authority_id)
            or not isinstance(grant.policy_version, str)
            or not grant.policy_version.strip()
            or len(grant.policy_version) > 128
            or any(ord(char) < 32 for char in grant.policy_version)
            or not isinstance(grant.granted_scopes, frozenset)
            or not isinstance(grant.required_scopes, frozenset)
            or len(grant.granted_scopes) > 64
            or any(
                not isinstance(scope, str) or not scope or len(scope) > 128
                or any(ord(char) < 32 for char in scope)
                for scope in grant.granted_scopes
            )
            or grant.granted_scopes != grant.required_scopes
            or grant.owner_terms_accepted is not True
        ):
            if cancelled():
                return WorkerOutcome(self.queue.get(job.job_id), False, "cancelled_during_authorization")
            allowed_reasons = {
                "owner_denied", "terms_not_accepted", "scope_mismatch",
                "task_mismatch", "policy_version_mismatch",
            }
            reason = (
                grant.reason if isinstance(grant, WorkerAuthorization)
                and isinstance(grant.reason, str)
                and grant.reason in allowed_reasons
                else "authorization_or_scope_gate_failed"
            )
            self._audit("worker_authorization_refused", job.job_id, reason=reason)
            blocked = self.queue.complete(
                job.job_id, self.worker_id, success=False, now=now
            )
            return WorkerOutcome(blocked, False, reason)

        # Cancellation and authorization are checked immediately before handing
        # control to the executor. A real executor must still enforce its own
        # deadline, cancellation and provider idempotency.
        if cancelled():
            self._audit("worker_cancelled", job.job_id, phase="before_execution")
            return WorkerOutcome(self.queue.get(job.job_id), False, "cancelled_before_execution")
        self._audit(
            "worker_execution_started", job.job_id,
            authority_id=grant.authority_id, policy_version=grant.policy_version,
            scopes=sorted(grant.granted_scopes),
        )
        context = WorkerExecutionContext(
            queue=self.queue, job_id=job.job_id, worker_id=self.worker_id,
            lease_seconds=self.lease_seconds, lease_generation=job.lease_generation,
            clock=(lambda: now) if now is not None else time.time,
        )
        try:
            execution = self.executor(job, grant, context)
        except CancellationRequested:
            self._audit("worker_cancelled", job.job_id, phase="execution_checkpoint")
            return WorkerOutcome(self.queue.get(job.job_id), False, "cancelled_at_checkpoint")
        except WorkerLeaseLost:
            self._audit("worker_lease_lost", job.job_id, phase="execution")
            return WorkerOutcome(self.queue.get(job.job_id), False, "worker_lease_lost_stop_execution")
        except KnownRetryableFailure as exc:
            # The exception type alone is insufficient: retry must be explicitly
            # declared safe for this exact operation.
            completed = self.queue.complete(
                job.job_id, self.worker_id, success=False,
                retryable=exc.retry_safe, now=now,
            )
            reason = "known_retryable_failure" if exc.retry_safe else "retry_safety_not_proven"
            self._audit("worker_execution_failed", job.job_id, reason=reason, retry_safe=exc.retry_safe, state=completed.state)
            return WorkerOutcome(completed, False, reason)
        except Exception:
            blocked = self.queue.complete(
                job.job_id, self.worker_id, success=False, now=now
            )
            self._audit("worker_execution_unknown", job.job_id, state=blocked.state, manual_reconciliation_required=True)
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
            self._audit("worker_execution_failed", job.job_id, reason="invalid_executor_result", state=blocked.state)
            return WorkerOutcome(blocked, False, "invalid_executor_result_blocked")
        if not execution.success:
            completed = self.queue.complete(
                job.job_id, self.worker_id, success=False,
                retryable=execution.retry_safe, now=now,
            )
            reason = "retryable_failure" if execution.retry_safe else "executor_failure_not_retry_safe"
            self._audit("worker_execution_failed", job.job_id, reason=reason, retry_safe=execution.retry_safe, result_digest=execution.result_digest, state=completed.state)
            return WorkerOutcome(completed, False, reason)

        # Do not turn a completed external side effect into "cancelled" merely
        # because cancellation arrived during execution; preserve its outcome.
        completed = self.queue.complete(
            job.job_id, self.worker_id, success=True, now=now
        )
        self._audit("worker_execution_succeeded", job.job_id, result_digest=execution.result_digest, state=completed.state)
        return WorkerOutcome(completed, True, "executed")
