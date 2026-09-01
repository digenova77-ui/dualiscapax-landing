#!/usr/bin/env python3
"""Encyclopedia verification spine.

Fail-closed integrity checker for encyclopedia/. This script does not rewrite
article content. It verifies (or generates) encyclopedia/manifest.json against
the files that actually exist in the repository.

SEALED is an integrity state only. A file being SEALED does not mean its
content is scientifically validated, medically validated, or peer-reviewed.
Do not treat any lifecycle state as a scientific claim.

Lifecycle states (explicit, non-scientific):
  INDEXED   — file exists on disk under encyclopedia/
  CATALOGED — file is listed in the committed manifest
  SOURCED   — file carries explicit source / authority / citation metadata
  REVIEWED  — file carries explicit review metadata
  SEALED    — listed file bytes match committed SHA-256 and size
  LIVE      — operator-marked live in the manifest (still not scientific)

Fail-closed conditions (any one is a hard failure):
  - missing manifested file
  - SHA-256 mismatch
  - byte-size mismatch
  - invalid JSON
  - duplicate IDs
  - unresolved references
  - committed manifest does not match actual repository contents
    (ghost entries or unlisted files)

Usage:
  python3 encyclopedia/crypto_tools/verify_encyclopedia.py
  python3 encyclopedia/crypto_tools/verify_encyclopedia.py --write-manifest
  python3 encyclopedia/crypto_tools/verify_encyclopedia.py --report
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple


STATES = ("INDEXED", "CATALOGED", "SOURCED", "REVIEWED", "SEALED", "LIVE")

SEAL_DISCLAIMER = (
    "SEALED is an integrity state only. It does not mean the content is "
    "scientifically validated, medically validated, or peer-reviewed."
)

SKIP_NAMES = {
    "manifest.json",
    ".ds_store",
    "thumbs.db",
    "__pycache__",
}
SKIP_SUFFIXES = (".pyc", ".pyo", ".tmp", ".swp", ".lock")

DOC_ID_RE = re.compile(
    r"(?im)^\s{0,3}(?:[-*]|\*\*)?\s*"
    r"(?:document\s+control\s+id|catalog\s+id|entry\s+id|volume_id|id)\s*"
    r"(?:\*\*)?\s*[:#]\s*(?:\*\*)?\s*"
    r"([A-Z0-9][A-Z0-9._:-]{2,})"
)
FRONT_ID_RE = re.compile(
    r"(?im)^\s*(?:id|document_control_id|catalog_id|volume_id)\s*:\s*"
    r"[\"']?([A-Z0-9][A-Z0-9._:-]{2,})"
)
MD_LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
WIKI_LINK_RE = re.compile(r"\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]")
REF_LINE_RE = re.compile(
    r"(?im)^\s{0,3}(?:[-*]|\d+\.)?\s*"
    r"(?:ref|see|see_also|references?|related(?:_ids)?)\s*:\s*(.+)$"
)
SOURCE_HINT_RE = re.compile(
    r"(?im)^\s{0,3}(?:[-*]|\*\*)?\s*"
    r"(?:source|sources|authority|citation|citations|bibliography|"
    r"references?|orcid)\b"
)
REVIEW_HINT_RE = re.compile(
    r"(?im)^\s{0,3}(?:[-*]|\*\*)?\s*"
    r"(?:reviewed(?:_by|_at)?|reviewer|review\s+date|peer[-\s]?review)\b"
)

JSON_ID_KEYS = (
    "id",
    "document_id",
    "document_control_id",
    "catalog_id",
    "volume_id",
    "entry_id",
    "uid",
)
JSON_REF_KEYS = (
    "ref",
    "$ref",
    "references",
    "refs",
    "see",
    "see_also",
    "related",
    "related_ids",
    "links",
)

# Tooling under crypto_tools/ is part of the spine, not article text.
# Do not mine Python/source for IDs, references, or review hints.
CONTENT_SUFFIXES = (".md", ".json", ".csv", ".yml", ".yaml", ".txt", ".html")


def repo_root_from_here() -> str:
    here = os.path.abspath(__file__)
    # encyclopedia/crypto_tools/this.py -> repo root is parents[2]
    return os.path.dirname(os.path.dirname(os.path.dirname(here)))


def encyclopedia_root(repo_root: str) -> str:
    return os.path.join(repo_root, "encyclopedia")


def posix_rel(path: str, start: str) -> str:
    return os.path.relpath(path, start).replace(os.sep, "/")


def should_skip(name: str) -> bool:
    lower = name.lower()
    if lower in SKIP_NAMES:
        return True
    return lower.endswith(SKIP_SUFFIXES)


def walk_encyclopedia_files(enc_root: str) -> List[str]:
    found: List[str] = []
    for root, dirs, files in os.walk(enc_root):
        dirs[:] = [d for d in dirs if d.lower() not in SKIP_NAMES and not d.startswith(".")]
        for name in files:
            if should_skip(name) or name.startswith("."):
                continue
            found.append(os.path.join(root, name))
    found.sort()
    return found


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_bytes(path: str) -> bytes:
    with open(path, "rb") as handle:
        return handle.read()


def load_json_file(path: str) -> Tuple[Optional[Any], Optional[str]]:
    raw = read_bytes(path)
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        return None, f"not UTF-8 JSON ({exc})"
    try:
        return json.loads(text), None
    except json.JSONDecodeError as exc:
        return None, f"invalid JSON: {exc}"


def collect_json_values(node: Any, keys: Iterable[str]) -> List[Any]:
    wanted = set(keys)
    out: List[Any] = []

    def walk(item: Any) -> None:
        if isinstance(item, dict):
            for key, value in item.items():
                if key in wanted:
                    out.append(value)
                walk(value)
        elif isinstance(item, list):
            for value in item:
                walk(value)

    walk(node)
    return out


def flatten_strings(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value.strip()] if value.strip() else []
    if isinstance(value, (int, float, bool)):
        return [str(value)]
    if isinstance(value, list):
        items: List[str] = []
        for inner in value:
            items.extend(flatten_strings(inner))
        return items
    if isinstance(value, dict):
        items = []
        for inner in value.values():
            items.extend(flatten_strings(inner))
        return items
    return []


def extract_ids_from_text(text: str) -> List[str]:
    ids: List[str] = []
    for match in DOC_ID_RE.finditer(text):
        ids.append(match.group(1).strip().rstrip("*").strip())
    for match in FRONT_ID_RE.finditer(text):
        ids.append(match.group(1).strip().rstrip("*").strip())
    return ids


def extract_ids_from_json(node: Any) -> List[str]:
    ids: List[str] = []
    for value in collect_json_values(node, JSON_ID_KEYS):
        for item in flatten_strings(value):
            if re.match(r"^[A-Za-z0-9][A-Za-z0-9._:-]{2,}$", item):
                ids.append(item)
    return ids


def looks_like_external(ref: str) -> bool:
    lower = ref.strip().lower()
    return (
        lower.startswith("http://")
        or lower.startswith("https://")
        or lower.startswith("mailto:")
        or lower.startswith("data:")
        or lower.startswith("#")
    )


def normalize_ref(raw: str) -> Optional[str]:
    ref = raw.strip().strip("<>").strip().strip("`").strip()
    if not ref:
        return None
    if ref.startswith("<") and ref.endswith(">"):
        ref = ref[1:-1].strip()
    # Drop markdown title suffixes: path "title"
    if " " in ref and not ref.startswith("/"):
        first, rest = ref.split(" ", 1)
        if rest.startswith('"') or rest.startswith("'"):
            ref = first
    ref = ref.split("#", 1)[0].strip()
    if not ref or looks_like_external(ref):
        return None
    # Ignore obvious prose / parenthetical notes
    if " " in ref and not any(sep in ref for sep in ("/", "\\", ".")):
        return None
    return ref.replace("\\", "/")


def extract_refs_from_text(text: str) -> List[str]:
    refs: List[str] = []
    for match in MD_LINK_RE.finditer(text):
        norm = normalize_ref(match.group(1))
        if norm:
            refs.append(norm)
    for match in WIKI_LINK_RE.finditer(text):
        norm = normalize_ref(match.group(1))
        if norm:
            refs.append(norm)
    for match in REF_LINE_RE.finditer(text):
        payload = match.group(1).strip()
        if payload.startswith("[") and "]" in payload:
            # [label](target) already covered by MD_LINK_RE
            continue
        for piece in re.split(r"[,\s]+", payload):
            norm = normalize_ref(piece)
            if norm:
                refs.append(norm)
    return refs


def extract_refs_from_json(node: Any) -> List[str]:
    refs: List[str] = []
    for value in collect_json_values(node, JSON_REF_KEYS):
        for item in flatten_strings(value):
            norm = normalize_ref(item)
            if norm:
                refs.append(norm)
    return refs


def has_source_metadata(text: str, node: Optional[Any]) -> bool:
    if SOURCE_HINT_RE.search(text):
        return True
    if node is not None:
        sourced_keys = collect_json_values(
            node, ("source", "sources", "authority", "citation", "citations", "orcid")
        )
        if any(flatten_strings(value) for value in sourced_keys):
            return True
    return False


def has_review_metadata(text: str, node: Optional[Any]) -> bool:
    if REVIEW_HINT_RE.search(text):
        return True
    if node is not None:
        review_keys = collect_json_values(
            node, ("reviewed", "reviewed_by", "reviewer", "review_date", "peer_review")
        )
        if any(flatten_strings(value) for value in review_keys):
            return True
    return False


def resolve_reference(
    ref: str,
    source_path: str,
    enc_root: str,
    repo_root: str,
    id_index: Dict[str, List[str]],
    disk_relpaths: Set[str],
) -> bool:
    """Return True if the reference resolves to a file, ID, or repo path."""
    if ref in id_index:
        return True
    # Treat documented relative paths as encyclopedia-relative first, then repo.
    candidates = []
    if ref.startswith("/"):
        candidates.append(os.path.join(repo_root, ref.lstrip("/")))
    else:
        source_dir = os.path.dirname(source_path)
        candidates.append(os.path.join(source_dir, ref))
        candidates.append(os.path.join(enc_root, ref))
        candidates.append(os.path.join(repo_root, ref))
        if ref.startswith("encyclopedia/"):
            candidates.append(os.path.join(repo_root, ref))

    for candidate in candidates:
        if os.path.isfile(candidate):
            return True
        rel = posix_rel(candidate, enc_root)
        if not rel.startswith("..") and rel in disk_relpaths:
            return True
    return False


def infer_states(
    *,
    indexed: bool,
    cataloged: bool,
    sourced: bool,
    reviewed: bool,
    sealed: bool,
    live: bool,
) -> List[str]:
    flags = {
        "INDEXED": indexed,
        "CATALOGED": cataloged,
        "SOURCED": sourced,
        "REVIEWED": reviewed,
        "SEALED": sealed,
        "LIVE": live,
    }
    return [name for name in STATES if flags[name]]


def default_manifest_shell() -> Dict[str, Any]:
    return {
        "manifest_version": "2.0",
        "algorithm": "SHA-256",
        "disclaimer": SEAL_DISCLAIMER,
        "states": list(STATES),
        "generated_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "files": {},
    }


def load_manifest(path: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    if not os.path.isfile(path):
        return None, "manifest.json is missing"
    node, err = load_json_file(path)
    if err:
        return None, err
    if not isinstance(node, dict):
        return None, "manifest.json root must be an object"
    files = node.get("files")
    if not isinstance(files, dict):
        return None, "manifest.json missing object field 'files'"
    return node, None


def inspect_file(path: str, enc_root: str) -> Dict[str, Any]:
    data = read_bytes(path)
    rel = posix_rel(path, enc_root)
    record: Dict[str, Any] = {
        "path": rel,
        "abs": path,
        "size_bytes": len(data),
        "sha256": sha256_bytes(data),
        "ids": [],
        "references": [],
        "sourced": False,
        "reviewed": False,
        "json_error": None,
        "is_json": rel.lower().endswith(".json"),
    }
    text = ""
    node: Optional[Any] = None
    mine_content = rel.lower().endswith(CONTENT_SUFFIXES)
    if record["is_json"]:
        node, err = load_json_file(path)
        record["json_error"] = err
        if node is not None:
            record["ids"] = extract_ids_from_json(node)
            record["references"] = extract_refs_from_json(node)
            try:
                text = data.decode("utf-8")
            except UnicodeDecodeError:
                text = ""
    elif mine_content:
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError:
            text = ""
        record["ids"] = extract_ids_from_text(text)
        record["references"] = extract_refs_from_text(text)

    if mine_content:
        record["sourced"] = has_source_metadata(text, node)
        record["reviewed"] = has_review_metadata(text, node)
    # Unique preserve order
    record["ids"] = list(dict.fromkeys(record["ids"]))
    record["references"] = list(dict.fromkeys(record["references"]))
    return record


def build_id_index(records: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    index: Dict[str, List[str]] = defaultdict(list)
    for record in records:
        for item in record["ids"]:
            index[item].append(record["path"])
    return index


def write_manifest(path: str, payload: Dict[str, Any]) -> None:
    text = json.dumps(payload, indent=2, sort_keys=False) + "\n"
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(text)


def generate_manifest(
    records: List[Dict[str, Any]],
    previous: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    previous_files = previous.get("files", {}) if previous else {}
    payload = default_manifest_shell()
    for record in records:
        prior = previous_files.get(record["path"], {})
        live = False
        if isinstance(prior, dict):
            prior_states = prior.get("states") or []
            live = bool(prior.get("live")) or (
                isinstance(prior_states, list) and "LIVE" in prior_states
            )
            if str(prior.get("state", "")).upper() == "LIVE":
                live = True
        states = infer_states(
            indexed=True,
            cataloged=True,
            sourced=record["sourced"],
            reviewed=record["reviewed"],
            sealed=True,  # generated from the bytes just hashed
            live=live,
        )
        payload["files"][record["path"]] = {
            "size_bytes": record["size_bytes"],
            "sha256": record["sha256"],
            "ids": record["ids"],
            "references": record["references"],
            "state": states[-1] if states else "INDEXED",
            "states": states,
            "live": live,
            "scientific_validation": False,
        }
    return payload


def verify(
    records: List[Dict[str, Any]],
    manifest: Dict[str, Any],
    enc_root: str,
    repo_root: str,
) -> List[str]:
    failures: List[str] = []
    files_meta = manifest.get("files", {})
    disk_map = {record["path"]: record for record in records}
    disk_relpaths = set(disk_map)
    id_index = build_id_index(records)

    # Invalid JSON on disk (any encyclopedia JSON except handled below)
    for record in records:
        if record["json_error"]:
            failures.append(f"INVALID_JSON {record['path']}: {record['json_error']}")

    # Manifest completeness against actual repository contents
    manifested = set(files_meta)
    missing = sorted(manifested - disk_relpaths)
    unlisted = sorted(disk_relpaths - manifested)
    for path in missing:
        failures.append(f"MISSING_MANIFESTED_FILE {path}")
    for path in unlisted:
        failures.append(
            f"UNLISTED_REPO_FILE {path} (manifest must match actual repository contents)"
        )

    # Per-entry integrity
    for path, meta in sorted(files_meta.items()):
        if path not in disk_map:
            continue
        if not isinstance(meta, dict):
            failures.append(f"INVALID_MANIFEST_ENTRY {path}: entry must be an object")
            continue
        record = disk_map[path]
        expected_size = meta.get("size_bytes")
        expected_sha = meta.get("sha256")
        if expected_size is None:
            failures.append(f"MISSING_SIZE {path}")
        elif int(expected_size) != record["size_bytes"]:
            failures.append(
                f"SIZE_MISMATCH {path}: manifest={expected_size} disk={record['size_bytes']}"
            )
        if not expected_sha:
            failures.append(f"MISSING_SHA256 {path}")
        elif str(expected_sha).lower() != record["sha256"]:
            failures.append(
                f"SHA256_MISMATCH {path}: manifest={expected_sha} disk={record['sha256']}"
            )

    # Duplicate IDs
    for ident, paths in sorted(id_index.items()):
        unique_paths = sorted(set(paths))
        if len(unique_paths) > 1:
            failures.append(
                f"DUPLICATE_ID {ident}: " + ", ".join(unique_paths)
            )

    # Unresolved references
    for record in records:
        for ref in record["references"]:
            if not resolve_reference(
                ref,
                record["abs"],
                enc_root,
                repo_root,
                id_index,
                disk_relpaths,
            ):
                failures.append(
                    f"UNRESOLVED_REFERENCE {record['path']} -> {ref}"
                )

    # Guardrail: a SEALED label is never scientific validation
    disclaimer = str(manifest.get("disclaimer") or "")
    if "scientifically validated" in disclaimer.lower() and "not" not in disclaimer.lower():
        failures.append(
            "BAD_DISCLAIMER: manifest must not call content scientifically validated"
        )

    return failures


def report_lines(
    records: List[Dict[str, Any]],
    manifest: Optional[Dict[str, Any]],
    failures: List[str],
) -> List[str]:
    files_meta = manifest.get("files", {}) if manifest else {}
    lines = [
        "ENCYCLOPEDIA VERIFICATION SPINE",
        SEAL_DISCLAIMER,
        f"states={','.join(STATES)}",
        f"files_on_disk={len(records)} manifested={len(files_meta)}",
        "",
    ]
    for record in records:
        meta = files_meta.get(record["path"], {}) if isinstance(files_meta.get(record["path"], {}), dict) else {}
        sealed = (
            str(meta.get("sha256", "")).lower() == record["sha256"]
            and int(meta.get("size_bytes", -1)) == record["size_bytes"]
        ) if meta else False
        live = bool(meta.get("live")) if meta else False
        states = infer_states(
            indexed=True,
            cataloged=record["path"] in files_meta,
            sourced=record["sourced"],
            reviewed=record["reviewed"],
            sealed=sealed,
            live=live,
        )
        lines.append(
            f"{record['path']}  {record['size_bytes']}b  "
            f"sha256={record['sha256'][:12]}…  "
            f"ids={record['ids'] or '-'}  "
            f"states={'|'.join(states) or 'INDEXED'}  "
            f"scientific_validation=false"
        )
    lines.append("")
    if failures:
        lines.append(f"FAIL_CLOSED ({len(failures)}):")
        lines.extend(f"  - {item}" for item in failures)
    else:
        lines.append("PASS fail-closed checks")
    return lines


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fail-closed encyclopedia verification spine"
    )
    parser.add_argument(
        "--write-manifest",
        action="store_true",
        help="Generate encyclopedia/manifest.json from actual repository contents",
    )
    parser.add_argument(
        "--report",
        action="store_true",
        help="Print per-file lifecycle states (never claims scientific validation)",
    )
    parser.add_argument(
        "--repo-root",
        default=None,
        help="Override repository root (defaults to two levels above this script)",
    )
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    repo_root = os.path.abspath(args.repo_root or repo_root_from_here())
    enc_root = encyclopedia_root(repo_root)
    manifest_path = os.path.join(enc_root, "manifest.json")

    if not os.path.isdir(enc_root):
        print("FAIL_CLOSED encyclopedia/ directory is missing", file=sys.stderr)
        return 2

    paths = walk_encyclopedia_files(enc_root)
    records = [inspect_file(path, enc_root) for path in paths]
    previous, manifest_err = load_manifest(manifest_path)

    if args.write_manifest:
        payload = generate_manifest(records, previous)
        write_manifest(manifest_path, payload)
        print(
            f"Wrote {manifest_path} ({len(payload['files'])} files). {SEAL_DISCLAIMER}"
        )
        # Re-load and verify the just-written manifest so generate cannot drift.
        previous, manifest_err = load_manifest(manifest_path)

    if manifest_err:
        print(f"FAIL_CLOSED MANIFEST: {manifest_err}", file=sys.stderr)
        return 2

    assert previous is not None
    failures = verify(records, previous, enc_root, repo_root)
    lines = report_lines(records, previous, failures)
    stream = sys.stdout if args.report or not failures else sys.stderr
    print("\n".join(lines), file=stream)
    return 2 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
