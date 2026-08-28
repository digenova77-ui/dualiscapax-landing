#!/usr/bin/env python3
"""CLI for the DCLM logical kernel."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from engine.dclm.kernel import run  # noqa: E402


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="dclm", description="DCLM-AI measure loop")
    p.add_argument("text", nargs="*", help="case text")
    p.add_argument("--voice", choices=("citizen", "cfo", "lab"), default="citizen")
    p.add_argument("--id", dest="case_id", default="anon")
    p.add_argument("--plain", action="store_true", help="print spoken sentence only")
    args = p.parse_args(argv)
    text = " ".join(args.text).strip()
    if not text:
        text = sys.stdin.read().strip()
    if not text:
        print("dclm: no case text", file=sys.stderr)
        return 2
    rec = run(text, case_id=args.case_id, voice=args.voice)
    if args.plain:
        print(rec.measure.sentence if rec.measure else rec.veto.reason)  # type: ignore[union-attr]
        print(f"[{rec.grant}] {rec.next_move}")
        return 0 if rec.grant != "VETO" else 1
    print(rec.dumps())
    return 0 if rec.grant != "VETO" else 1


if __name__ == "__main__":
    raise SystemExit(main())
