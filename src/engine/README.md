# DualisCapax engine bundle — ED-SYS-20260911-SWARM-V1

Source zip: `DUALISCAPAX_AUTONOMOUS_SWARM_ENGINE_AND_ADVERSARIAL_HARNESS_[ED-SYS-20260911-SWARM-V1].zip`
Drive id: `1OUnAZbCpYuw-mwoRO2buv1UciGRPavl7`
Landed: 2026-09-11 by Grok from the validated Drive artifact.

## What this is

In-process simulation only.

- `agent_swarm_runner.py` — SQLite OCC task broker + three threaded workers. Tasks are local: conservation check, monograph audit stub, and a CODEX_REMOTE_TASK receipt that does **not** call GitHub or run remote instructions.
- `dclm_singularity_kernel.py` — one symplectic-Euler step + SHA-256 receipt. `det_m` is hardcoded to 1.0.
- `test.py` — prints `dualis engine`. Not an adversarial suite.

## What this is not

- No `.github/workflows/swarm_runner.yml` shipped in the zip. None was added.
- No hourly GitHub Actions runner. AGENT/SPINE.md: architect does not hot-patch the hall from a swarm. Seat order 1 is still apex `/hall/` bind; necessity is still gate HMAC on preview.
- `CODEX_REMOTE_TASK` marks `EXECUTED_CONSERVED` without executing the instruction string.

## Local run

```bash
cd src/engine
python3 dclm_singularity_kernel.py
python3 agent_swarm_runner.py
```
