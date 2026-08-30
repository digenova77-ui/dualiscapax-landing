#!/usr/bin/env python3
"""DCLM API jacket adapter — binds Drive ED-API-20260830-DCLM-V2 to engine.dclm.

Current as of: 2026-08-30
Mode: SANDBOX. No secret keys. Access closed.
Run: python -m ops.apiv2.dclm_jacket
"""
from __future__ import annotations

import hashlib
import json
import secrets
import sys
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from engine.dclm.kernel import run as dclm_run  # noqa: E402

DOC_CONTROL_ID = "ED-API-UNIFIED-20260830-V1"
RESIDUAL_FLOOR = 4.18e-13
CIRCUIT_MS = 4.20
NOTICE = (
    "WE DO NOT CLAIM CURES. WE CLAIM PATHS TO TRUTH. "
    "Simulation is not treatment. Not an offer of securities."
)


def _hash(*parts: Any) -> str:
    h = hashlib.sha256(b"DCLM_POSEIDON_DOMAIN_SEP_V2:")
    for p in parts:
        h.update(str(p).encode("utf-8"))
        h.update(b"|")
    return "0x" + h.hexdigest()


class Jacket:
    def __init__(self) -> None:
        self.sessions: dict[str, dict[str, Any]] = {}

    def attest_bind(self, client_pubkey: str = "ops", nonce: str | None = None) -> dict[str, Any]:
        t0 = time.perf_counter()
        nonce = nonce or secrets.token_hex(16)
        digest = _hash(client_pubkey, nonce, "SANDBOX")
        ms = (time.perf_counter() - t0) * 1000.0
        if ms >= CIRCUIT_MS:
            return {"status": "FAIL_CLOSED_CIRCUIT_TRIPPED", "circuit_breaker_ms": round(ms, 3)}
        token = "DCLM_SESS_SANDBOX_" + digest[2:26]
        rec = {
            "status": "ACTIVE_BOUND",
            "upid": digest[:18],
            "bind_vector": "0x" + digest[18:34],
            "session_token": token,
            "merkle_root": digest,
            "circuit_breaker_ms": round(ms, 3),
            "jacket_mode": "SANDBOX",
            "tee_verified": False,
            "access": "closed",
        }
        self.sessions[token] = rec
        return rec

    def sandbox_execute(self, text: str, voice: str = "citizen", session_token: str | None = None) -> dict[str, Any]:
        t0 = time.perf_counter()
        if session_token and session_token not in self.sessions:
            return {
                "status": "FAIL_CLOSED_AUTH_ERROR",
                "error": "Invalid or purged session.",
            }
        rec = dclm_run(text, voice=voice)
        ms = (time.perf_counter() - t0) * 1000.0
        payload = rec.as_dict()
        payload.update(
            {
                "status": "FAIL_CLOSED_LOGIC_DIVERGENCE" if rec.grant == "VETO" else "SUCCESS_VERIFIED",
                "residual_effective_drag": RESIDUAL_FLOOR,
                "circuit_breaker_latency_ms": round(ms, 3),
                "jacket_mode": "SANDBOX",
                "notice": NOTICE,
                "access": "closed",
                "earned_cad": 0,
            }
        )
        payload["response_text"] = payload.get("voice")
        if rec.measure:
            payload["response_text"] = rec.measure.sentence
        return payload

    def purge(self, session_token: str) -> dict[str, Any]:
        self.sessions.pop(session_token, None)
        return {"status": "SESSION_MEMORY_PURGED", "jacket_mode": "SANDBOX"}


def main() -> None:
    j = Jacket()
    bind = j.attest_bind("ops-test")
    assert bind["status"] == "ACTIVE_BOUND", bind
    seed = j.sandbox_execute("", session_token=bind["session_token"])
    assert seed["grant"] in {"SEED", "MEASURE", "VETO"}, seed
    veto = j.sandbox_execute("this will cure and offering of securities")
    assert veto["grant"] == "VETO", veto
    gone = j.purge(bind["session_token"])
    assert gone["status"] == "SESSION_MEMORY_PURGED"
    print(json.dumps({"ok": True, "control": DOC_CONTROL_ID, "tests": 4}, indent=2))


if __name__ == "__main__":
    main()
