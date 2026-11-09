#!/usr/bin/env python3
"""Rebuild the deterministic cross-runtime canonical-manifest fixture."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path

SEED = 0xD1A0C0DE
CASE_COUNT = 1000
MAX_SAFE_INTEGER = (1 << 53) - 1
LABELS = ("café", "μ", "🌍", "Ångström", "東京", "line\nfeed", "tab\tvalue")
FIXTURE = Path(__file__).parent / "fixtures" / "seed-v1-generated-known-answers.json"

def rng(initial: int):
    state = initial & 0xFFFFFFFF
    while True:
        state = (1664525 * state + 1013904223) & 0xFFFFFFFF
        yield state

def generated_value(next_value, depth: int):
    kind = next_value() % (6 if depth > 0 else 4)
    if kind == 0: return None
    if kind == 1: return bool(next_value() & 1)
    if kind == 2:
        if next_value() % 40 == 0:
            return MAX_SAFE_INTEGER if next_value() & 1 else -MAX_SAFE_INTEGER
        return next_value() % 2000001 - 1000000
    if kind == 3: return LABELS[next_value() % len(LABELS)] + "-" + str(next_value() % 997)
    if kind == 4: return [generated_value(next_value, depth - 1) for _ in range(next_value() % 4)]
    count = next_value() % 4
    pairs = [(f"k{i:02d}", generated_value(next_value, depth - 1)) for i in range(count)]
    if next_value() & 1: pairs.reverse()
    return dict(pairs)

def canonical(value):
    if isinstance(value, list): return [canonical(item) for item in value]
    if isinstance(value, dict): return {key: canonical(value[key]) for key in sorted(value)}
    return value

def build_fixture() -> dict:
    cases = []
    for index in range(CASE_COUNT):
        next_value = iter(rng((SEED + index * 0x9E3779B9) & 0xFFFFFFFF)).__next__
        state = {
            "case_index": index,
            "payload": generated_value(next_value, 3),
            "nested": generated_value(next_value, 2),
            "labels": [LABELS[index % len(LABELS)], f"sample-{index}"],
            "bounds": {"max": MAX_SAFE_INTEGER, "min": -MAX_SAFE_INTEGER},
        }
        manifest = {
            "model_id": f"generated.seed.v1.{index}",
            "schema_version": "dualis.seed.v1",
            "state": state,
            "rules": [f"rule-{next_value() % 17}", f"rule-{next_value() % 17}"],
            "units": {"energy": "eV", "length": "bohr_radius", "time": "s"},
            "precision": f"fixed-seed-{SEED:x};case-{index}",
            "boundary_conditions": ["bounded-input", "no-execution"],
            "observables": ["state", "payload"],
            "invariants": ["canonical-replay"],
            "limits": ["project-profile-only", "not-a-physical-model"],
        }
        source = json.dumps(canonical(manifest), ensure_ascii=False, separators=(",", ":"))
        cases.append({"index": index, "canonical_manifest": source,
                      "sha256": hashlib.sha256(source.encode("utf-8")).hexdigest()})
    return {"fixture_version": "dualis.seed.generated-known-answers.v1",
            "seed": "0xD1A0C0DE", "case_count": CASE_COUNT, "cases": cases}

def render() -> str:
    return json.dumps(build_fixture(), ensure_ascii=False, indent=2) + "\n"

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    expected = render()
    if args.write:
        FIXTURE.write_text(expected, encoding="utf-8", newline="\n")
        return 0
    if args.check:
        if FIXTURE.read_text(encoding="utf-8") != expected:
            raise SystemExit("generated fixture is stale; run generate_seed_vectors.py --write")
        print(f"verified {CASE_COUNT} deterministic vectors")
        return 0
    print(expected, end="")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
