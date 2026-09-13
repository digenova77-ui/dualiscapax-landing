"""Dualis portable runtime — Python host.

Invited software layer for Windows / Linux desks and logic controllers
that already run Python. Not an implant. Not a safety system.

Their books stay with them. The agreement binds a hash, not the file.
Operators do not see the books. Models may compute after bind.
Silence is HOLE not zero.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

VERSION = "runtime-py-2026-09-01"
SECRET = re.compile(
    r"(password|passwd|secret|token|apikey|api_key|bearer|authorization|private[_-]?key)",
    re.I,
)
TERMS = (
    "INVITE_ONLY",
    "BOOKS_STAY",
    "OPERATORS_BLIND",
    "MODELS_MAY_COMPUTE",
    "SILENCE_IS_HOLE",
    "NO_NEW_PASSWORD",
    "NO_SIGNED_PARTNER_CLAIM",
)


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def detect_host() -> str:
    sysname = platform.system().lower()
    if sysname == "windows":
        return "windows"
    if sysname == "darwin":
        return "macos"
    if sysname == "linux":
        return "linux"
    return "unknown"


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def hole(reason: str, **extra: Any) -> dict[str, Any]:
    row = {
        "status": "HOLE",
        "reason": reason or "HOLE_NOT_ZERO",
        "host": detect_host(),
        "operators_see": False,
        "models_may_compute": False,
        "scientific_validation": False,
        "ts": utc_now(),
    }
    row.update(extra)
    return row


def store_path() -> Path:
    root = Path(os.environ.get("DUALIS_RUNTIME_HOME") or Path.home() / ".dualis")
    root.mkdir(parents=True, exist_ok=True)
    return root / "agreement.json"


def load_bind() -> dict[str, Any] | None:
    path = store_path()
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def save_bind(row: dict[str, Any]) -> dict[str, Any]:
    store_path().write_text(json.dumps(row, indent=2), encoding="utf-8")
    return row


def hash_books(path: Path) -> dict[str, Any]:
    if not path.exists() or not path.is_file():
        return hole("NO_FILE")
    if SECRET.search(path.name):
        return hole("SECRET_IN_NAME")
    data = path.read_bytes()
    if SECRET.search(data[:4000].decode("utf-8", "ignore")):
        return hole("SECRET_IN_FILE")
    digest = hashlib.sha256(data).hexdigest()
    return {
        "status": "PLUGGED",
        "name": path.name,
        "bytes": path.stat().st_size,
        "hash": digest,
        "stays": "device",
        "raw_payload": False,
    }


def bind(books_hash: str, source: str, invite: bool) -> dict[str, Any]:
    if not invite:
        return hole("NO_INVITE")
    if not books_hash:
        return hole("NO_BOOKS_HASH")
    stamp = utc_now()
    agreement_hash = sha256_text("|".join(TERMS))
    body = "|".join([VERSION, agreement_hash, books_hash, detect_host(), stamp])
    digest = sha256_text(body)
    row = {
        "id": "AGR-" + digest[:12].upper(),
        "year": stamp[:4],
        "source": source,
        "stamp": stamp,
        "status": "BOUND",
        "hash": digest,
        "agreement_hash": agreement_hash,
        "books_hash": books_hash,
        "host": detect_host(),
        "terms": list(TERMS),
        "operators_see": False,
        "models_may_compute": True,
        "raw_payload": False,
        "chain": "WAIT_GRANT",
        "scientific_validation": False,
        "v": VERSION,
    }
    return save_bind(row)


def receipt(row: dict[str, Any] | None) -> dict[str, Any]:
    if not row or row.get("status") != "BOUND":
        return hole((row or {}).get("reason") or "NO_BIND")
    return {
        "id": row["id"],
        "year": row["year"],
        "source": row["source"],
        "stamp": row["stamp"],
        "status": row["status"],
        "hash": row["hash"],
        "agreement_hash": row["agreement_hash"],
        "books_hash": row["books_hash"],
        "host": row["host"],
        "operators_see": False,
        "models_may_compute": True,
        "chain": row.get("chain", "WAIT_GRANT"),
        "scientific_validation": False,
    }


def model_envelope(bound: dict[str, Any]) -> dict[str, Any]:
    rec = receipt(bound)
    if rec.get("status") != "BOUND":
        return rec
    env = {
        "grant": "MEASURE",
        **rec,
    }
    blob = json.dumps(env)
    if SECRET.search(blob):
        return hole("OUTBOUND_REFUSED")
    return env


def invite(file_path: str | None, yes: bool) -> dict[str, Any]:
    if not yes:
        return hole("NO_INVITE", next="Pass --invite. Dualis does not sit down unasked.")
    if not file_path:
        return hole("NO_FILE", next="Point at a sheet on this machine.")
    plugged = hash_books(Path(file_path))
    if plugged.get("status") != "PLUGGED":
        return plugged
    bound = bind(plugged["hash"], plugged["name"], True)
    if bound.get("status") != "BOUND":
        return bound
    return {
        "status": "SEATED",
        "host": detect_host(),
        "v": VERSION,
        "bind": receipt(bound),
        "operators_see": False,
        "models_may_compute": True,
        "scientific_validation": False,
        "ts": utc_now(),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="runtime.dualis",
        description="Invited Dualis runtime. Books stay here. Operators stay blind.",
    )
    parser.add_argument("--invite", action="store_true", help="Explicit seat. Required.")
    parser.add_argument("--file", help="Path to a local sheet. Never uploaded.")
    args = parser.parse_args(argv)
    row = invite(args.file, args.invite)
    sys.stdout.write(json.dumps(row, indent=2) + "\n")
    return 0 if row.get("status") == "SEATED" else 1


if __name__ == "__main__":
    raise SystemExit(main())
