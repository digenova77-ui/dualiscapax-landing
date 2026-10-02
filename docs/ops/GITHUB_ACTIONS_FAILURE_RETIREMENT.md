# GitHub Actions Failure Retirement Policy

**Effective:** 2026-10-02  
**Mode:** fail-closed, history-preserving

## Rule

A workflow that repeatedly fails and is no longer required may be **disabled**, not deleted. Disabled workflows cannot be started by push, schedule, or downstream automation. Existing run records, logs, artifacts, and audit history remain in GitHub until GitHub's normal retention policy removes them.

## Current retired rails

- `curl-gate.yml`
- `pinata-gateway-list.yml`

These were disabled after repeated failures in the current run history. No active run existed at the time of retirement.

`pinata-pin.yml` remains enabled as the deliberate manager for the existing five-pin spare system. The pins were not deleted, repinned, or altered. GitHub workflow state is not treated as the authority for Pinata content.

## What is preserved

- Git commits and workflow source files;
- historical run status and URLs;
- retained logs and artifacts;
- the ability for a Father-authorized operator to inspect or deliberately restore a workflow.

## What is not done automatically

This policy does not delete runs, logs, artifacts, repositories, secrets, deployments, or workflow source. It does not cancel successful or active work. A future maintainer must explicitly review a workflow before re-enabling it.

## Autonomous guardrail

For future automation, use this bounded sequence only:

1. detect at least two failures for the same workflow in a rolling window;
2. confirm the workflow is listed in the retirement allowlist;
3. cancel only queued/in-progress runs of that allowlisted workflow;
4. disable the workflow;
5. write a receipt with workflow ID, run IDs, timestamp, and reason;
6. never delete history or re-enable without an explicit kernel/Father-authorized change.
