#!/usr/bin/env python3
"""Restore __ flat names (or a flat zip) into folder hierarchy.

Successor to 00_RESTORE_TO_REPO_STRUCTURE.py that also works without a
pre-written mapping: 05_WEB__research__access.html → research/access.html
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import zipfile
from pathlib import Path

FLAT_RE = re.compile(r"^(\d{2}_[A-Z0-9]+)__(.+)$")


def dest_from_flat(name: str) -> str | None:
    m = FLAT_RE.match(name)
    if not m:
        return None
    bucket, rest = m.group(1), m.group(2)
    inner = rest.replace("__", "/")
    if bucket.startswith("05_WEB"):
        return inner
    return f"{bucket}/{inner}"


def restore_dir(src: Path, dest: Path, mapping: dict | None) -> int:
    n = 0
    for item in sorted(src.iterdir()):
        if not item.is_file():
            continue
        if mapping and item.name in mapping:
            target = dest / mapping[item.name]["original_repo_path"]
        else:
            rel = dest_from_flat(item.name)
            if not rel:
                continue
            target = dest / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(item, target)
        print(f"{item.name} -> {target.relative_to(dest)}")
        n += 1
    return n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=".", help="directory of flat files, or a .zip")
    ap.add_argument("--dest", default="./restored")
    ap.add_argument("--mapping", default="", help="optional 00_MASTER_FLAT_MAPPING.json")
    args = ap.parse_args()

    src = Path(args.src)
    dest = Path(args.dest)
    dest.mkdir(parents=True, exist_ok=True)
    mapping = None
    if args.mapping:
        mapping = json.loads(Path(args.mapping).read_text())

    if src.is_file() and src.suffix.lower() == ".zip":
        tmp = dest / ".flat_unpack"
        if tmp.exists():
            shutil.rmtree(tmp)
        tmp.mkdir()
        with zipfile.ZipFile(src) as zf:
            zf.extractall(tmp)
        map_path = tmp / "00_MASTER_FLAT_MAPPING.json"
        if map_path.exists() and mapping is None:
            mapping = json.loads(map_path.read_text())
        n = restore_dir(tmp, dest, mapping)
        shutil.rmtree(tmp)
    else:
        n = restore_dir(src, dest, mapping)
    print(f"restored {n} files into {dest}")


if __name__ == "__main__":
    main()
