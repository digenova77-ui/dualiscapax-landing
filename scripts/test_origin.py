#!/usr/bin/env python3
"""Smoke-test the loopback origin without sending PII or granting authority."""
from __future__ import annotations

import json
import sys
from urllib.error import HTTPError
from urllib.request import Request, urlopen

BASE = "http://127.0.0.1:8080"
LAW = ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"]


def call(path: str, method: str = "GET", body: dict | None = None) -> tuple[int, dict]:
    data = None if body is None else json.dumps(body).encode()
    req = Request(BASE + path, data=data, method=method, headers={"content-type": "application/json"})
    try:
        with urlopen(req, timeout=5) as response:
            return response.status, json.load(response)
    except HTTPError as error:
        return error.code, json.load(error)


def check(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


status, body = call("/health")
check(status == 200 and body["ok"] is True and body["pii_coefficient"] == 0.0, "health")

clean = {"api_version": "2", "law": LAW, "authority": "NONE", "pii_coefficient": 0, "nodes": 8}
status, body = call("/v2/dclm/sandbox/execute", "POST", clean)
check(status == 200 and body["verdict"] == "SEE" and body["authority"] == "NONE", "clean request admitted")
check(len(body["receipt"]) == 64, "receipt is SHA-256")

status, body = call("/v2/dclm/sandbox/execute", "POST", {**clean, "name": "must-not-be-stored"})
check(status == 400 and body["verdict"] == "HOLE", "PII rejected")

status, body = call("/v2/dclm/ingest", "POST", {"source": "unity", "payload": {"nested": {"email": "must-not-be-stored"}}})
check(status == 400 and body["verdict"] == "HOLE", "nested PII rejected")

status, body = call("/v2/dclm/ingest", "POST", {"source": "unity", "payload": clean})
check(status == 200 and body["verdict"] == "SEE" and body["ingress"] == "unity", "Unity ingress admitted")

status, body = call("/v2/dclm/ingest", "POST", {"source": "unknown", "payload": clean})
check(status == 422 and body["verdict"] == "HOLE", "unknown ingress rejected")

status, body = call("/v2/dclm/sandbox/execute", "POST", {**clean, "law": LAW[:-1]})
check(status == 422 and body["verdict"] == "HOLE", "law drift rejected")

status, body = call("/v2/dclm/sandbox/execute", "POST", {**clean, "authority": "FATHER"})
check(status == 422 and body["verdict"] == "HOLE", "authority is not granted by origin")

status, body = call("/v2/receipts")
check(status == 200 and body["count"] >= 4, "receipts are measurable")

status, body = call("/v2/dclm/session/purge", "POST")
check(status == 200 and body["verdict"] == "CLEANED", "purge")
status, body = call("/v2/receipts")
check(status == 200 and body["count"] == 0 and body["tip"] is None, "purge removes receipts")

print("origin smoke: PASS (SEE/HOLE/CLEANED, PII rejection, law-floor rejection, no authority grant)")
