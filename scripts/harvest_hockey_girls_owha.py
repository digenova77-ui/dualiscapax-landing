#!/usr/bin/env python3
"""DualisCapax — OWHA girls/women amateur branch-index harvest.

Layer 2: public OWHA RAMP standings pages → team list packs.
Never invent players/stats. Roster seats stay awaiting_player_cites.
"""
from __future__ import annotations

import json
import os
import re
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "research" / "hockey" / "girls-women"
UNIT_PACKS = ROOT / "units" / "sports" / "hockey-girls-women-amateur" / "packs"
QUEUE_PATH = ROOT / "units" / "sports" / "hockey-girls-women-amateur" / "QUEUE.json"
UA = "DualisCapaxHockeyHarvest/1.0 (+https://dualiscapax.ai; cite-echo only)"

# Seeded public cite URLs (OWHA RAMP). Season labels are echo of page title when present.
SEED_DIVISIONS = [
    {
        "id": "owha-u18-aa",
        "label": "OWHA U18 AA",
        "url": "https://www.owha.on.ca/division/1582/14787/standings",
        "age_band": "U18",
        "level": "AA",
    },
    {
        "id": "owha-u22-aa",
        "label": "OWHA U22 AA",
        "url": "https://www.owha.on.ca/division/1594/14813/standings",
        "age_band": "U22",
        "level": "AA",
    },
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def http_get_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_teams(html: str) -> List[Dict[str, str]]:
    """Echo 'Name #id' pairs from public standings HTML. No invented surnames."""
    found: List[Tuple[str, str]] = re.findall(r">([^<>]+?)\s*#(\d{2,6})<", html)
    out: List[Dict[str, str]] = []
    seen = set()
    for name, tid in found:
        name = re.sub(r"\s+", " ", name).strip()
        if not name or tid in seen:
            continue
        # Skip nav noise like SPFHA house teams if they appear without proper names
        if name.startswith("#") or len(name) < 3:
            continue
        seen.add(tid)
        out.append({"name": name, "owha_team_code": tid, "status": "team_listed"})
    return out


def slugify(name: str, code: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return f"{s}-{code}"


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2) + "\n")


def harvest_division(spec: Dict[str, str]) -> Dict[str, Any]:
    url = spec["url"]
    try:
        html = http_get_text(url)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
        return {
            "id": spec["id"],
            "label": spec["label"],
            "cite": {"url": url, "fetched_at": utc_now(), "ok": False, "error": str(e)},
            "teams": [],
            "team_count": 0,
            "status": "cite_fetch_failed",
        }
    teams = parse_teams(html)
    title_m = re.search(r"<title>([^<]+)</title>", html, re.I)
    page_title = title_m.group(1).strip() if title_m else spec["label"]
    pack = {
        "unit": "sports/hockey-girls-women-amateur",
        "kind": "branch_index",
        "id": spec["id"],
        "label": spec["label"],
        "age_band": spec["age_band"],
        "level": spec["level"],
        "cite": {
            "source": "OWHA RAMP public standings",
            "url": url,
            "page_title_echo": page_title,
            "fetched_at": utc_now(),
            "ok": True,
        },
        "law": "Echo team names + codes from cite only. No player invent. Rosters = awaiting_player_cites.",
        "team_count": len(teams),
        "teams": teams,
        "status": "harvested" if teams else "awaiting_teams_on_board",
    }
    # Per-team stub packs (no players)
    for t in teams:
        tid = slugify(t["name"], t["owha_team_code"])
        team_pack = {
            "unit": "sports/hockey-girls-women-amateur",
            "kind": "team_stub",
            "id": tid,
            "name": t["name"],
            "owha_team_code": t["owha_team_code"],
            "division_id": spec["id"],
            "cite": {"url": url, "fetched_at": utc_now()},
            "roster": [],
            "roster_status": "awaiting_player_cites",
            "law": "Never invent surnames or stats.",
        }
        write_json(OUT / "teams" / f"{tid}.json", team_pack)
        write_json(UNIT_PACKS / "teams" / f"{tid}.json", team_pack)
    write_json(OUT / "divisions" / f"{spec['id']}.json", pack)
    write_json(UNIT_PACKS / "divisions" / f"{spec['id']}.json", pack)
    return pack


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    UNIT_PACKS.mkdir(parents=True, exist_ok=True)
    batch = int(os.environ.get("GIRLS_HOCKEY_BATCH", "2"))
    # Always refresh up to `batch` seeded divisions (currently 2)
    specs = SEED_DIVISIONS[: max(1, batch)]
    results = []
    for i, spec in enumerate(specs):
        if i:
            time.sleep(1.5)
        results.append(harvest_division(spec))

    index = {
        "title": "DualisCapax hockey girls/women amateur — OWHA branch index",
        "law": "Platform scaffold. Never invent. Dualis is not OWHA.",
        "captured_at": utc_now(),
        "divisions": [
            {
                "id": r["id"],
                "label": r.get("label"),
                "team_count": r.get("team_count", 0),
                "status": r.get("status"),
                "cite_url": (r.get("cite") or {}).get("url"),
            }
            for r in results
        ],
        "division_count": len(results),
        "team_count_total": sum(r.get("team_count", 0) for r in results),
    }
    write_json(OUT / "INDEX.json", index)
    write_json(UNIT_PACKS / "INDEX.json", index)

    # Advance unit QUEUE echo
    if QUEUE_PATH.exists():
        try:
            q = json.loads(QUEUE_PATH.read_text())
        except json.JSONDecodeError:
            q = {}
        q["status"] = "harvesting"
        q["last_harvest_at"] = utc_now()
        q["last_team_count_total"] = index["team_count_total"]
        q["notes"] = "Branch index live from OWHA public standings. Rosters still awaiting_player_cites."
        write_json(QUEUE_PATH, q)

    print(json.dumps({"ok": True, "index": index}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
