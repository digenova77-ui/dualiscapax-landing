#!/usr/bin/env python3
"""Encyclopedia spine — one walk, fail closed.

SEALED is integrity only. Silence is HOLE not zero.
Does not rewrite articles. Does not claim scientific validation.
"""
from __future__ import annotations

import argparse, hashlib, json, os, re, sys
from datetime import datetime, timezone

STATES = ("INDEXED", "CATALOGED", "SOURCED", "REVIEWED", "SEALED", "LIVE")
AXIOMS = ("NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING")
DISCLAIMER = (
    "SEALED is an integrity state only. It does not mean the content is "
    "scientifically validated, medically validated, or peer-reviewed."
)
SKIP = {".ds_store", "thumbs.db", "__pycache__", "manifest.json"}
CONTENT = (".md", ".json", ".csv", ".yml", ".yaml", ".txt", ".html")
ID_DIRS = ("governance_and_protocols/", "ai_systems_internal/", "medical_biophysical/")
LAW = "governance_and_protocols/dclm_layer_zero_law_floor.md"
BIND = "BIND.md"
RUNTIME = (
    "js/dsap-engine.js", "js/iris-av.js", "js/iris-hologram.js",
    "js/av-bridge.js", "js/api-v2.js", "js/api-unified.js", "onboard.html",
)
ID_RE = re.compile(
    r"(?im)^\s{0,3}(?:[-*]|\*\*)?\s*"
    r"(?:document\s+control(?:\s+id)?|catalog\s+id|entry\s+id|volume_id|id)\s*"
    r"(?:\*\*)?\s*[:#]\s*(?:\*\*)?\s*([A-Z0-9][A-Z0-9._:-]{2,})"
)
MD_LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
YEAR_RE = re.compile(r"(?:19|20)\d{2}")
STAMP_RE = re.compile(r"20\d{2}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?Z?)?")
JSON_ID_KEYS = {"id", "document_id", "document_control_id", "catalog_id", "volume_id", "entry_id", "uid"}
JSON_REF_KEYS = {"ref", "$ref", "references", "refs", "see", "see_also", "related", "related_ids"}


def root_from_here():
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def enc_root(repo):
    return os.path.join(repo, "encyclopedia")


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def walk(enc):
    out = []
    for base, dirs, files in os.walk(enc):
        dirs[:] = [d for d in dirs if d.lower() not in SKIP and not d.startswith(".")]
        for name in files:
            low = name.lower()
            if low in SKIP or low.startswith(".") or low.endswith((".pyc", ".pyo", ".tmp", ".swp")):
                continue
            out.append(os.path.join(base, name))
    out.sort()
    return out


def rel_of(path, start):
    return os.path.relpath(path, start).replace(os.sep, "/")


def pull_json_vals(node, keys, acc):
    if isinstance(node, dict):
        for k, v in node.items():
            if k in keys:
                acc.append(v)
            pull_json_vals(v, keys, acc)
    elif isinstance(node, list):
        for v in node:
            pull_json_vals(v, keys, acc)


def flat_str(v):
    if v is None:
        return []
    if isinstance(v, str):
        return [v.strip()] if v.strip() else []
    if isinstance(v, (int, float, bool)):
        return [str(v)]
    if isinstance(v, list):
        out = []
        for i in v:
            out.extend(flat_str(i))
        return out
    if isinstance(v, dict):
        out = []
        for i in v.values():
            out.extend(flat_str(i))
        return out
    return []


def inspect(path, enc):
    data = open(path, "rb").read()
    rel = rel_of(path, enc)
    rec = {
        "path": rel, "abs": path, "size": len(data), "sha256": sha256(data),
        "ids": [], "refs": [], "sourced": False, "reviewed": False,
        "year": None, "source": None, "stamp": None, "hole": False,
        "json_err": None, "text": "",
    }
    mine = rel.lower().endswith(CONTENT)
    text = ""
    node = None
    if rel.lower().endswith(".json"):
        try:
            text = data.decode("utf-8")
            node = json.loads(text)
        except UnicodeDecodeError as e:
            rec["json_err"] = "not UTF-8 (%s)" % e
        except json.JSONDecodeError as e:
            rec["json_err"] = "invalid JSON: %s" % e
        if node is not None:
            ids, refs = [], []
            pull_json_vals(node, JSON_ID_KEYS, ids)
            pull_json_vals(node, JSON_REF_KEYS, refs)
            rec["ids"] = [s for v in ids for s in flat_str(v) if re.match(r"^[A-Za-z0-9][A-Za-z0-9._:-]{2,}$", s)]
            rec["refs"] = [s for v in refs for s in flat_str(v) if s and not s.lower().startswith(("http", "mailto", "#"))]
    elif mine:
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError:
            text = ""
        rec["ids"] = list(dict.fromkeys(ID_RE.findall(text)))
        rec["refs"] = []
        for m in MD_LINK_RE.finditer(text):
            raw = m.group(1).split()[0].split("#")[0].strip("<>`\"'")
            if raw and not raw.lower().startswith(("http", "mailto", "data:", "#")):
                rec["refs"].append(raw)
    rec["text"] = text
    if mine:
        url = re.search(r"https?://[^\s)>"]+", text or "")
        rec["source"] = (url.group(0).rstrip(".,;`")[:240] if url else None)
        rec["sourced"] = bool(rec["source"])
        rec["year"] = None
        for ident in rec["ids"]:
            y = YEAR_RE.search(ident)
            if y:
                rec["year"] = y.group(0)
                break
        if not rec["year"]:
            y = YEAR_RE.search(text or "")
            rec["year"] = y.group(0) if y else None
        st = STAMP_RE.search(text or "")
        rec["stamp"] = st.group(0) if st else None
        rec["reviewed"] = bool(re.search(r"(?im)^\s*(?:reviewed|reviewer|peer[-\s]?review)\b", text or ""))
    rec["ids"] = list(dict.fromkeys(rec["ids"]))
    rec["refs"] = list(dict.fromkeys(rec["refs"]))
    rec["hole"] = (rel == BIND or any(rel.startswith(p) for p in ID_DIRS)) and not rec["ids"]
    return rec


def resolve(ref, src, enc, repo, ids, disks):
    if ref in ids:
        return True
    cands = []
    if ref.startswith("/"):
        cands.append(os.path.join(repo, ref.lstrip("/")))
    else:
        cands += [os.path.join(os.path.dirname(src), ref), os.path.join(enc, ref), os.path.join(repo, ref)]
    for c in cands:
        if os.path.isfile(c):
            return True
        r = rel_of(c, enc)
        if not r.startswith("..") and r in disks:
            return True
    return False


def dclm(recs, man, repo):
    fail = []
    files = man.get("files") if isinstance(man.get("files"), dict) else {}
    disk = {r["path"]: r for r in recs}
    block = man.get("dclm") if isinstance(man.get("dclm"), dict) else {}
    holes = [r["path"] for r in recs if r["hole"]]
    for path, meta in files.items():
        if not isinstance(meta, dict):
            continue
        if meta.get("scientific_validation") is True:
            fail.append("DCLM_FRICTION SCIENTIFIC_VALIDATION_CLAIM " + path)
        states = meta.get("states") if isinstance(meta.get("states"), list) else []
        live = bool(meta.get("live")) or "LIVE" in states or str(meta.get("state", "")).upper() == "LIVE"
        r = disk.get(path)
        sealed = bool(r) and str(meta.get("sha256", "")).lower() == r["sha256"] and int(meta.get("size_bytes", -1)) == r["size"]
        if live and not sealed:
            fail.append("DCLM_FRICTION LIVE_WITHOUT_SEAL " + path)
        if live and path in holes:
            fail.append("DCLM_FRICTION LIVE_HOLE " + path)
    try:
        cap = int(block.get("holes_max", len(holes)))
    except (TypeError, ValueError):
        cap = len(holes)
    if len(holes) > cap:
        fail.append("DCLM_FRICTION HOLE_RATCHET holes=%s max=%s %s" % (len(holes), cap, ",".join(holes)))
    if BIND not in disk:
        fail.append("DCLM_AFFINITY MISSING_BIND")
    else:
        t = disk[BIND]["text"].upper()
        if "HOLE" not in t:
            fail.append("DCLM_AFFINITY BIND_MISSING_HOLE_RULE")
        if "INTAKE" not in t:
            fail.append("DCLM_AFFINITY BIND_MISSING_INTAKE_RULE")
    if LAW not in disk:
        fail.append("DCLM_AFFINITY MISSING_LAW_FLOOR")
    else:
        t = disk[LAW]["text"]
        miss = [a for a in AXIOMS if a not in t]
        if miss:
            fail.append("DCLM_AFFINITY LAW_FLOOR_MISSING_AXIOMS " + ",".join(miss))
    runtime = block.get("runtime_binds") or list(RUNTIME)
    if not isinstance(runtime, list):
        runtime = list(RUNTIME)
    for rel in runtime:
        rel = str(rel).lstrip("/")
        if rel and not os.path.isfile(os.path.join(repo, rel)):
            fail.append("DCLM_SMASH MISSING_RUNTIME_BIND " + rel)
    return fail


def verify(recs, man, enc, repo):
    fail = []
    files = man.get("files") if isinstance(man.get("files"), dict) else {}
    disk = {r["path"]: r for r in recs}
    ids = {}
    for r in recs:
        if r["json_err"]:
            fail.append("INVALID_JSON %s: %s" % (r["path"], r["json_err"]))
        for i in r["ids"]:
            ids.setdefault(i, []).append(r["path"])
    for p in sorted(set(files) - set(disk)):
        fail.append("MISSING_MANIFESTED_FILE " + p)
    for p in sorted(set(disk) - set(files)):
        fail.append("UNLISTED_REPO_FILE " + p)
    for path, meta in files.items():
        if path not in disk:
            continue
        if not isinstance(meta, dict):
            fail.append("INVALID_MANIFEST_ENTRY " + path)
            continue
        r = disk[path]
        if meta.get("size_bytes") is None:
            fail.append("MISSING_SIZE " + path)
        elif int(meta["size_bytes"]) != r["size"]:
            fail.append("SIZE_MISMATCH %s: manifest=%s disk=%s" % (path, meta["size_bytes"], r["size"]))
        if not meta.get("sha256"):
            fail.append("MISSING_SHA256 " + path)
        elif str(meta["sha256"]).lower() != r["sha256"]:
            fail.append("SHA256_MISMATCH " + path)
    for i, paths in ids.items():
        u = sorted(set(paths))
        if len(u) > 1:
            fail.append("DUPLICATE_ID %s: %s" % (i, ", ".join(u)))
    for r in recs:
        for ref in r["refs"]:
            if not resolve(ref, r["abs"], enc, repo, ids, set(disk)):
                fail.append("UNRESOLVED_REFERENCE %s -> %s" % (r["path"], ref))
    d = str(man.get("disclaimer") or "")
    if "scientifically validated" in d.lower() and " not " not in (" " + d.lower()):
        fail.append("BAD_DISCLAIMER")
    fail.extend(dclm(recs, man, repo))
    return fail


def states_of(r, cataloged, sealed, live):
    flags = {
        "INDEXED": True, "CATALOGED": cataloged, "SOURCED": r["sourced"],
        "REVIEWED": r["reviewed"], "SEALED": sealed, "LIVE": live,
    }
    return [s for s in STATES if flags[s]]


def generate(recs, prev):
    prev_files = prev.get("files", {}) if prev else {}
    prev_dclm = prev.get("dclm") if prev and isinstance(prev.get("dclm"), dict) else {}
    holes = [r["path"] for r in recs if r["hole"]]
    try:
        cap = int(prev_dclm.get("holes_max"))
    except (TypeError, ValueError):
        cap = len(holes)
    payload = {
        "manifest_version": "2.1",
        "algorithm": "SHA-256",
        "disclaimer": DISCLAIMER,
        "states": list(STATES),
        "generated_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "files": {},
        "dclm": {
            "layer": "DCLM_L0",
            "axioms": list(AXIOMS),
            "holes_max": cap,
            "hole_paths": holes,
            "runtime_binds": list(prev_dclm.get("runtime_binds") or RUNTIME),
            "silence_is": "HOLE_NOT_ZERO",
            "scientific_validation": False,
        },
    }
    for r in recs:
        prior = prev_files.get(r["path"], {}) if isinstance(prev_files.get(r["path"], {}), dict) else {}
        live = bool(prior.get("live")) or "LIVE" in (prior.get("states") or [])
        st = states_of(r, True, True, live)
        payload["files"][r["path"]] = {
            "size_bytes": r["size"], "sha256": r["sha256"], "ids": r["ids"],
            "references": r["refs"], "year": r["year"],
            "source": r["source"], "stamp": r["stamp"], "hole": r["hole"],
            "state": st[-1] if st else "INDEXED", "states": st,
            "live": live, "scientific_validation": False,
        }
    return payload


def report(recs, man, fail):
    files = man.get("files", {}) if man else {}
    lines = [
        "ENCYCLOPEDIA SPINE  " + DISCLAIMER,
        "files=%s manifested=%s holes=%s" % (len(recs), len(files), sum(1 for r in recs if r["hole"])),
        "DCLM FRICTION / AFFINITY / SMASH   silence=HOLE_NOT_ZERO",
        "",
    ]
    for r in recs:
        meta = files.get(r["path"], {}) if isinstance(files.get(r["path"], {}), dict) else {}
        sealed = str(meta.get("sha256", "")).lower() == r["sha256"] and int(meta.get("size_bytes", -1)) == r["size"] if meta else False
        live = bool(meta.get("live"))
        st = "|".join(states_of(r, r["path"] in files, sealed, live)) or "INDEXED"
        mark = "HOLE" if r["hole"] else "BOUND"
        lines.append("%s  %sb  %s  id=%s  y=%s  %s  %s" % (
            r["path"], r["size"], r["sha256"][:12], r["ids"] or "-", r["year"] or "-", st, mark
        ))
    lines.append("")
    if fail:
        lines.append("FAIL_CLOSED (%s):" % len(fail))
        lines.extend("  - " + x for x in fail)
    else:
        lines.append("PASS")
    return lines


def load_man(path):
    if not os.path.isfile(path):
        return None, "manifest.json is missing"
    try:
        node = json.loads(open(path, encoding="utf-8").read())
    except Exception as e:
        return None, "invalid JSON: %s" % e
    if not isinstance(node, dict) or not isinstance(node.get("files"), dict):
        return None, "manifest.json missing object field 'files'"
    return node, None


def main(argv=None):
    p = argparse.ArgumentParser(description="Fail-closed encyclopedia spine")
    p.add_argument("--write-manifest", action="store_true")
    p.add_argument("--report", action="store_true")
    p.add_argument("--repo-root", default=None)
    args = p.parse_args(argv)
    repo = os.path.abspath(args.repo_root or root_from_here())
    enc = enc_root(repo)
    man_path = os.path.join(enc, "manifest.json")
    if not os.path.isdir(enc):
        print("FAIL_CLOSED encyclopedia/ directory is missing", file=sys.stderr)
        return 2
    recs = [inspect(path, enc) for path in walk(enc)]
    prev, err = load_man(man_path)
    if args.write_manifest:
        payload = generate(recs, prev)
        open(man_path, "w", encoding="utf-8").write(json.dumps(payload, indent=2) + "\n")
        print("Wrote %s (%s files). %s" % (man_path, len(payload["files"]), DISCLAIMER))
        prev, err = load_man(man_path)
    if err:
        print("FAIL_CLOSED MANIFEST: %s" % err, file=sys.stderr)
        return 2
    fail = verify(recs, prev, enc, repo)
    text = "\n".join(report(recs, prev, fail))
    print(text, file=sys.stdout if args.report or not fail else sys.stderr)
    return 2 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
