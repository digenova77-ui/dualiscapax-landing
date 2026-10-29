"""Regulation check. Does not import the kernel."""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path


def load():
    path = Path(__file__).resolve().parents[1] / "engine" / "dclm" / "regulation.py"
    spec = spec_from_file_location("regulation", path)
    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> int:
    law = load()
    free = law.free_authority(100, 40, 10)
    assert free["ok"] and free["value"] == 50 and free["settles"] is False
    assert law.free_authority(10, 8, 5)["reason"] == "HOLE"
    assert law.admit_disburse(100, 40, 10, 51)["reason"] == "HOLE"
    assert law.release_room(0, 40, 0, 40)["value"] == 40
    assert law.winter_throttle(0, None)["value"] == 1_000_000
    assert law.winter_throttle(500_000, None)["reason"] == "UNSET"
    assert law.winter_throttle(1_000_000, 0)["reason"] == "HOLE"
    print("PASS regulation")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
