"""Fail-closed execution boundary contract for autonomous workers.

This module builds and validates a sandbox launch plan. It deliberately does not
launch processes or claim that Python-level checks are an OS sandbox. Production
execution requires a trusted backend that enforces these controls outside the worker.
"""
from __future__ import annotations

from dataclasses import dataclass
import ipaddress
import re
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
    if not isinstance(raw, str) or not raw or len(raw) > 512:
        return False
    if any(ord(char) < 32 for char in raw) or "\\" in raw or raw.startswith("/"):
        return False
    # Inspect raw segments before pathlib can normalize "." or repeated slashes.
    if any(part in ("", ".", "..") for part in raw.split("/")):
        return False
    return not PurePosixPath(raw).is_absolute()


def _valid_environment_name(name: str) -> bool:
    return isinstance(name, str) and re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]{0,127}", name) is not None


def _valid_egress_host(host: str) -> bool:
    """Accept a bare DNS name or IP literal, never a URL, port, or wildcard."""
    if not isinstance(host, str) or not host or len(host) > 253:
        return False
    if host != host.strip() or any(ord(char) < 33 for char in host):
        return False
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        pass
    if host.endswith(".") or host.lower() != host:
        return False
    labels = host.split(".")
    if len(labels) < 2:
        return False
    return all(
        1 <= len(label) <= 63
        and re.fullmatch(r"[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", label) is not None
        for label in labels
    )


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
    if not isinstance(policy, SandboxPolicy):
        safe_task_id = task_id if isinstance(task_id, str) else ""
        return SandboxDecision(False, ("sandbox_policy_missing",), task_id=safe_task_id)
    if not isinstance(policy.policy_version, str) or not policy.policy_version.strip():
        reasons.append("policy_version_missing")
    if not isinstance(policy.authority_id, str) or not policy.authority_id.strip():
        reasons.append("authority_missing")
    if not isinstance(task_id, str) or not task_id.strip() or policy.approved_task_id != task_id:
        reasons.append("task_binding_mismatch")
    if policy.accepted is not True:
        reasons.append("owner_policy_not_accepted")
    if backend_attested is not True:
        reasons.append("trusted_sandbox_backend_not_attested")
    if policy.host_filesystem_access:
        reasons.append("host_filesystem_access_forbidden")
    if policy.host_credentials_access:
        reasons.append("host_credentials_access_forbidden")
    if policy.privileged_mode:
        reasons.append("privileged_mode_forbidden")
    if not isinstance(policy.workspace_root, str) or not policy.workspace_root or len(policy.workspace_root) > 1024:
        reasons.append("workspace_root_invalid")
    else:
        root = PurePosixPath(policy.workspace_root)
        if (
            not root.is_absolute()
            or str(root) == "/"
            or ".." in policy.workspace_root.split("/")
            or any(ord(char) < 32 for char in policy.workspace_root)
            or "\\" in policy.workspace_root
        ):
            reasons.append("workspace_root_invalid")
    invalid_allowlist = False
    for field_name, values in (
        ("read", policy.allowed_read_paths),
        ("write", policy.allowed_write_paths),
        ("environment", policy.allowed_environment),
        ("egress", policy.allowed_egress_hosts),
        ("required_read", required_read_paths),
        ("required_write", required_write_paths),
        ("required_environment", required_environment),
        ("required_egress", required_egress_hosts),
    ):
        if not isinstance(values, (set, frozenset)) or any(not isinstance(value, str) for value in values):
            reasons.append(f"{field_name}_allowlist_invalid")
            invalid_allowlist = True
    if invalid_allowlist:
        return SandboxDecision(False, tuple(sorted(set(reasons))), policy.policy_version if isinstance(policy.policy_version, str) else "", task_id if isinstance(task_id, str) else "")
    if any(not _valid_environment_name(name) for name in policy.allowed_environment):
        reasons.append("environment_name_invalid")
    if any(_credential_like_environment_name(name) for name in policy.allowed_environment if isinstance(name, str)):
        reasons.append("credential_environment_forbidden")
    if any(not _valid_egress_host(host) for host in policy.allowed_egress_hosts):
        reasons.append("egress_host_invalid")
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
    for value, minimum, maximum, reason in (
        (policy.cpu_seconds, 1, 60, "cpu_limit_out_of_bounds"),
        (policy.memory_mb, 32, 1024, "memory_limit_out_of_bounds"),
        (policy.process_limit, 1, 32, "process_limit_out_of_bounds"),
        (policy.wall_seconds, 1, 120, "wall_time_limit_out_of_bounds"),
    ):
        if type(value) is not int or not minimum <= value <= maximum:
            reasons.append(reason)
    for name in ("network_enabled", "host_filesystem_access", "host_credentials_access", "privileged_mode"):
        if type(getattr(policy, name)) is not bool:
            reasons.append(f"{name}_invalid")
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
