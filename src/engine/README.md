# DualisCapax engine bundle — ED-SYS-20260911-SWARM-V1

Source zip: `DUALISCAPAX_AUTONOMOUS_SWARM_ENGINE_AND_ADVERSARIAL_HARNESS_[ED-SYS-20260911-SWARM-V1].zip`
Drive id: `1OUnAZbCpYuw-mwoRO2buv1UciGRPavl7`

## Manifested gaps (2026-09-11)

1. **Ingest wiring** — `workflow_dispatch` / `repository_dispatch` / cron map to `SWARM_TASK_ID`, `SWARM_TASK_TYPE`, `SWARM_INSTRUCTION`. Unknown types fail closed to `CODEX_REMOTE_TASK`.
2. **Epoch ledger** — with `SWARM_PERSIST=1` the runner writes `src/engine/ledgers/LATEST.json`, `ledgers/docket.jsonl`, and `ledgers/epochs/epoch-*.json`. Actions commits only that directory.
3. **CODEX_REMOTE_TASK** — writes `ledgers/receipts/<task_id>.json` with the engine-tree SHA-256. The instruction string is recorded. It is not eval'd and not passed to a shell.

## Local run

```bash
cd src/engine
PYTHONPATH=. python3 dclm_singularity_kernel.py
SWARM_PERSIST=1 PYTHONPATH=. python3 agent_swarm_runner.py
PYTHONPATH=. python3 test_adversarial_swarm_attack.py
```

Hall, apex `/hall/` bind, checkout, and HMAC preview are still outside this engine. Spine seat order 1 is unchanged.
