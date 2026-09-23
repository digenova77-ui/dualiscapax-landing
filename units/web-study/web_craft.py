#!/usr/bin/env python3
"""Downtime study card. Cite-or-hole. Does not claim live 3D rooms."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

TOPICS = [
    {
        "id": "webgl2-fallback",
        "ask": "How does a hall keep one scene if WebGPU is missing?",
        "hold": "Live hall is HTML cards. WebGL cluster is not the apex.",
        "next": "Feature-detect WebGPU, fall back to WebGL2, then to CSS orbs.",
    },
    {
        "id": "wgsl-bind",
        "ask": "What must a WGSL bind group look like for an Iris cluster?",
        "hold": "No live WGSL on dualiscapax.ai/hall/.",
        "next": "One uniform for time + one storage for three sphere origins.",
    },
    {
        "id": "web-gui-depth",
        "ask": "How do we use the phone glass without a chat box?",
        "hold": "Home talks. Hall maps. Lab is the talk door.",
        "next": "Dock stays one line. Doors that 503/404 stay off the dock.",
    },
    {
        "id": "web3-bind",
        "ask": "How does Unity sitting bind a wallet without becoming the key?",
        "hold": "BIND.md: sitting + address + signature. Issued is no.",
        "next": "Do not derive a key from Unity ID. Do not print a seed.",
    },
]


def write(root: Path | None = None) -> Path:
    root = root or Path(".")
    now = datetime.now(timezone.utc)
    topic = TOPICS[now.timetuple().tm_yday % len(TOPICS)]
    dest = root / "research" / "craft"
    dest.mkdir(parents=True, exist_ok=True)
    path = dest / f"{now.strftime('%Y-%m-%d')}-{topic['id']}.json"
    if path.exists():
        return path
    path.write_text(
        json.dumps(
            {
                **topic,
                "captured_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "law": "cite-or-hole — study card, not a live claim",
            },
            indent=2,
        )
        + "\n"
    )
    return path


if __name__ == "__main__":
    print(write())
