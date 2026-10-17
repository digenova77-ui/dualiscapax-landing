#!/usr/bin/env python3
"""Diamond Floor: deterministic artifact inventory and content-addressed provenance.

Standard library only. No network access. No production deployment or DNS writes.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import mimetypes
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

SCHEMA = "dualis.diamond-floor"
VERSION = "1.0.0"
EXCLUDED_DIRS = {".git", ".venv", "venv", "node_modules", "__pycache__", ".pytest_cache", "dist", "build"}
SECRET_NAMES = {"id_rsa", "id_ed25519", "authorized_keys", "credentials.json", ".env", ".env.local", ".env.production"}
SECRET_SUFFIXES = (".pem", ".key", ".p12", ".pfx", ".keystore")
LAYER_ORDER = ["ceiling", "mesh", "floor", "seed", "taproot_bedrock"]


def canonical_bytes(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False).encode("utf-8")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def secret_like(path: Path) -> bool:
    name = path.name.lower()
    return name in SECRET_NAMES or name.endswith(SECRET_SUFFIXES) or name.startswith(".env.")


def classify(path: Path) -> str:
    p = path.as_posix().lower()
    suffix = path.suffix.lower()
    if "photo-archive" in p and suffix in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".tif", ".tiff"}:
        return "research/photo-archive/assets"
    if any(token in p for token in ("dns-audit", "dns_audit", "dns-audit")):
        return "research/photo-archive"
    if suffix in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".tif", ".tiff", ".mp4", ".webm", ".wav", ".mp3"}:
        return "research/media"
    if suffix in {".csv", ".parquet", ".jsonl", ".ndjson"}:
        return "research/data"
    if suffix in {".py", ".js", ".mjs", ".ts", ".tsx", ".rs", ".go", ".sh", ".yml", ".yaml"}:
        return "code"
    if suffix in {".md", ".txt", ".rst"}:
        return "documentation"
    if suffix in {".json", ".toml", ".xml"}:
        return "structured-data"
    return "general-artifact"


def inventory(root: Path) -> dict:
    root = root.resolve()
    entries = []
    skipped = []
    for current, dirs, files in os.walk(root, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d not in EXCLUDED_DIRS)
        current_path = Path(current)
        for filename in sorted(files):
            path = current_path / filename
            rel = path.relative_to(root).as_posix()
            if path.is_symlink():
                skipped.append({"path": rel, "reason": "symlink-not-followed"})
                continue
            if secret_like(path):
                skipped.append({"path": rel, "reason": "secret-like-name"})
                continue
            if not path.is_file():
                continue
            entries.append({
                "path": rel,
                "sha256": sha256_file(path),
                "size_bytes": path.stat().st_size,
                "media_type": mimetypes.guess_type(path.name)[0] or "application/octet-stream",
                "destination_class": classify(Path(rel)),
            })
    entries.sort(key=lambda x: x["path"])
    skipped.sort(key=lambda x: (x["path"], x["reason"]))
    payload = {"schema": SCHEMA + ".inventory.v1", "root_label": root.name, "entries": entries, "skipped": skipped}
    return {**payload, "content_digest": sha256_bytes(canonical_bytes(payload))}


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(canonical_bytes(value) + b"\n")


def ingest(source: Path, archive: Path, source_url: str, creator: str, rights_status: str, license_url: str | None, notes: str) -> dict:
    source = source.resolve()
    if not source.is_file() or source.is_symlink():
        raise ValueError("Source must be an existing regular file; symlinks are rejected.")
    if not source_url.strip() or not creator.strip():
        raise ValueError("source_url and creator_credit are required.")
    allowed = {"public-domain-verified", "license-verified", "permission-granted", "link-only", "needs-review", "restricted"}
    if rights_status not in allowed:
        raise ValueError("Unsupported rights_status; choose an explicit allowed status.")
    raw_hash = sha256_file(source)
    object_path = archive / "assets" / "sha256" / raw_hash[:2] / raw_hash
    object_path.parent.mkdir(parents=True, exist_ok=True)
    if object_path.exists():
        if sha256_file(object_path) != raw_hash:
            raise ValueError("Existing content-addressed object failed hash verification.")
    else:
        shutil.copyfile(source, object_path)
        if sha256_file(object_path) != raw_hash:
            object_path.unlink(missing_ok=True)
            raise ValueError("Copied object failed hash verification.")
    media_type = mimetypes.guess_type(source.name)[0] or "application/octet-stream"
    manifest = {
        "schema": "dualis.diamond-floor.artifact.v1",
        "artifact_id": raw_hash,
        "sha256": raw_hash,
        "media_type": media_type,
        "original_filename": source.name,
        "source_url": source_url,
        "creator_credit": creator,
        "rights_status": rights_status,
        "license_url": license_url,
        "retrieved_at_utc": utc_now(),
        "object_path": object_path.relative_to(archive).as_posix(),
        "notes": notes,
    }
    manifest_path = archive / "provenance" / (raw_hash + ".json")
    if manifest_path.exists():
        old = json.loads(manifest_path.read_text(encoding="utf-8"))
        for key in ("sha256", "source_url", "creator_credit", "rights_status", "license_url"):
            if old.get(key) != manifest.get(key):
                raise ValueError("Conflicting provenance already exists for this hash; review manually.")
    else:
        write_json(manifest_path, manifest)
    ledger_path = archive / "provenance" / "ledger.jsonl"
    previous = "0" * 64
    if ledger_path.exists():
        lines = [line for line in ledger_path.read_text(encoding="utf-8").splitlines() if line.strip()]
        if lines:
            previous_record = json.loads(lines[-1])
            previous = previous_record.get("record_digest", "")
            if len(previous) != 64:
                raise ValueError("Last ledger record has an invalid digest.")
    event = {
        "schema": SCHEMA + ".ledger-event.v1",
        "event": "ARTIFACT_INGESTED",
        "artifact_sha256": raw_hash,
        "manifest_path": manifest_path.relative_to(archive).as_posix(),
        "previous_record_digest": previous,
        "recorded_at_utc": utc_now(),
    }
    event["record_digest"] = sha256_bytes(canonical_bytes(event))
    with ledger_path.open("ab") as stream:
        stream.write(canonical_bytes(event) + b"\n")
    return {"status": "PASS", "sha256": raw_hash, "object_path": str(object_path), "manifest_path": str(manifest_path), "record_digest": event["record_digest"]}


def verify_ledger(ledger: Path) -> dict:
    if not ledger.exists():
        return {"status": "BLOCKED", "reason": "ledger-missing", "verified_records": 0}
    previous = "0" * 64
    count = 0
    for line_no, line in enumerate(ledger.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError:
            return {"status": "FAIL", "reason": "invalid-json", "line": line_no, "verified_records": count}
        claimed = record.pop("record_digest", None)
        if record.get("previous_record_digest") != previous:
            return {"status": "FAIL", "reason": "broken-chain", "line": line_no, "verified_records": count}
        actual = sha256_bytes(canonical_bytes(record))
        if claimed != actual:
            return {"status": "FAIL", "reason": "digest-mismatch", "line": line_no, "verified_records": count}
        previous = claimed
        count += 1
    return {"status": "PASS", "verified_records": count, "head_digest": previous}


def derivative(before: dict, after: dict) -> dict:
    a = {entry["path"]: entry for entry in before.get("entries", [])}
    b = {entry["path"]: entry for entry in after.get("entries", [])}
    added = sorted(k for k in b.keys() - a.keys())
    removed = sorted(k for k in a.keys() - b.keys())
    changed = sorted(k for k in a.keys() & b.keys() if a[k]["sha256"] != b[k]["sha256"])
    payload = {
        "schema": SCHEMA + ".derivative.v1",
        "baseline_digest": before.get("content_digest"),
        "candidate_digest": after.get("content_digest"),
        "added": [{"path": k, "sha256": b[k]["sha256"], "destination_class": b[k]["destination_class"]} for k in added],
        "removed": [{"path": k, "sha256": a[k]["sha256"], "destination_class": a[k]["destination_class"]} for k in removed],
        "changed": [{"path": k, "before_sha256": a[k]["sha256"], "after_sha256": b[k]["sha256"], "destination_class": b[k]["destination_class"]} for k in changed],
        "change_count": len(added) + len(removed) + len(changed),
        "status": "PASS" if not (added or removed or changed) else "PARTIAL",
        "promotion": "NOT_AUTHORIZED",
        "policy": "Changes are reported, never automatically promoted or deployed.",
    }
    return {**payload, "derivative_digest": sha256_bytes(canonical_bytes(payload))}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    inv = sub.add_parser("inventory", help="Hash and classify files under a selected root.")
    inv.add_argument("root", type=Path)
    inv.add_argument("--out", type=Path, required=True)
    diff = sub.add_parser("derive", help="Create a deterministic derivative between two inventory JSON files.")
    diff.add_argument("baseline", type=Path)
    diff.add_argument("candidate", type=Path)
    diff.add_argument("--out", type=Path, required=True)
    ing = sub.add_parser("ingest", help="Copy a local file into a SHA-256 content-addressed archive.")
    ing.add_argument("source", type=Path)
    ing.add_argument("--archive", type=Path, required=True)
    ing.add_argument("--source-url", required=True)
    ing.add_argument("--creator", required=True)
    ing.add_argument("--rights-status", required=True)
    ing.add_argument("--license-url")
    ing.add_argument("--notes", default="")
    ver = sub.add_parser("verify-ledger", help="Verify the append-only hash chain.")
    ver.add_argument("ledger", type=Path)
    args = parser.parse_args()
    try:
        if args.command == "inventory":
            report = inventory(args.root)
            write_json(args.out, report)
        elif args.command == "derive":
            before = json.loads(args.baseline.read_text(encoding="utf-8"))
            after = json.loads(args.candidate.read_text(encoding="utf-8"))
            report = derivative(before, after)
            write_json(args.out, report)
        elif args.command == "ingest":
            report = ingest(args.source, args.archive, args.source_url, args.creator, args.rights_status, args.license_url, args.notes)
        else:
            report = verify_ledger(args.ledger)
        print(json.dumps(report, indent=2, ensure_ascii=False))
        return 0 if report.get("status", "PASS") in {"PASS", "PARTIAL"} else 2
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "FAIL", "error": str(exc)}, indent=2), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
