#!/usr/bin/env python3
"""List or strip HTML <footer>…</footer> on the desk.

Default: dry-run (print path + footer text). Does not touch live zip.
  python3 scripts/strip-footers.py
  python3 scripts/strip-footers.py --apply
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FOOTER = re.compile(r"<footer\b[^>]*>.*?</footer>", re.I | re.S)
SKIP_PARTS = {
    ".git",
    "node_modules",
    "workers",
    ".github",
}


def skip(p: Path) -> bool:
    return any(part in SKIP_PARTS for part in p.parts)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="rewrite files (desk only)")
    args = ap.parse_args()
    hits = 0
    for path in sorted(ROOT.rglob("*.html")):
        if skip(path):
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        found = FOOTER.findall(text)
        if not found:
            continue
        rel = path.relative_to(ROOT)
        for block in found:
            hits += 1
            one = re.sub(r"\s+", " ", block).strip()
            print(f"{rel}: {one[:200]}")
        if args.apply:
            new = FOOTER.sub("", text)
            path.write_text(new, encoding="utf-8")
            print(f"  stripped {rel}")
    print(f"# {hits} footer(s). apply={args.apply}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
