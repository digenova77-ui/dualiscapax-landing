# Local → GitHub Actions → Vultr control plane

This repository now contains a **read-only** bridge for the circuit:

```text
Local operator
  │ GitHub API workflow_dispatch POST
  ▼
GitHub repository
  │ authenticated Actions runner
  ▼
Vultr API / existing VM
```

The workflow is `.github/workflows/vultr-control-plane.yml`.

## What it can do

- Query Vultr account, instance, region, SSH-key, firewall, and DNS-domain metadata.
- Inventory `both` regions by default, or scope to `toronto`, `new_jersey`, or one explicit `ip`.
- Verify the API response and print sanitized per-instance health: region, IP, lifecycle status, power status, and server status.
- Upload a sanitized inventory artifact with a 14-day retention period.
- Optionally run a read-only SSH probe against the target VM.

## What it cannot do

The workflow has no provisioning, deployment, DNS mutation, firewall mutation, SSH-key mutation, billing, deletion, wallet signing, or token-transfer job. This is deliberate. The first circuit proves identity, reachability, and current state before a mutation rail exists.

## Required GitHub environment secrets

Both jobs automatically bind to the dedicated GitHub environment **`vultr-readonly`**. Configure these in **Settings → Environments → vultr-readonly → Environment secrets** for `digenova77-ui/dualiscapax-landing`:

- `VULTR_API_KEY`: a dedicated, expiring Vultr API key. Prefer Vultr API access control restricted to the runner’s approved source range if available.
- `VULTR_SSH_PRIVATE_KEY`: only if `ssh_verify` is needed. Store the private key as a multiline secret; never commit it or print it.
- `VULTR_SSH_USER`: the actual login user for the existing VM (`root`, `ubuntu`, or another explicitly provisioned account).

After these secrets are saved, no workflow edit is needed: a manual `workflow_dispatch` automatically selects `vultr-readonly`, reads its scoped credentials, and emits only sanitized inventory evidence. Environment protection reviewers, if enabled, remain an intentional human gate before credentials become available to a runner.

The SSH key added to the Vultr account does not retroactively install itself on an existing VM. The `ssh_verify` path is therefore expected to fail until the public key is installed on the VM through an already-authorized path.

## Local dispatch

Use a GitHub token in the local environment, not in source files or chat:

```bash
export GITHUB_TOKEN='...'
python3 scripts/dispatch_vultr_workflow.py inventory --region-scope both
python3 scripts/dispatch_vultr_workflow.py inventory --region-scope toronto
python3 scripts/dispatch_vultr_workflow.py ssh_verify --region-scope ip --target-ip 108.61.17.141
```

The dispatcher prints only the workflow name, repository, operation, and target IP.

## Gate for a future deployment rail

A deploy job should not be added until all of the following are written down and reviewed:

1. The exact application artifact and remote deployment directory.
2. The non-root service user and systemd/container contract.
3. The firewall and private-network rules.
4. The rollback method and backup evidence.
5. A protected GitHub Environment such as `vultr-production` with required reviewers.
6. A separate deployment credential from the inventory credential.
7. A tokenomics compliance result marked `PASS` or an explicit decision to keep the service read-only.

Until then, `inventory` and `ssh_verify` are the only supported operations.

## Toronto, New Jersey, or bare metal?

The recommended first topology is **two ordinary cloud instances**, one in Toronto and one in New Jersey, with the application artifact identical in both regions and state kept outside either host. This gives regional redundancy without locking the first release to hardware-specific recovery constraints.

Choose bare metal only when sustained CPU, memory, disk I/O, or noisy-neighbor isolation is a demonstrated bottleneck. Vultr documents dedicated bare metal in both Toronto and New Jersey as locations in its global network, but the feature set is narrower than cloud compute: snapshots and custom ISOs may be unavailable, and VPC support depends on the plan. Verify the exact plan’s availability and pricing in the Vultr account before provisioning.
