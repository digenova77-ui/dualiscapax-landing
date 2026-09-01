#!/usr/bin/env python3
"""Public-face integrity. Fail closed.

The live lander must talk to the people who pay.
A card is not a contract. No invented ministry savings.
SEALED is integrity only.
"""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

BANNED = (
    (r"<h1[^>]*>\s*Truth Prevails\s*</h1>", "index.h1 must not say Truth Prevails"),
    (r"NO\s+TRIBES\s+PREFERRED", "public face still says NO TRIBES PREFERRED"),
    (r"TIME TO SINGULARITY", "public face still counts a singularity clock"),
    (r">take a seat<", "public CTA is still take a seat"),
)

REQUIRED = {
    "index.html": (
        "Your taxes should come home",
        "A card is not a contract",
        "id=\"truth\"",
        "id=\"ntp\"",
    ),
    "for-people.html": (
        "You paid. The work should show up.",
        "send what they recover back into the work",
    ),
    "onboard.html": (
        "A card is not a contract",
        "The books stay on this device",
        "js/seat-deck.js",
    ),
    "js/seat-deck.js": (
        'class="p"',
        "kind: \"gift\"",
        "five-pillars",
    ),
    "research/demo/overtime-demonstration.csv": (
        "DEMONSTRATION",
        "not a signed deal",
    ),
}


def main() -> int:
    errors = []
    index = (ROOT / "index.html").read_text(encoding="utf-8", errors="replace")
    for pat, why in BANNED:
        if re.search(pat, index, re.I):
            errors.append(why)

    for rel, needles in REQUIRED.items():
        path = ROOT / rel
        if not path.is_file():
            errors.append(f"missing {rel}")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                errors.append(f"{rel} missing required text: {needle}")

    halls = (ROOT / "js/seat-deck.js").read_text(encoding="utf-8", errors="replace").count("<i class=\"p\">")
    if halls < 5:
        errors.append("seat-deck.js must paint five pillars")

    print("PUBLIC FACE")
    if errors:
        for e in errors:
            print("FAIL", e)
        print("RESULT FAIL")
        return 1
    print("index civic hero present")
    print("lock ids truth/ntp preserved")
    print("desk cards still five pillars")
    print("demonstration sheet labeled demonstration")
    print("RESULT PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
