#!/usr/bin/env python3
"""House / rec layer for all five OHF youth members. Both genders.
Org cites only. No named minors. No house-team invent.
"""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "research" / "hockey" / "house-rec"
UA = "DualisCapaxHockeyHarvest/1.0 (+https://dualiscapax.ai; cite-echo only)"
SEASON = "2026-2027"

MEMBERS = [
    {
        "id": "omha",
        "short": "OMHA",
        "genders": ["boys", "girls_where_offered"],
        "cite": "https://www.omha.net/",
        "expect": ["omha", "ontario minor"],
        "house_hole": "awaiting_association_cites",
    },
    {
        "id": "alliance",
        "short": "ALLIANCE",
        "genders": ["boys", "girls_where_offered"],
        "cite": "https://alliancehockey.com/",
        "expect": ["alliance"],
        "house_hole": "awaiting_association_cites",
    },
    {
        "id": "gthl",
        "short": "GTHL",
        "genders": ["boys", "girls_where_offered"],
        "cite": "https://gthlcanada.com/",
        "expect": ["gthl", "greater toronto"],
        "house_hole": "awaiting_association_cites",
    },
    {
        "id": "noha",
        "short": "NOHA",
        "genders": ["boys", "girls_where_offered"],
        "cite": "https://www.noha.on.ca/",
        "expect": ["noha", "northern ontario"],
        "house_hole": "awaiting_association_cites",
    },
    {
        "id": "owha",
        "short": "OWHA",
        "genders": ["girls", "women"],
        "cite": "https://www.owha.on.ca/",
        "expect": ["owha", "women"],
        "house_hole": "awaiting_association_cites",
    },
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2) + "\n")


def ping(url: str) -> Dict[str, Any]:
    cite: Dict[str, Any] = {"url": url, "fetched_at": utc_now(), "ok": False}
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    try:
        with urllib.request.urlopen(req, timeout=40) as resp:
            body = resp.read(8000).decode("utf-8", errors="replace")
            cite["ok"] = True
            low = body.lower()
            title = ""
            if "<title>" in low:
                i = low.find("<title>") + 7
                j = low.find("</title>", i)
                title = body[i:j].strip()[:160] if j > i else ""
            cite["title_echo"] = title
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError) as e:
        cite["error"] = str(e)
    return cite


def main() -> int:
    captured = utc_now()
    rows = []
    for m in MEMBERS:
        cite = ping(m["cite"])
        title = (cite.get("title_echo") or "").lower()
        echo_ok = bool(cite.get("ok")) and any(t in title for t in m["expect"])
        pack = {
            "kind": "house_rec_member_index",
            "law": "House and rec included. Associations only from official directory. No player invent.",
            "league_id": m["id"],
            "short": m["short"],
            "season": SEASON,
            "genders": m["genders"],
            "division_kinds": ["house", "rec", "local", "representative", "aaa"],
            "cite": cite,
            "title_echo_ok": echo_ok,
            "associations": [],
            "associations_status": m["house_hole"],
            "captured_at": captured,
        }
        write_json(OUT / m["id"] / "INDEX.json", pack)
        rows.append({
            "id": m["id"],
            "cite_ok": bool(cite.get("ok")),
            "title_echo_ok": echo_ok,
            "associations_status": m["house_hole"],
        })
    index = {
        "title": "DualisCapax hockey — house + rec + both genders + five OHF youth members",
        "law": "Fuck it means house league is on the map. It does not mean invent a team.",
        "season": SEASON,
        "captured_at": captured,
        "members": rows,
        "live_plate": "do_not_paint_ice_until_200",
    }
    write_json(OUT / "INDEX.json", index)
    print(json.dumps(index, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
