#!/usr/bin/env python3
"""DualisCapax — purposeful golf USA course envelope harvest (OpenGolfAPI).

Law: course-first / totality. Echo cites only. Never invent yardages/slope/pins.
Writes research/golf/usa/<id>.json + refreshes INDEX.json. Advances QUEUE.json.
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "research" / "golf" / "usa"
QUEUE_PATH = OUT / "QUEUE.json"
INDEX_PATH = OUT / "INDEX.json"
API = "https://api.opengolfapi.org"
UA = "DualisCapaxGolfHarvest/1.0 (+https://dualiscapax.ai; ODbL-1.0 echo)"


def utc_day() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def http_get(url: str) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=45) as resp:
        return json.loads(resp.read().decode("utf-8"))


def access_class(type_echo: Optional[str]) -> str:
    t = (type_echo or "").strip().lower()
    if not t:
        return "unknown"
    if "municipal" in t:
        return "municipal"
    if "resort" in t:
        return "resort"
    if "private" in t:
        return "private"
    if "public" in t:
        return "public"
    return "unknown"


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def envelope_from_course(course_id: str) -> Dict[str, Any]:
    detail = http_get(f"{API}/v1/courses/{course_id}")
    tees_payload: Dict[str, Any] = {"tees": []}
    holes_payload: Any = []
    try:
        tees_payload = http_get(f"{API}/v1/courses/{course_id}/tees")
    except urllib.error.HTTPError:
        pass
    try:
        holes_payload = http_get(f"{API}/v1/courses/{course_id}/holes")
    except urllib.error.HTTPError:
        holes_payload = detail.get("holes") or []

    type_echo = detail.get("type")
    return {
        "source": "OpenGolfAPI",
        "source_url": f"{API}/v1/courses/{course_id}",
        "license": "ODbL-1.0",
        "captured_at": utc_day(),
        "dualis_note": (
            "Course-first playground envelope. Echo cite only — never invent "
            "slope/pin/grass beyond source. Golfer seat later."
        ),
        "access_type_echo": type_echo,
        "access_class": access_class(type_echo if isinstance(type_echo, str) else None),
        "course_id": course_id,
        "name": detail.get("name") or detail.get("course_name"),
        "city": detail.get("city"),
        "state": detail.get("state"),
        "par": detail.get("par"),
        "holes_count": len(holes_payload) if isinstance(holes_payload, list) else detail.get("holes"),
        "tees": tees_payload,
        "holes": holes_payload,
        "detail_keys": sorted([k for k in detail.keys() if not str(k).startswith("_")]),
        "scorecard_echo": detail.get("scorecard"),
        "website_echo": detail.get("website"),
        "lat": detail.get("latitude"),
        "lng": detail.get("longitude"),
    }


def rebuild_index(out_dir: Path) -> Dict[str, Any]:
    courses = []
    for path in sorted(out_dir.glob("*.json")):
        if path.name in {"INDEX.json", "QUEUE.json"}:
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        courses.append(
            {
                "id": data.get("course_id") or path.stem,
                "name": data.get("name"),
                "city": data.get("city"),
                "state": data.get("state"),
                "access_type_echo": data.get("access_type_echo"),
                "access_class": data.get("access_class"),
                "par": data.get("par"),
                "file": path.name,
            }
        )
    index = {
        "title": "DualisCapax golf USA course envelope harvest",
        "law": "Course-first / totality. Scorecard tee blocks = first yardage envelope. Echo OpenGolfAPI cites. Never invent.",
        "access_note": "public | municipal | resort | private | unknown — stamped from source type field only.",
        "source": API,
        "license": "ODbL-1.0",
        "captured_at": utc_day(),
        "course_count": len(courses),
        "courses": courses,
    }
    save_json(INDEX_PATH, index)
    return index


def refill_queue_from_searches(queue: Dict[str, Any], have: set) -> None:
    pending: List[str] = list(queue.get("pending_ids") or [])
    for spec in queue.get("seed_searches") or []:
        q = spec.get("q") or ""
        state = spec.get("state") or ""
        qs = urllib.parse.urlencode({"q": q, "state": state})
        try:
            payload = http_get(f"{API}/v1/courses/search?{qs}")
        except Exception as exc:  # noqa: BLE001 — harvest continues
            print(f"search_fail {state}/{q}: {exc}")
            continue
        for row in payload.get("courses") or []:
            cid = row.get("id")
            if not cid or cid in have or cid in pending:
                continue
            pending.append(cid)
            if len(pending) >= 80:
                break
        if len(pending) >= 80:
            break
    queue["pending_ids"] = pending


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    batch = int(os.environ.get("GOLF_HARVEST_BATCH", "3"))
    queue = load_json(QUEUE_PATH, {"pending_ids": [], "seed_searches": [], "batch_size_default": 3})
    have = {p.stem for p in OUT.glob("*.json") if p.name not in {"INDEX.json", "QUEUE.json"}}

    if len(queue.get("pending_ids") or []) < batch:
        refill_queue_from_searches(queue, have)

    pending: List[str] = [cid for cid in (queue.get("pending_ids") or []) if cid not in have]
    take = pending[:batch]
    rest = pending[batch:]
    written: List[str] = []
    errors: List[str] = []

    for cid in take:
        try:
            env = envelope_from_course(cid)
            save_json(OUT / f"{cid}.json", env)
            have.add(cid)
            written.append(cid)
            print(f"wrote {cid} {env.get('name')}")
            time.sleep(0.4)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{cid}: {exc}")
            print(f"fail {cid}: {exc}", file=sys.stderr)

    queue["pending_ids"] = rest
    queue["last_run_utc"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    queue["last_written"] = written
    queue["last_errors"] = errors
    save_json(QUEUE_PATH, queue)
    index = rebuild_index(OUT)

    receipt = {
        "ok": True,
        "written": written,
        "errors": errors,
        "course_count": index.get("course_count"),
        "pending_left": len(queue.get("pending_ids") or []),
    }
    print(json.dumps(receipt, indent=2))
    # Non-zero only if nothing written and we expected work / hard fail
    if take and not written:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
