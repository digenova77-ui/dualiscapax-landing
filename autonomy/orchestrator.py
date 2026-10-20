"""One-shot orchestration path behind an injected Trinity policy gate.

No default allow path exists. Concrete policy, persistence, and provider adapters
must be supplied by deployment code and independently reviewed.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Optional

from autonomy.adapters import ExecutionRequest, ExecutionResult, IntegrationAdapter
from autonomy.ledger import HashChainLedger
from autonomy.supervisor import Job, JobState, Supervisor


@dataclass(frozen=True)
class AuthorizationDecision:
    approved: bool
    task_id: str
    authority_id: str
    allowed_scopes: frozenset[str]
    policy_version: str
    owner_terms_accepted: bool = False
    reason: str = ""


PolicyGate = Callable[[str, str, frozenset[str]], AuthorizationDecision]


@dataclass(frozen=True)
class OrchestrationOutcome:
    job: Job
    executed: bool
    result: Optional[ExecutionResult]
    reason: str


class Orchestrator:
    """Coordinates policy check, supervisor state, adapter, and evidence ledger."""

    def __init__(
        self,
        *,
        policy_gate: Optional[PolicyGate] = None,
        supervisor: Optional[Supervisor] = None,
    ) -> None:
        self._policy_gate = policy_gate
        self.supervisor = supervisor or Supervisor()

    def run_once(
        self,
        *,
        task_type: str,
        payload: dict,
        idempotency_key: str,
        adapter: IntegrationAdapter,
        required_scopes: frozenset[str],
    ) -> OrchestrationOutcome:
        job = self.supervisor.submit(
            task_type, payload, idempotency_key=idempotency_key, max_attempts=1
        )
        if self._policy_gate is None:
            blocked = self.supervisor.start(job.job_id, authorized=False)
            self.supervisor.ledger.append({
                "type": "orchestration_refused", "job_id": job.job_id,
                "reason": "policy_gate_unavailable",
            })
            return OrchestrationOutcome(blocked, False, None, "policy_gate_unavailable")

        try:
            decision = self._policy_gate(job.job_id, task_type, required_scopes)
        except Exception:
            blocked = self.supervisor.start(job.job_id, authorized=False)
            self.supervisor.ledger.append({
                "type": "orchestration_refused", "job_id": job.job_id,
                "reason": "policy_gate_error",
            })
            return OrchestrationOutcome(blocked, False, None, "policy_gate_error")

        if (
            not decision.approved
            or decision.task_id != job.job_id
            or not decision.authority_id.strip()
            or not decision.policy_version.strip()
            or not required_scopes.issubset(decision.allowed_scopes)
            or not decision.owner_terms_accepted
        ):
            blocked = self.supervisor.start(job.job_id, authorized=False)
            reason = decision.reason or "authorization_or_scope_gate_failed"
            self.supervisor.ledger.append({
                "type": "orchestration_refused", "job_id": job.job_id,
                "reason": reason, "authority_id": decision.authority_id,
                "policy_version": decision.policy_version,
            })
            return OrchestrationOutcome(blocked, False, None, reason)

        capabilities = adapter.describe()
        if not capabilities.official_api:
            blocked = self.supervisor.start(job.job_id, authorized=False)
            self.supervisor.ledger.append({
                "type": "orchestration_refused", "job_id": job.job_id,
                "reason": "official_adapter_required",
            })
            return OrchestrationOutcome(blocked, False, None, "official_adapter_required")
        if not required_scopes.issubset(capabilities.required_scopes):
            blocked = self.supervisor.start(job.job_id, authorized=False)
            self.supervisor.ledger.append({
                "type": "orchestration_refused", "job_id": job.job_id,
                "reason": "adapter_scope_contract_mismatch",
            })
            return OrchestrationOutcome(blocked, False, None, "adapter_scope_contract_mismatch")
        if not required_scopes.issubset(decision.allowed_scopes):
            blocked = self.supervisor.start(job.job_id, authorized=False)
            return OrchestrationOutcome(blocked, False, None, "granted_scope_mismatch")

        running = self.supervisor.start(job.job_id, authorized=True)
        request = ExecutionRequest(
            task_id=running.job_id,
            action=task_type,
            payload=payload,
            idempotency_key=idempotency_key,
            granted_scopes=decision.allowed_scopes,
        )
        try:
            result = adapter.execute(request)
        except Exception:
            # Unknown adapter exceptions are not automatically retried: the
            # adapter may have completed a side effect before raising.
            blocked = Job(**{**running.__dict__, "state": JobState.BLOCKED})
            self.supervisor._jobs[running.job_id] = blocked
            self.supervisor.ledger.append({
                "type": "adapter_outcome_unknown", "job_id": running.job_id,
                "reason": "manual_reconciliation_required",
            })
            return OrchestrationOutcome(blocked, False, None, "adapter_outcome_unknown")

        final = self.supervisor.finish(
            running.job_id,
            success=result.success,
            result={"evidence_digest": result.evidence_digest, "result": result.result},
        )
        self.supervisor.ledger.append({
            "type": "adapter_result", "job_id": running.job_id,
            "success": result.success, "evidence_digest": result.evidence_digest,
            "retryable": result.retryable,
        })
        return OrchestrationOutcome(
            final, True, result, "" if result.success else "adapter_reported_failure"
        )
