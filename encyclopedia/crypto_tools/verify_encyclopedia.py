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
