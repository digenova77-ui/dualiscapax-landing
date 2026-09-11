#!/usr/bin/env python3
"""Pack DualisCapax repo into hierarchical-flat zips for manual Cloudflare upload.

Two outputs:
  dist/cloudflare/lander-<stamp>.zip         folders + index.html at root (Pages Direct Upload)
  dist/cloudflare/archive-flat-<stamp>.zip   single-level __ names + mapping JSON

Does not deploy. Does not talk to GitHub Pages or wrangler.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path

LANDER_ROOT = {
    "index.html",
    "why.html",
    "story.html",
    "curtain.html",
    "world.html",
    "ca.html",
    "on.html",
    "qc.html",
    "ab.html",
    "np.html",
    "encyclopedia.html",
    "look.html",
    "onboard.html",
    "unity.html",
    "hub.html",
    "404.html",
    "theme.css",
    "styles.css",
    "CNAME",
    "_headers",
    "robots.txt",
    "sitemap.xml",
    "manifest.webmanifest",
}
LANDER_DIRS = {"js", "css", "data", "hall", "assets", "brand"}
SKIP_DIRS = {
    ".git",
    ".github",
    "node_modules",
    "workers",
    "artifacts",
    ".tmp",
    "dist",
    "__pycache__",
}
SKIP_FILES = {".env", ".DS_Store", "wrangler.toml"}
SKIP_SUFFIX = {".env", ".pem", ".key"}
FLAT_RE = re.compile(r"^(\d{2}_[A-Z0-9]+)__(.+)$")


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def should_skip_file(name: str) -> bool:
    if name in SKIP_FILES:
        return True
    _, ext = os.path.splitext(name)
    return ext.lower() in SKIP_SUFFIX


def walk_files(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in sorted(dirnames) if d not in SKIP_DIRS]
        for name in sorted(filenames):
            if should_skip_file(name):
                continue
            yield Path(dirpath) / name


def flat_to_hierarchy(flat_name: str) -> str | None:
    m = FLAT_RE.match(flat_name)
    if not m:
        return None
    bucket, rest = m.group(1), m.group(2)
    inner = rest.replace("__", "/")
    if bucket.startswith("05_WEB"):
        return inner
    return f"{bucket}/{inner}"


def is_lander_rel(rel: str) -> bool:
    if rel in LANDER_ROOT:
        return True
    top = rel.split("/", 1)[0]
    return top in LANDER_DIRS


def collect(root: Path, lander_only: bool):
    lander = []
    archive = []
    mapping = {}
    for abs_path in walk_files(root):
        rel = abs_path.relative_to(root).as_posix()
        if "/" not in rel:
            hier = flat_to_hierarchy(rel)
            if hier:
                mapping[rel] = {
                    "original_repo_path": hier,
                    "sha256": sha256_file(abs_path),
                    "size_bytes": abs_path.stat().st_size,
                }
                archive.append((abs_path, rel))
                if hier.split("/")[0] in LANDER_DIRS or hier in LANDER_ROOT or rel.startswith("05_WEB__"):
                    lander.append((abs_path, hier))
                continue
        if is_lander_rel(rel):
            lander.append((abs_path, rel))
        if not lander_only:
            archive.append((abs_path, rel.replace("/", "__") if "/" in rel else rel))
            mapping.setdefault(rel.replace("/", "__"), {
                "original_repo_path": rel,
                "sha256": sha256_file(abs_path),
                "size_bytes": abs_path.stat().st_size,
            })
    dest = {}
    for abs_path, rel in lander:
        dest[rel] = abs_path
    lander = [(p, r) for r, p in sorted(dest.items())]
    return lander, archive, mapping


def write_zip(path: Path, pairs):
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for abs_path, arcname in pairs:
            zf.write(abs_path, arcname=arcname)
    return sha256_file(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".", help="repo root")
    ap.add_argument("--lander", action="store_true", help="also emit Cloudflare lander zip")
    ap.add_argument("--full-archive", action="store_true", help="flat-zip the public tree, not just numbered flats")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    stamp = utc_stamp()
    out_dir = root / "dist" / "cloudflare"
    out_dir.mkdir(parents=True, exist_ok=True)

    lander, archive, mapping = collect(root, lander_only=not args.full_archive)

    mapping_path = out_dir / f"00_MASTER_FLAT_MAPPING.{stamp}.json"
    mapping_path.write_text(json.dumps(mapping, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    flat_pairs = list(archive)
    flat_pairs.append((mapping_path, "00_MASTER_FLAT_MAPPING.json"))
    flat_zip = out_dir / f"archive-flat-{stamp}.zip"
    flat_sha = write_zip(flat_zip, flat_pairs)

    result = {
        "schema": "dualis.cf.manual_zip.v1",
        "at": datetime.now(timezone.utc).isoformat(),
        "origin": "cloudflare-manual",
        "github_deploy": False,
        "root": str(root),
        "flat_zip": str(flat_zip.relative_to(root)),
        "flat_zip_sha256": flat_sha,
        "flat_entries": len(flat_pairs),
        "mapping_entries": len(mapping),
    }

    if args.lander:
        lander_zip = out_dir / f"lander-{stamp}.zip"
        lander_sha = write_zip(lander_zip, lander)
        result.update({
            "lander_zip": str(lander_zip.relative_to(root)),
            "lander_zip_sha256": lander_sha,
            "lander_entries": len(lander),
            "has_index": any(rel == "index.html" for _, rel in lander),
        })

    receipt = root / "data" / "cf-last-manual.json"
    receipt.parent.mkdir(parents=True, exist_ok=True)
    receipt.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
