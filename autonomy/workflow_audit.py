"""Static risk inventory for GitHub Actions workflows.

This scanner is intentionally heuristic: it produces review leads, not a proof of
workflow safety. It never executes workflow code or prints source-line contents.
"""
from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True, order=True)
class WorkflowFinding:
    path: str
    rule_id: str
    severity: str
    message: str


def inspect_workflow(source: str, path: str) -> list[WorkflowFinding]:
    findings: set[WorkflowFinding] = set()
    permissions_write = bool(re.search(r"(?m)^\s*(?:contents|actions|packages|pull-requests|issues):\s*write\s*(?:#.*)?$", source))
    if re.search(r"(?m)^\s*pull_request_target\s*:", source):
        findings.add(WorkflowFinding(path, "PR_TARGET_EVENT", "high",
            "pull_request_target can expose write-capable context to untrusted pull requests; audit checkout and execution boundaries."))
    if permissions_write:
        findings.add(WorkflowFinding(path, "WRITE_PERMISSION", "high",
            "A write permission is declared; verify it is job-scoped, minimal, and necessary."))
    if re.search(r"(?m)^\s*id-token:\s*write\s*(?:#.*)?$", source):
        findings.add(WorkflowFinding(path, "OIDC_TOKEN_MINTING", "medium",
            "Workflow can mint an OIDC token; restrict trusted refs, audiences, and cloud-side subject claims."))
    if re.search(r"(?m)^\s*(?:-\s*)?uses:\s*[^./\s]+/[^@\s]+@(?![0-9a-fA-F]{40}\b)[^\s]+", source):
        findings.add(WorkflowFinding(path, "ACTION_NOT_SHA_PINNED", "medium",
            "At least one external action uses a mutable tag or ref instead of a full commit SHA."))
    if re.search(r"(?im)^\s*(?:-\s*run:\s*)?(?:git\s+push|gh\s+pr\s+merge|gh\s+release\s+create)\b", source):
        findings.add(WorkflowFinding(path, "REPOSITORY_MUTATION_COMMAND", "high",
            "A workflow shell step contains a direct repository mutation command; require explicit gates and narrow permissions."))
    if re.search(r"(?im)^\s*(?:-\s*run:\s*)?(?:curl|wget)\b", source):
        findings.add(WorkflowFinding(path, "SHELL_NETWORK_REQUEST", "medium",
            "A shell step performs network access; verify destination, response validation, and secret handling."))
    checkout = re.search(r"(?m)^\s*(?:-\s*)?uses:\s*actions/checkout@[^\s]+", source)
    persist_false = re.search(r"(?m)^\s*persist-credentials:\s*false\s*$", source)
    if checkout and permissions_write and not persist_false:
        findings.add(WorkflowFinding(path, "CHECKOUT_CREDENTIALS_WITH_WRITE", "high",
            "Checkout may persist credentials in a workflow with write permission; disable persistence unless required."))
    if re.search(r"(?m)^\s*secrets\.[A-Za-z_][A-Za-z0-9_]*\s*:\s*", source):
        findings.add(WorkflowFinding(path, "SECRET_AS_WORKFLOW_INPUT", "medium",
            "A secret appears in a workflow input or mapping; review whether it can be passed through a safer credential boundary."))
    return sorted(findings)


def scan_workflows(root: str | Path) -> list[WorkflowFinding]:
    base = Path(root)
    workflow_dir = base / ".github" / "workflows"
    if not workflow_dir.is_dir():
        return []
    findings: list[WorkflowFinding] = []
    for file in sorted(workflow_dir.rglob("*")):
        if file.is_file() and file.suffix.lower() in {".yml", ".yaml"}:
            try:
                source = file.read_text(encoding="utf-8")
            except (OSError, UnicodeError):
                findings.append(WorkflowFinding(
                    file.relative_to(base).as_posix(), "WORKFLOW_UNREADABLE", "high",
                    "Workflow file could not be read for static review.",
                ))
                continue
            findings.extend(inspect_workflow(source, file.relative_to(base).as_posix()))
    return sorted(findings)


def report_json(findings: Iterable[WorkflowFinding]) -> str:
    return json.dumps(
        [asdict(item) for item in sorted(findings)],
        sort_keys=True, separators=(",", ":"), ensure_ascii=False,
    )
