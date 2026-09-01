#!/usr/bin/env python3
"""DCLM Layer [0] preflight. Check above before you push.

Fail closed. SEALED is integrity only. Silence is HOLE not zero.
Does not rewrite encyclopedia articles.
"""
from __future__ import annotations

import os, re, sys

AXIOMS = ("NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING")
LAW = "encyclopedia/governance_and_protocols/dclm_layer_zero_law_floor.md"
BIND = "encyclopedia/BIND.md"

# A page that names a job must load the engine that does the job.
PAGE_BINDS = {
    "playground.html": (
        "js/l2-plug.js",
        "js/matrix-cell.js",
        "js/one-net.js",
        "js/api-world.js",
    ),
    "helix.html": (
        "js/helix-tongue.js",
        "js/matrix-cell.js",
    ),
    "ai/app.html": (
        "js/api-config.js",
    ),
}

SECRET = re.compile(
    r"(password|passwd|secret|token|apikey|api_key|bearer|private[_-]?key)\s*[:=]\s*['\"][^'\"]{8,}",
    re.I,
)


def repo_root():
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.dirname(os.path.dirname(here))


def fail(rows):
    print("DCLM PREFLIGHT  FAIL_CLOSED (%s)" % len(rows), file=sys.stderr)
    for r in rows:
        print("  - " + r, file=sys.stderr)
    return 2


def main():
    repo = repo_root()
    rows = []

    law = os.path.join(repo, LAW)
    if not os.path.isfile(law):
        rows.append("MISSING_LAW_FLOOR")
    else:
        text = open(law, encoding="utf-8").read()
        miss = [a for a in AXIOMS if a not in text]
        if miss:
            rows.append("LAW_FLOOR_MISSING_AXIOMS " + ",".join(miss))

    bind = os.path.join(repo, BIND)
    if not os.path.isfile(bind):
        rows.append("MISSING_BIND")
    else:
        t = open(bind, encoding="utf-8").read().upper()
        if "HOLE" not in t:
            rows.append("BIND_MISSING_HOLE_RULE")

    for page, scripts in PAGE_BINDS.items():
        path = os.path.join(repo, page)
        if not os.path.isfile(path):
            rows.append("HOLE_PAGE " + page)
            continue
        body = open(path, encoding="utf-8").read()
        for src in scripts:
            if src not in body:
                rows.append("PAGE_MISSING_ENGINE %s -> %s" % (page, src))
            engine = os.path.join(repo, src)
            if not os.path.isfile(engine):
                rows.append("HOLE_ENGINE " + src)
        if SECRET.search(body):
            rows.append("SECRET_IN_PAGE " + page)

    verify = os.path.join(os.path.dirname(__file__), "verify_encyclopedia.py")
    if os.path.isfile(verify):
        import subprocess
        proc = subprocess.run(
            [sys.executable, verify, "--repo-root", repo, "--report"],
            cwd=repo,
            capture_output=True,
            text=True,
        )
        if proc.returncode != 0:
            tail = (proc.stderr or proc.stdout or "").strip().splitlines()[-8:]
            rows.append("SPINE_FAIL exit=%s" % proc.returncode)
            rows.extend("SPINE  " + line for line in tail)

    if rows:
        return fail(rows)
    print("DCLM PREFLIGHT  PASS")
    print("axioms=" + ",".join(AXIOMS))
    print("silence=HOLE_NOT_ZERO")
    print("scientific_validation=false")
    return 0


if __name__ == "__main__":
    sys.exit(main())
