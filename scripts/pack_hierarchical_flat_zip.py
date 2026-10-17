#!/usr/bin/env python3
"""Create a reproducible, repository-root Cloudflare Pages ZIP.

The archive preserves repository-relative paths because the Pages build output
is configured as "." and _worker.js must remain at the archive root. It only
packages Git-tracked files, never local untracked files or secrets. It does
not upload or deploy anything.
"""
from __future__ import annotations

import argparse
import hashlib
import os
import subprocess
import sys
import zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "dist" / "cloudflare"
DENIED_PARTS = {".git", ".wrangler", "node_modules", ".cloudflare", "secrets"}
DENIED_NAMES = {
    ".env", ".env.production", ".env.local", "credentials.json",
    "id_rsa", "id_ed25519", "id_ecdsa",
}
DENIED_SUFFIXES = {".pem", ".key", ".p12", ".pfx"}
REQUIRED = {"index.html", "_worker.js", "wrangler.toml"}


def tracked_paths() -> list[Path]:
    try:
        result = subprocess.run(
            ["git", "-C", str(ROOT), "ls-files", "-z"],
            check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        )
    except (OSError, subprocess.CalledProcessError) as exc:
        raise RuntimeError("Run this packer inside a Git checkout.") from exc
    raw_paths = [p for p in result.stdout.decode("utf-8").split("\0") if p]
    selected: list[Path] = []
    for raw in raw_paths:
        rel = PurePosixPath(raw)
        parts = set(rel.parts)
        name = rel.name.lower()
        if parts & DENIED_PARTS or name in DENIED_NAMES:
            continue
        if name.startswith(".env.") or Path(name).suffix in DENIED_SUFFIXES:
            continue
        path = ROOT.joinpath(*rel.parts)
        if path.is_file() and not path.is_symlink():
            selected.append(path)
    return sorted(selected, key=lambda p: p.relative_to(ROOT).as_posix())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lander", action="store_true",
                        help="build the Cloudflare Pages landing ZIP (required)")
    parser.add_argument("--check", action="store_true",
                        help="validate inputs and print the file list without writing")
    args = parser.parse_args()
    if not args.lander:
        parser.error("pass --lander to explicitly select the Cloudflare Pages package")

    try:
        paths = tracked_paths()
        rels = [p.relative_to(ROOT).as_posix() for p in paths]
        missing = sorted(REQUIRED - set(rels))
        if missing:
            raise RuntimeError("Required Pages files missing from Git: " + ", ".join(missing))
        if len(rels) != len(set(rels)):
            raise RuntimeError("Duplicate archive paths detected")
        if args.check:
            print("CHECK=PASS")
            print("MODE=lander")
            print("ROOT=_worker.js and wrangler.toml included")
            print("FILES=" + str(len(rels)))
            for rel in rels:
                print(rel)
            return 0

        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        commit = subprocess.run(
            ["git", "-C", str(ROOT), "rev-parse", "--short=12", "HEAD"],
            check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
        ).stdout.strip()
        zip_path = OUTPUT_DIR / f"lander-{commit}.zip"
        tmp_path = zip_path.with_suffix(".zip.tmp")
        try:
            with zipfile.ZipFile(tmp_path, "w", compression=zipfile.ZIP_DEFLATED,
                                 compresslevel=9) as archive:
                for path in paths:
                    rel = path.relative_to(ROOT).as_posix()
                    info = zipfile.ZipInfo(rel, date_time=(2020, 1, 1, 0, 0, 0))
                    info.compress_type = zipfile.ZIP_DEFLATED
                    info.external_attr = (0o100644 & 0xFFFF) << 16
                    archive.writestr(info, path.read_bytes())
            # Validate archive before publishing its local output name.
            with zipfile.ZipFile(tmp_path, "r") as archive:
                names = archive.namelist()
                if len(names) != len(set(names)) or not REQUIRED.issubset(set(names)):
                    raise RuntimeError("Archive verification failed: duplicate or missing required files")
                bad = archive.testzip()
                if bad:
                    raise RuntimeError("ZIP CRC validation failed for " + bad)
            tmp_path.replace(zip_path)
        finally:
            if tmp_path.exists():
                tmp_path.unlink()

        digest = hashlib.sha256(zip_path.read_bytes()).hexdigest()
        sha_path = zip_path.with_suffix(".zip.sha256")
        sha_path.write_text(f"{digest}  {zip_path.name}\n", encoding="ascii")
        print("PACKAGE=PASS")
        print(f"COMMIT={commit}")
        print(f"FILES={len(rels)}")
        print(f"ZIP={zip_path.relative_to(ROOT).as_posix()}")
        print(f"SHA256={digest}")
        print(f"SHA256_FILE={sha_path.relative_to(ROOT).as_posix()}")
        print("DEPLOYED=NO (manual Cloudflare Pages upload required)")
        return 0
    except (RuntimeError, OSError, subprocess.CalledProcessError, zipfile.BadZipFile) as exc:
        print(f"PACKAGE=BLOCKED: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
