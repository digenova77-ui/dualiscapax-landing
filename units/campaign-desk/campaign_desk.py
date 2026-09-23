#!/usr/bin/env python3
"""Write one campaign draft per tick. Never post."""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "research" / "campaigns"

PLATES = [
    {
        "id": "look",
        "channel": "x",
        "brand": "Unity Network",
        "body": "Walk the rooms. Look is free. You do not buy a costume to enter. Iris can walk with you.",
        "claims": ["look is free", "no costume to enter"],
    },
    {
        "id": "unity-id",
        "channel": "x",
        "brand": "Unity Network",
        "body": "One Unity ID. Passphrase, face, or thumb. No old password. The wallet binds after. The ID cannot spend for you.",
        "claims": ["Unity ID is not the key", "no old password"],
    },
    {
        "id": "efuse",
        "channel": "x",
        "brand": "Unity Network",
        "body": "eFuse is the unit. It is not issued. A gift is not a purchase. During beta a room and a swarm lease stay free.",
        "claims": ["not issued", "gift is not a purchase"],
    },
    {
        "id": "armistice",
        "channel": "x",
        "brand": "Unity Network",
        "body": "An attack is a throw. Each binder closes their own doors. No raid. That pact is written. It is not in force.",
        "claims": ["no raid", "not in force"],
    },
]

DROP = (
    "issued is yes",
    "listed",
    "nodes support a nation",
    "live alliance",
    "posted",
    "impressions",
)


def dclm(plate: dict) -> dict:
    text = " ".join([plate["body"], *plate["claims"]]).lower()
    dropped = [w for w in DROP if w in text]
    if len(plate["body"]) > 280:
        dropped.append("over-280")
    if plate.get("status") == "posted":
        dropped.append("posted-without-gate")
    return {**plate, "dropped": dropped, "ok": not dropped}


def pick(now: datetime) -> dict:
    return PLATES[now.timetuple().tm_yday % len(PLATES)]


def write(now: datetime | None = None, out: Path = OUT) -> Path:
    now = now or datetime.now(timezone.utc)
    plate = dclm({**pick(now), "status": "draft", "posted": False})
    if not plate["ok"]:
        raise SystemExit(f"DCLM dropped {plate['dropped']}")
    digest = hashlib.sha256(plate["body"].encode()).hexdigest()[:12]
    day = now.strftime("%Y-%m-%d")
    dest = out / "drafts"
    dest.mkdir(parents=True, exist_ok=True)
    path = dest / f"{day}-{plate['id']}-{digest}.json"
    if path.exists():
        return path
    record = {
        **plate,
        "captured_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "hash": digest,
        "gate": "Unity bind <sitting> campaign " + plate["id"],
        "two_checks": ["signed bind", "watcher sees a live URL twice"],
    }
    path.write_text(json.dumps(record, indent=2) + "\n")
    return path


if __name__ == "__main__":
    print(write())
