#!/usr/bin/env python3
"""Agent board: append-only, hash-chained JSONL ledger. Python stdlib only.

Each line: {seq, utc, agent, action, refs, prev_hash, hash}
hash = sha256(canonical JSON of the entry without "hash").
canonical JSON = json.dumps(sort_keys=True, separators=(",", ":"), ensure_ascii=False), UTF-8.
Genesis prev_hash = 64 zeros. Verification is by rebuilding the chain (rebuild-to-verify).

Usage:
  board.py append --agent NAME --action TEXT [--ref PR#112 --ref <sha>] [--utc ISO] [--file PATH]
  board.py verify [--file PATH] [--base OLD_FILE]
"""
import argparse, datetime, hashlib, json, os, sys

DEFAULT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs", "ops", "AGENT_BOARD.jsonl")
ZERO = "0" * 64
FIELDS = {"seq", "utc", "agent", "action", "refs", "prev_hash", "hash"}


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def entry_hash(entry):
    body = {k: v for k, v in entry.items() if k != "hash"}
    return hashlib.sha256(canonical(body)).hexdigest()


def serialize(entry):
    return canonical(entry).decode("utf-8") + "\n"


def verify_text(text):
    """Return (ok, n_entries, message). Reports the first break."""
    if text and not text.endswith("\n"):
        return False, 0, "file does not end with newline"
    prev, n = ZERO, 0
    for i, line in enumerate(text.splitlines(), 1):
        try:
            e = json.loads(line)
        except ValueError as exc:
            return False, n, f"line {i}: invalid JSON ({exc})"
        if not isinstance(e, dict) or set(e) != FIELDS:
            return False, n, f"line {i}: fields must be exactly {sorted(FIELDS)}"
        if serialize(e) != line + "\n":
            return False, n, f"line {i}: not canonical JSON"
        if e["seq"] != i - 1:
            return False, n, f"line {i}: seq {e['seq']!r} != {i - 1}"
        if not isinstance(e["agent"], str) or not e["agent"].strip():
            return False, n, f"line {i}: agent required"
        if not isinstance(e["refs"], list) or not all(isinstance(r, str) for r in e["refs"]):
            return False, n, f"line {i}: refs must be a list of strings"
        if e["prev_hash"] != prev:
            return False, n, f"line {i}: prev_hash breaks chain (expected {prev})"
        h = entry_hash(e)
        if e["hash"] != h:
            return False, n, f"line {i}: hash mismatch (rebuilt {h})"
        prev, n = h, n + 1
    return True, n, f"OK {n} entries, head {prev}"


def verify_append_only(old, new):
    if not new.startswith(old):
        return False, "past lines were altered or removed (only appends allowed)"
    return True, "append-only OK"


def read(path):
    if not os.path.exists(path):
        return ""
    with open(path, "r", encoding="utf-8", newline="") as f:
        return f.read()


def append(path, agent, action, refs, utc=None):
    text = read(path)
    ok, n, msg = verify_text(text)
    if not ok:
        raise ValueError("refusing to append to broken board: " + msg)
    lines = text.splitlines()
    prev = json.loads(lines[-1])["hash"] if lines else ZERO
    e = {"seq": n, "utc": utc or datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
         "agent": agent, "action": action, "refs": list(refs), "prev_hash": prev}
    e["hash"] = entry_hash(e)
    with open(path, "a", encoding="utf-8", newline="") as f:  # append mode only; never rewrites
        f.write(serialize(e))
    return e


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("append"); a.add_argument("--file", default=DEFAULT)
    a.add_argument("--agent", required=True); a.add_argument("--action", required=True)
    a.add_argument("--ref", action="append", default=[]); a.add_argument("--utc")
    v = sub.add_parser("verify"); v.add_argument("--file", default=DEFAULT)
    v.add_argument("--base", help="older copy of the board; current must extend it byte-for-byte")
    args = p.parse_args(argv)
    if args.cmd == "append":
        try:
            e = append(args.file, args.agent, args.action, args.ref, args.utc)
        except ValueError as exc:
            print("FAIL", exc); return 1
        print(json.dumps(e)); return 0
    text = read(args.file)
    ok, _, msg = verify_text(text)
    print(("PASS " if ok else "FAIL ") + msg)
    if ok and args.base is not None:
        ok, msg = verify_append_only(read(args.base), text)
        print(("PASS " if ok else "FAIL ") + msg)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
