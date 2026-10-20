"""Fail-closed execution boundary contract for autonomous workers.

This module builds and validates a sandbox launch plan. It deliberately does not
launch processes or claim that Python-level checks are an OS sandbox. Production
execution requires a trusted backend that enforces these controls outside the worker.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import PurePosixPath
from typing import FrozenSet, Optional


@dataclass(frozen=True)
class SandboxPolicy:
    policy_version: str
    approved_task_id: str
    authority_id: str
    workspace_root: str
    allowed_read_paths: FrozenSet[str]
    allowed_write_paths: FrozenSet[str]
    allowed_environment: FrozenSet[str] = frozenset()
    allowed_egress_hosts: FrozenSet[str] = frozenset()
    network_enabled: bool = False
    host_filesystem_access: bool = False
    host_credentials_access: bool = False
    privileged_mode: bool = False
    cpu_seconds: int = 10
    memory_mb: int = 128
    process_limit: int = 16
    wall_seconds: int = 30
    accepted: bool = False


@dataclass(frozen=True)
class SandboxDecision:
    allowed: bool
    reasons: tuple[str, ...]
    policy_version: str = ""
    task_id: str = ""


@dataclass(frozen=True)
class SandboxLaunchPlan:
    task_id: str
    authority_id: str
    policy_version: str
    workspace_root: str
    read_paths: tuple[str, ...]
    write_paths: tuple[str, ...]
    environment_names: tuple[str, ...]
    egress_hosts: tuple[str, ...]
    network_enabled: bool
    cpu_seconds: int
    memory_mb: int
    process_limit: int
    wall_seconds: int


def _safe_relative_path(raw: str) -> bool:
    if not raw or "\x00" in raw or "\\" in raw:
        return False
    path = PurePosixPath(raw)
    return not path.is_absolute() and all(part not in ("", ".", "..") for part in path.parts)


def _credential_like_environment_name(name: str) -> bool:
    normalized = name.upper()
    return any(marker in normalized for marker in (
        "TOKEN", "SECRET", "PASSWORD", "API_KEY", "PRIVATE_KEY",
        "CREDENTIAL", "AUTHORIZATION", "COOKIE",
    ))


def validate_sandbox_policy(
    policy: Optional[SandboxPolicy],
    *,
    task_id: str,
    required_read_paths: FrozenSet[str] = frozenset(),
    required_write_paths: FrozenSet[str] = frozenset(),
    required_environment: FrozenSet[str] = frozenset(),
    required_egress_hosts: FrozenSet[str] = frozenset(),
    backend_attested: bool = False,
) -> SandboxDecision:
    """Validate exact task binding, least privilege, and hard resource ceilings."""
    reasons: list[str] = []
    if policy is None:
        return SandboxDecision(False, ("sandbox_policy_missing",), task_id=task_id)
    if not policy.accepted:
        reasons.append("owner_policy_not_accepted")
    if not policy.policy_version.strip():
        reasons.append("policy_version_missing")
    if not policy.authority_id.strip():
        reasons.append("authority_missing")
    if not task_id or policy.approved_task_id != task_id:
        reasons.append("task_binding_mismatch")
    if not backend_attested:
        reasons.append("trusted_sandbox_backend_not_attested")
    if policy.host_filesystem_access:
        reasons.append("host_filesystem_access_forbidden")
    if policy.host_credentials_access:
        reasons.append("host_credentials_access_forbidden")
    if policy.privileged_mode:
        reasons.append("privileged_mode_forbidden")
    root = PurePosixPath(policy.workspace_root)
    if (
        not root.is_absolute()
        or str(root) == "/"
        or ".." in root.parts
        or "\\x00" in policy.workspace_root
    ):
        reasons.append("workspace_root_invalid")
    if any(_credential_like_environment_name(name) for name in policy.allowed_environment):
        reasons.append("credential_environment_forbidden")
    if any(not _safe_relative_path(p) for p in policy.allowed_read_paths):
        reasons.append("unsafe_read_path")
    if any(not _safe_relative_path(p) for p in policy.allowed_write_paths):
        reasons.append("unsafe_write_path")
    if not required_read_paths.issubset(policy.allowed_read_paths):
        reasons.append("required_read_path_not_granted")
    if not required_write_paths.issubset(policy.allowed_write_paths):
        reasons.append("required_write_path_not_granted")
    if not required_environment.issubset(policy.allowed_environment):
        reasons.append("environment_allowlist_mismatch")
    if not required_egress_hosts.issubset(policy.allowed_egress_hosts):
        reasons.append("egress_allowlist_mismatch")
    if required_egress_hosts and not policy.network_enabled:
        reasons.append("egress_requested_while_network_disabled")
    if not policy.network_enabled and policy.allowed_egress_hosts:
        reasons.append("egress_hosts_configured_while_network_disabled")
    if policy.cpu_seconds < 1 or policy.cpu_seconds > 60:
        reasons.append("cpu_limit_out_of_bounds")
    if policy.memory_mb < 32 or policy.memory_mb > 1024:
        reasons.append("memory_limit_out_of_bounds")
    if policy.process_limit < 1 or policy.process_limit > 32:
        reasons.append("process_limit_out_of_bounds")
    if policy.wall_seconds < 1 or policy.wall_seconds > 120:
        reasons.append("wall_time_limit_out_of_bounds")
    return SandboxDecision(not reasons, tuple(reasons), policy.policy_version, task_id)


def build_launch_plan(policy: SandboxPolicy, decision: SandboxDecision) -> SandboxLaunchPlan:
    """Produce a deterministic plan only after a matching allow decision."""
    if not decision.allowed:
        raise PermissionError("sandbox launch denied: " + ",".join(decision.reasons))
    if decision.task_id != policy.approved_task_id or decision.policy_version != policy.policy_version:
        raise PermissionError("sandbox decision does not bind this policy")
    return SandboxLaunchPlan(
        task_id=policy.approved_task_id,
        authority_id=policy.authority_id,
        policy_version=policy.policy_version,
        workspace_root=policy.workspace_root,
        read_paths=tuple(sorted(policy.allowed_read_paths)),
        write_paths=tuple(sorted(policy.allowed_write_paths)),
        environment_names=tuple(sorted(policy.allowed_environment)),
        egress_hosts=tuple(sorted(policy.allowed_egress_hosts)),
        network_enabled=policy.network_enabled,
        cpu_seconds=policy.cpu_seconds,
        memory_mb=policy.memory_mb,
        process_limit=policy.process_limit,
        wall_seconds=policy.wall_seconds,
    )
