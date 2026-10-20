"""Provider-neutral adapter contract; implementations must be separately authorized."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class AdapterCapabilities:
    provider: str
    capabilities: frozenset[str]
    required_scopes: frozenset[str]
    official_api: bool
    terms_version: str


@dataclass(frozen=True)
class ExecutionRequest:
    task_id: str
    action: str
    payload: dict
    idempotency_key: str
    granted_scopes: frozenset[str]


@dataclass(frozen=True)
class ExecutionResult:
    success: bool
    result: dict
    evidence_digest: str
    retryable: bool = False


class IntegrationAdapter(Protocol):
    """A concrete adapter must implement these methods and enforce scope locally."""

    def describe(self) -> AdapterCapabilities:
        ...

    def execute(self, request: ExecutionRequest) -> ExecutionResult:
        """Execute only a task already authorized by the Trinity gate."""
        ...
