#!/usr/bin/env python3
"""Parse sanitized Vultr inventory JSON and notify on degraded instances.

The script never reads or transmits API credentials. By default it emits a
GitHub Actions annotation/summary and exits non-zero when any scoped instance
is not active, running, and running. An optional DCLM_ALERT_WEBHOOK_URL may be
configured for a minimal JSON alert containing only the scope and health rows.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class HealthRow:
    instance_id: str
    label: str
    region: str
    main_ip: str
    status: str
    power_status: str
    server_status: str

    @property
    def healthy(self) -> bool:
        return (
            self.status == "active"
            and self.power_status == "running"
            and self.server_status == "running"
        )

    def as_dict(self) -> dict[str, str | bool]:
        return {
            "id": self.instance_id,
            "label": self.label,
            "region": self.region,
            "main_ip": self.main_ip,
            "status": self.status,
            "power_status": self.power_status,
            "server_status": self.server_status,
            "healthy": self.healthy,
        }


def load_rows(path: Path) -> tuple[str, list[HealthRow]]:
    payload: Any = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("schema") != "dualis.vultr-inventory/1":
        raise ValueError("unsupported or missing inventory schema")
    if payload.get("readOnly") is not True:
        raise ValueError("refusing non-read-only inventory input")
    target = payload.get("target")
    if not isinstance(target, list):
        raise ValueError("inventory target must be an array")

    scope = str(payload.get("regionScope") or os.environ.get("REGION_SCOPE") or "both")
    rows: list[HealthRow] = []
    for item in target:
        if not isinstance(item, dict):
            raise ValueError("inventory target contains a non-object")
        rows.append(
            HealthRow(
                instance_id=str(item.get("id") or "unknown"),
                label=str(item.get("label") or ""),
                region=str(item.get("region") or "unknown"),
                main_ip=str(item.get("main_ip") or ""),
                status=str(item.get("status") or "unknown"),
                power_status=str(item.get("power_status") or "unknown"),
                server_status=str(item.get("server_status") or "unknown"),
            )
        )
    return scope, rows


def summary(scope: str, rows: list[HealthRow]) -> dict[str, Any]:
    degraded = [row for row in rows if not row.healthy]
    return {
        "schema": "dualis.vultr-health-alert/1",
        "readOnly": True,
        "regionScope": scope,
        "instancesInScope": len(rows),
        "instancesHealthy": len(rows) - len(degraded),
        "instancesDegraded": len(degraded),
        "overallHealth": (
            "NO_INSTANCES_IN_SCOPE" if not rows else "DEGRADED" if degraded else "HEALTHY"
        ),
        "instances": [row.as_dict() for row in degraded],
    }


def emit_github(summary_payload: dict[str, Any]) -> None:
    if summary_payload["overallHealth"] == "DEGRADED":
        print(
            f"::error title=Vultr instance degraded::"
            f"{summary_payload['instancesDegraded']} instance(s) degraded in "
            f"scope {summary_payload['regionScope']}"
        )
    print(json.dumps(summary_payload, sort_keys=True))

    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary_path:
        return
    rows = summary_payload["instances"]
    lines = [
        "## Vultr instance health",
        "",
        f"- API connection: `ok`",
        f"- Scope: `{summary_payload['regionScope']}`",
        f"- Overall health: **{summary_payload['overallHealth']}**",
        f"- Healthy: `{summary_payload['instancesHealthy']}`",
        f"- Degraded: `{summary_payload['instancesDegraded']}`",
    ]
    if rows:
        lines.extend([
            "",
            "| ID | Region | IP | Status | Power | Server |",
            "|---|---|---|---|---|---|",
        ])
        lines.extend(
            f"| {row['id']} | {row['region']} | {row['main_ip']} | "
            f"{row['status']} | {row['power_status']} | {row['server_status']} |"
            for row in rows
        )
    with open(summary_path, "a", encoding="utf-8") as handle:
        handle.write("\n".join(lines) + "\n")


def send_webhook(summary_payload: dict[str, Any], webhook_url: str) -> None:
    body = json.dumps(summary_payload, separators=(",", ":")).encode("utf-8")
    request = urllib.request.Request(
        webhook_url,
        data=body,
        method="POST",
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "dualiscapax-vultr-health-alert/1",
        },
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        if response.status < 200 or response.status >= 300:
            raise RuntimeError(f"webhook returned HTTP {response.status}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("inventory", type=Path)
    parser.add_argument(
        "--webhook-url",
        default=os.environ.get("DCLM_ALERT_WEBHOOK_URL"),
        help="Optional explicit alert endpoint; sends only degraded-instance summary",
    )
    args = parser.parse_args()

    try:
        scope, rows = load_rows(args.inventory)
        payload = summary(scope, rows)
        emit_github(payload)
        if payload["overallHealth"] == "DEGRADED" and args.webhook_url:
            send_webhook(payload, args.webhook_url)
            print("degraded_alert_webhook=sent")
        return 1 if payload["overallHealth"] == "DEGRADED" else 0
    except (OSError, ValueError, json.JSONDecodeError, urllib.error.URLError, RuntimeError) as error:
        print(f"::error title=Vultr health parser::{error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
