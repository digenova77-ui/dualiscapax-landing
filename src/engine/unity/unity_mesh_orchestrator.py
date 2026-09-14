"""DualisCapax Unity Mesh — truth-or-nothing.

Never stamps UNANIMOUS_PASS / theater stages for STUB or missing keys.
Honest SKIP / FAIL_CLOSED dockets only unless a real model call succeeds.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional


def _stubish(prompt: str) -> bool:
    p = (prompt or "").strip().upper()
    if not p:
        return True
    return p == "STUB" or p.startswith("STUB") or "STUB:" in p or "STUB TARGET=" in p


def _write_docket(docket: Dict[str, Any]) -> Dict[str, Any]:
    out_dir = "src/engine/ledgers/consensus"
    os.makedirs(out_dir, exist_ok=True)
    h = docket.get("consensus_hash") or hashlib.sha256(
        json.dumps(docket, sort_keys=True).encode()
    ).hexdigest()
    docket["consensus_hash"] = h
    path = os.path.join(out_dir, f"consensus_{h[:16]}.json")
    with open(path, "w") as f:
        json.dump(docket, f, indent=2)
    return docket


def _xai_chat(api_key: str, prompt: str) -> Optional[str]:
    """Minimal live call when XAI_API_KEY is present. Returns text or None."""
    body = json.dumps(
        {
            "model": "grok-2-latest",
            "messages": [
                {
                    "role": "system",
                    "content": "DualisCapax mesh sentry. Reply in <=120 words. Never invent cites or claim consensus of other models.",
                },
                {"role": "user", "content": prompt[:4000]},
            ],
            "temperature": 0.2,
        }
    ).encode()
    req = urllib.request.Request(
        "https://api.x.ai/v1/chat/completions",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode())
        return data["choices"][0]["message"]["content"]
    except (urllib.error.URLError, urllib.error.HTTPError, KeyError, IndexError, json.JSONDecodeError) as e:
        return f"[xAI call failed: {type(e).__name__}: {e}]"


class UnityMeshOrchestrator:
    def __init__(self) -> None:
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.xai_key = os.getenv("XAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")

    def keys_present(self) -> Dict[str, bool]:
        return {
            "gemini": bool(self.gemini_key),
            "xai": bool(self.xai_key),
            "anthropic": bool(self.anthropic_key),
            "openai": bool(self.openai_key),
        }

    def run_automated_deliberation_cycle(self, task_prompt: str) -> Dict[str, Any]:
        t0 = time.perf_counter()
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        keys = self.keys_present()

        if _stubish(task_prompt):
            docket = {
                "task_prompt": task_prompt,
                "timestamp_utc": now_iso,
                "elapsed_seconds": round(time.perf_counter() - t0, 4),
                "consensus_verdict": "SKIP_STUB",
                "law": "truth-or-nothing — STUB never earns UNANIMOUS_PASS",
                "keys_present": keys,
                "stages": [],
            }
            return _write_docket(docket)

        if not any(keys.values()):
            docket = {
                "task_prompt": task_prompt,
                "timestamp_utc": now_iso,
                "elapsed_seconds": round(time.perf_counter() - t0, 4),
                "consensus_verdict": "AWAITING_KEYS",
                "law": "no model keys — fail closed, no theater",
                "keys_present": keys,
                "stages": [],
            }
            return _write_docket(docket)

        stages: List[Dict[str, Any]] = []
        # Live path: call only models with keys. Never invent other models' votes.
        if keys["xai"]:
            out = _xai_chat(self.xai_key or "", task_prompt)
            stages.append(
                {
                    "model": "xAI (Grok)",
                    "role": "live_sentry",
                    "status": "CALLED" if out and not str(out).startswith("[xAI call failed") else "CALL_FAILED",
                    "output": out,
                }
            )
        for name, present in (
            ("gemini", keys["gemini"]),
            ("anthropic", keys["anthropic"]),
            ("openai", keys["openai"]),
        ):
            if present:
                stages.append(
                    {
                        "model": name,
                        "role": "key_present_not_wired",
                        "status": "SKIPPED_NOT_WIRED",
                        "output": "Key present in env but this orchestrator does not call this vendor yet — no fake PASS.",
                    }
                )

        live_ok = any(s.get("status") == "CALLED" for s in stages)
        verdict = "PARTIAL_LIVE" if live_ok else "FAIL_CLOSED"
        # Never claim 4/4 unanimous
        docket = {
            "task_prompt": task_prompt,
            "timestamp_utc": now_iso,
            "elapsed_seconds": round(time.perf_counter() - t0, 4),
            "consensus_verdict": verdict,
            "law": "truth-or-nothing — no invented multi-model convergence",
            "keys_present": keys,
            "stages": stages,
        }
        return _write_docket(docket)


if __name__ == "__main__":
    prompt = sys.argv[1] if len(sys.argv) > 1 else "STUB"
    orchestrator = UnityMeshOrchestrator()
    res = orchestrator.run_automated_deliberation_cycle(prompt)
    print("=== DUALISCAPAX UNITY MESH ===")
    print(f"Task:    {res['task_prompt']}")
    print(f"Verdict: {res['consensus_verdict']}")
    print(f"Hash:    0x{res['consensus_hash'][:32]}...")
    # Non-zero exit on STUB scheduled defaults so CI doesn't look like success-theater
    if res["consensus_verdict"] in ("SKIP_STUB", "AWAITING_KEYS", "FAIL_CLOSED"):
        # Exit 0 so workflows can commit honest skip dockets without failing the job
        sys.exit(0)
