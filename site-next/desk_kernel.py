"""Desk kernel. Replaces the public Manus routes. Does not call Manus."""
from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

ROOT = Path(__file__).resolve().parent
STARTED = time.time()
CALLS: list[dict] = []
ALLOW = [
    "https://cdn.jsdelivr.net",
    "https://dualiscapax.ai",
    "https://next.dualiscapax.ai",
    "http://127.0.0.1:8080",
    "http://localhost:8080",
]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["content-type"],
)


def digest(payload: str) -> str:
    return hashlib.sha256(payload.encode()).hexdigest()


@app.get("/api/v2/capabilities")
def capabilities():
    return {
        "apiVersion": "2",
        "service": "desk-kernel",
        "backend": "desk_kernel.py",
        "protocolVersion": 2,
        "maxPayloadBytes": 256,
        "acceptedFlags": [0],
        "deterministic": True,
        "arbitraryCompute": False,
        "privilegedWrites": False,
        "origin": "desk",
        "note": "Replacement adapter. Not the Manus wasm.",
    }


@app.get("/api/v2/provenance")
def provenance():
    return {
        "kernel": "Desk DCLM adapter",
        "artifact": "desk_kernel.py",
        "manus": "isolated",
        "protocolVersion": 2,
        "maxPayloadBytes": 256,
        "loadedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(STARTED)),
    }


@app.get("/api/v2/metrics")
def metrics():
    return {
        "requests": len(CALLS),
        "accepted": sum(1 for c in CALLS if c["accepted"]),
        "rejected": sum(1 for c in CALLS if not c["accepted"]),
        "errors": 0,
        "recent": list(reversed(CALLS[-8:])),
        "uptimeSeconds": int(time.time() - STARTED),
    }


@app.post("/api/v2/compute")
async def compute(request: Request):
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"accepted": False, "reason": "not-json"}, status_code=400)
    payload = str(body.get("payload", ""))
    size = len(payload.encode())
    accepted = size <= 256 and body.get("flags", 0) == 0
    row = {
        "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "accepted": accepted,
        "payloadBytes": size,
        "sequence": len(CALLS) + 1,
    }
    CALLS.append(row)
    if not accepted:
        return JSONResponse({**row, "reason": "over-limit"}, status_code=422)
    return {
        **row,
        "reason": 0,
        "inputDigest": digest(payload),
        "stateDigest": digest(str(row["sequence"]) + ":" + payload),
        "protocolVersion": 2,
        "flags": 0,
        "authority": "NONE",
    }


@app.get("/")
def home():
    return FileResponse(ROOT / "index.html")
