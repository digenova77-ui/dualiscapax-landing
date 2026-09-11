# Swarm epoch ledgers

Written by `agent_swarm_runner.py` when `SWARM_PERSIST=1`.

- `LATEST.json` — last epoch (full task list + ingest + engine-tree hashes)
- `docket.jsonl` — one summary line per epoch
- `epochs/epoch-YYYYMMDDTHHMMSSZ.json` — immutable copy of that epoch
- `receipts/<task_id>.json` — CODEX_REMOTE_TASK receipt

Do not hand-edit. The hourly workflow appends here and commits with `[skip ci]`.
