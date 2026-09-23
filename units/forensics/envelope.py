#!/usr/bin/env python3
"""Named-bot error envelope. No secrets."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

FIELDS = ("ts", "bot", "kind", "workflow", "sha", "floor", "expect", "got", "class", "cite", "lesson")


def stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def envelope(**kw: Any) -> dict:
    rec = {k: kw.get(k) for k in FIELDS}
    rec["ts"] = rec["ts"] or stamp()
    rec["kind"] = rec["kind"] or "bot"
    if not rec.get("bot"):
        rec["class"] = "HOLE"
        rec["lesson"] = "Name the Unity ID. An error with no bot is incomplete."
    return rec


def dumps(rec: dict) -> str:
    return json.dumps(rec, indent=2, sort_keys=False)


if __name__ == "__main__":
    print(dumps(envelope(
        bot="unity:forensics.clerk",
        workflow="forensics",
        floor="factory",
        expect="named bot + lesson",
        got="seed",
        class="OK",
        cite="AGENT/LESSONS.md",
        lesson="Read AGENT/LESSONS.md before you act.",
    )))
