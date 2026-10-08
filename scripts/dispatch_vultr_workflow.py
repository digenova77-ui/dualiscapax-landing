#!/usr/bin/env python3
"""Dispatch the read-only DualisCapax Vultr GitHub Actions workflow.

Required environment variables:
  GITHUB_TOKEN   GitHub token with Actions/workflow dispatch permission.
Optional:
  GITHUB_REPOSITORY  owner/repo (default: digenova77-ui/dualiscapax-landing)
  GITHUB_REF         branch or tag (default: main)

The token is read from the environment and never printed.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

WORKFLOW = "vultr-control-plane.yml"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("operation", choices=("inventory", "ssh_verify"))
    parser.add_argument("--target-ip", default="108.61.17.141")
    args = parser.parse_args()

    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("GITHUB_TOKEN is required in the environment", file=sys.stderr)
        return 2
    repo = os.environ.get("GITHUB_REPOSITORY", "digenova77-ui/dualiscapax-landing")
    ref = os.environ.get("GITHUB_REF", "main")
    url = f"https://api.github.com/repos/{repo}/actions/workflows/{WORKFLOW}/dispatches"
    body = json.dumps({"ref": ref, "inputs": {"operation": args.operation, "target_ip": args.target_ip}}).encode()
    request = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": "dualiscapax-vultr-control-plane",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            if response.status not in (201, 204):
                print(f"GitHub dispatch returned HTTP {response.status}", file=sys.stderr)
                return 1
    except urllib.error.HTTPError as error:
        print(f"GitHub dispatch failed with HTTP {error.code}", file=sys.stderr)
        return 1
    except urllib.error.URLError as error:
        print(f"GitHub dispatch failed: {error.reason}", file=sys.stderr)
        return 1
    print(f"dispatched workflow={WORKFLOW} repo={repo} ref={ref} operation={args.operation} target_ip={args.target_ip}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
