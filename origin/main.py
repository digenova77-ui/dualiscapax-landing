"""Local API V2 origin. 127.0.0.1:8080. No house key. No PII store."""
from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

LAW = ("NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING")
ROOT = Path(__file__).resolve().parent.parent / "playground"
RECEIPTS: list[dict] = []
MAX_BODY_BYTES = 64 * 1024
PERSON_KEYS = {"email", "name", "phone", "address", "prompt", "passphrase", "private_key", "seed_phrase"}

app = FastAPI(title="DualisCapax API V2 origin", version="2")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8080", "http://localhost:8080"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["content-type"],
)


def canonical_json(payload: object) -> str:
    return json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha256(payload: object) -> str:
    raw = canonical_json(payload).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def hole(why: str, parent: str = "0" * 64) -> dict:
    body = {
        "api_version": "2",
        "verdict": "HOLE",
        "authority": "NONE",
        "pii_coefficient": 0.0,
        "law": list(LAW),
        "why": why,
        "parent": parent,
        "ts": int(time.time()),
    }
    body["receipt"] = sha256(body)
    RECEIPTS.append({"receipt": body["receipt"], "verdict": "HOLE"})
    return body


def admit(ask: dict) -> dict:
    parent = RECEIPTS[-1]["receipt"] if RECEIPTS else "0" * 64
    if ask.get("pii_coefficient", 0) != 0:
        return hole("PII coefficient is not 0.00", parent)
    missing = [name for name in LAW if name not in ask.get("law", LAW)]
    if missing:
        return hole("law floor drift: " + ",".join(missing), parent)
    if ask.get("authority") not in (None, "NONE"):
        return hole("origin does not grant authority", parent)
    body = {
        "api_version": "2",
        "verdict": "SEE",
        "authority": "NONE",
        "ingress": ask.get("source", "sandbox"),
        "input_hash": sha256(ask),
        "pii_coefficient": 0.0,
        "law": list(LAW),
        "dccp": "NOT_ATTESTED",
        "parent": parent,
        "ts": int(time.time()),
        "saw": {
            "rings": 6,
            "towers": ["DCLM", "IRIS"],
            "nodes": ask.get("nodes", 0),
        },
    }
    body["receipt"] = sha256(body)
    RECEIPTS.append({"receipt": body["receipt"], "verdict": "SEE"})
    return body


def carries_person_field(value: object) -> bool:
    """Reject sensitive field names at any nesting depth before admission."""
    if isinstance(value, dict):
        if any(str(key).lower() in PERSON_KEYS for key in value):
            return True
        return any(carries_person_field(child) for child in value.values())
    if isinstance(value, list):
        return any(carries_person_field(child) for child in value)
    return False


@app.get("/health")
def health():
    return {"ok": True, "api_version": "2", "origin": "127.0.0.1:8080", "pii_coefficient": 0.0}


@app.get("/v2/capabilities")
def capabilities():
    return {
        "api_version": "2",
        "jacket": "SANDBOX",
        "access": "closed",
        "house_key": "disabled",
        "pii_coefficient": 0.0,
        "law": list(LAW),
        "chat": "HOLE",
        "why_chat": "no house key on this origin",
    }


@app.get("/v2/dclm/telemetry/circuit-breaker")
def breaker():
    return {"ok": True, "pii_coefficient": 0.0, "latency_budget_ms": 4.2, "measured": False}


@app.post("/v2/dclm/sandbox/execute")
async def execute(request: Request):
    try:
        raw = await request.body()
        if len(raw) > MAX_BODY_BYTES:
            return JSONResponse(hole("body exceeds local size limit"), status_code=413)
        ask = json.loads(raw)
    except Exception:
        return JSONResponse(hole("body is not JSON"), status_code=400)
    if not isinstance(ask, dict):
        return JSONResponse(hole("body is not an object"), status_code=400)
    # Do not retain, hash, or partially process sensitive payloads.
    if carries_person_field(ask):
        return JSONResponse(hole("payload carried a person field"), status_code=400)
    out = admit(ask)
    code = 200 if out["verdict"] == "SEE" else 422
    return JSONResponse(out, status_code=code)


@app.post("/v2/dclm/ingest")
async def ingest(request: Request):
    """Single read-only ingress for builder, Unity, and other local clients."""
    try:
        raw = await request.body()
        if len(raw) > MAX_BODY_BYTES:
            return JSONResponse(hole("body exceeds local size limit"), status_code=413)
        envelope = json.loads(raw)
    except Exception:
        return JSONResponse(hole("ingress envelope is not JSON"), status_code=400)
    if not isinstance(envelope, dict):
        return JSONResponse(hole("ingress envelope is not an object"), status_code=400)
    source = envelope.get("source")
    payload = envelope.get("payload")
    if source not in {"builder", "unity", "webgl", "origin"}:
        return JSONResponse(hole("ingress source is not allowlisted"), status_code=422)
    if not isinstance(payload, dict):
        return JSONResponse(hole("ingress payload is not an object"), status_code=422)
    if carries_person_field(envelope):
        return JSONResponse(hole("ingress carried a person field"), status_code=400)
    payload = {**payload, "source": source}
    out = admit(payload)
    code = 200 if out["verdict"] == "SEE" else 422
    return JSONResponse(out, status_code=code)


@app.post("/v2/dclm/session/purge")
def purge():
    RECEIPTS.clear()
    return {"ok": True, "verdict": "CLEANED", "pii_coefficient": 0.0}


@app.get("/v2/receipts")
def receipts():
    return {"count": len(RECEIPTS), "tip": RECEIPTS[-1] if RECEIPTS else None}


@app.get("/")
def playground():
    return FileResponse(ROOT / "index.html")


app.mount("/static", StaticFiles(directory=ROOT), name="static")
