"""Rebuild-to-verify reference (Python stdlib only).

Principle (D. Di Genova, 2026-10-17): verification is by recomputation, not trust.
Hash ONLY the seed and the inputs; sign ONLY who acted (out of scope here);
everything else is verified by rebuilding bit-for-bit.
Verdicts: KNOWN (rebuild matches) or UNKNOWN (with reason). Never a vote.
"""
import hashlib
import json

ALLOWED_KINDS = {"input", "recorded"}           # recorded = pinned nondeterminism
RECORDED_SOURCES = {"random", "time", "external", "float"}


def h(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def canon(obj) -> bytes:
    """Canonical bytes. Floats are rejected: their bits are platform/format dependent."""
    def check(o):
        if isinstance(o, float):
            raise ValueError("float value: pin as integer or decimal string")
        if isinstance(o, dict):
            for k, v in o.items():
                check(k); check(v)
        elif isinstance(o, list):
            for v in o:
                check(v)
    check(obj)
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def inputs_hash(log) -> str:
    return h(canon(log))


def _validate(ev):
    kind = ev.get("kind")
    if kind not in ALLOWED_KINDS:
        raise ValueError(f"unrecorded nondeterminism or unknown kind: {kind!r}")
    if kind == "recorded" and ev.get("source") not in RECORDED_SOURCES:
        raise ValueError(f"recorded event without valid source: {ev.get('source')!r}")
    if "value" not in ev:
        raise ValueError("event has no recorded value")


def replay(seed: bytes, pinned_seed_hash: str, log, pinned_inputs_hash: str) -> str:
    """Deterministically recompute the output from seed + recorded inputs log."""
    if h(seed) != pinned_seed_hash:
        raise ValueError("seed does not match pinned seed hash")
    if inputs_hash(log) != pinned_inputs_hash:
        raise ValueError("inputs log does not match pinned inputs hash")
    state = h(b"rtv:v1\n" + seed)
    for i, ev in enumerate(log):
        _validate(ev)
        state = h(state.encode() + b"|" + str(i).encode() + b"|" + canon(ev))
    return state


def verify(seed, pinned_seed_hash, log, pinned_inputs_hash, claimed_output):
    """Rebuild and compare. Returns ("KNOWN", output) or ("UNKNOWN", reason)."""
    try:
        out = replay(seed, pinned_seed_hash, log, pinned_inputs_hash)
    except ValueError as e:
        return ("UNKNOWN", f"not rebuildable: {e}")
    if out != claimed_output:
        return ("UNKNOWN", f"mismatch: rebuilt {out} != claimed {claimed_output}")
    return ("KNOWN", out)
