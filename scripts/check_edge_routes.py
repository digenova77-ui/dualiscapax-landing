#!/usr/bin/env python3
"""Fail if required edge routes are missing from _worker.js.
Run before packaging. Does not deploy.
"""
from pathlib import Path
import sys

REQUIRED = [
    "/omni",
    "/frontier",
    "/purity",
    "/standing-probe",
    "/receipts/verify",
    "cache-control",
    "no-store",
]
text = Path("_worker.js").read_text()
missing = [r for r in REQUIRED if r not in text]
if missing:
    print("MISSING:", ", ".join(missing))
    sys.exit(1)
print("edge routes present:", ", ".join(REQUIRED[:5]))
