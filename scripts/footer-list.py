#!/usr/bin/env python3
"""List <footer> inner text. Dry-run only. Does not write files."""
from __future__ import annotations

import argparse
import re
from pathlib import Path

FOOTER = re.compile(r"<footer\b[^>]*>(.*?)</footer>", re.I | re.S)
SKIP = {".git", "node_modules", "workers", ".env"}


def walk(root: Path):
    for p in root.rglob("*.html"):
        if any(part in SKIP for part in p.parts):
            continue
        yield p


def text_of(html: str) -> list[str]:
    out = []
    for m in FOOTER.finditer(html):
        raw = re.sub(r"<[^>]+>", " ", m.group(1))
        raw = re.sub(r"\s+", " ", raw).strip()
        if raw:
            out.append(raw)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description="Dry-run footer inventory")
    ap.add_argument("root", nargs="?", default=".")
    args = ap.parse_args()
    root = Path(args.root).resolve()
    n = 0
    for p in sorted(walk(root)):
        body = p.read_text(encoding="utf-8", errors="replace")
        for t in text_of(body):
            n += 1
            rel = p.relative_to(root)
            print(f"{rel}\t{t[:240]}")
    print(f"# footers={n} delete=no")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
