#!/usr/bin/env python3
"""DualisCapax — five OHF youth members as Dualis league indexes.

OMHA / ALLIANCE / GTHL / NOHA / OWHA.
Public association pages = cite pipes only.
No player names. No GameSheet dump. No helix.
"""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "research" / "hockey" / "ohf-five"
UNIT = ROOT / "units" / "sports" / "hockey-ohf-five"
WEB = ROOT / "cf-pages" / "data" / "ohf-five"
UA = "DualisCapaxHockeyHarvest/1.0 (+https://dualiscapax.ai; cite-echo only)"
SEASON = "2026-2027"

LEAGUES = [
    {
        "id": "omha",
        "name": "Ontario Minor Hockey Association",
        "short": "OMHA",
        "cite": "https://www.omha.net/",
        "ohf_path": "league season → championship → OHF",
        "seed_orgs": [
            {"slug": "barrie-aaa-zone", "name": "Barrie AAA Zone"},
            {"slug": "greater-kingston-gaels", "name": "Greater Kingston Gaels"},
            {"slug": "hamilton-steel-hockey-club", "name": "Hamilton Steel Hockey Club"},
            {"slug": "quinte-red-devils", "name": "Quinte Red Devils"},
        ],
    },
    {
        "id": "alliance",
        "name": "Minor Hockey Alliance of Ontario",
        "short": "ALLIANCE",
        "cite": "https://alliancehockey.com/",
        "ohf_path": "own zones → championship → OHF",
        "seed_orgs": [
            {"slug": "windsor-aaa-zone", "name": "Windsor AAA Zone"},
            {"slug": "elgin-middlesex-chiefs", "name": "Elgin-Middlesex Chiefs"},
            {"slug": "london-jr-knights", "name": "London Jr. Knights"},
            {"slug": "waterloo-wolves", "name": "Waterloo Wolves"},
        ],
    },
    {
        "id": "gthl",
        "name": "Greater Toronto Hockey League",
        "short": "GTHL",
        "cite": "https://gthlcanada.com/",
        "ohf_path": "own book → championship → OHF",
        "seed_orgs": [
            {"slug": "toronto-jr-canadiens", "name": "Toronto Jr. Canadiens"},
            {"slug": "don-mills-flyers", "name": "Don Mills Flyers"},
            {"slug": "mississauga-senators", "name": "Mississauga Senators"},
            {"slug": "toronto-marlboros", "name": "Toronto Marlboros"},
        ],
    },
    {
        "id": "noha",
        "name": "Northern Ontario Hockey Association",
        "short": "NOHA",
        "cite": "https://www.noha.on.ca/",
        "ohf_path": "own map → championship → OHF",
        "seed_orgs": [
            {"slug": "sudbury-wolves-aaa", "name": "Sudbury Wolves AAA"},
            {"slug": "soo-jr-greyhounds", "name": "Soo Jr. Greyhounds"},
            {"slug": "north-bay-trappers", "name": "North Bay Trappers"},
        ],
    },
    {
        "id": "owha",
        "name": "Ontario Women's Hockey Association",
        "short": "OWHA",
        "cite": "https://www.owha.on.ca/",
        "ohf_path": "own path → championship → OHF",
        "seed_orgs": [
            {"slug": "owha-branch-index", "name": "OWHA branch index (see girls harvest)"},
        ],
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
            cite["status"] = getattr(resp, "status", 200)
            title = ""
            low = body.lower()
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
    leagues_out: List[Dict[str, Any]] = []
    for row in LEAGUES:
        cite = ping(row["cite"])
        pack = {
            "unit": "sports/hockey-ohf-five",
            "kind": "dualis_league_index",
            "law": "Org index only. No named minors. Cite pipe ≠ product face.",
            "league_id": row["id"],
            "short": row["short"],
            "name": row["name"],
            "season": SEASON,
            "ohf_path": row["ohf_path"],
            "cite": cite,
            "orgs": row["seed_orgs"],
            "org_count": len(row["seed_orgs"]),
            "status": "seeding",
            "captured_at": captured,
        }
        write_json(OUT / row["id"] / "INDEX.json", pack)
        write_json(UNIT / "packs" / row["id"] / "INDEX.json", pack)
        write_json(WEB / f"{row['id']}.json", pack)
        leagues_out.append(
            {
                "id": row["id"],
                "short": row["short"],
                "cite_ok": bool(cite.get("ok")),
                "org_count": pack["org_count"],
            }
        )

    index = {
        "title": "DualisCapax OHF five — youth members",
        "law": "Five leagues to start. Ontario is huge. Not OMHA-only.",
        "season": SEASON,
        "captured_at": captured,
        "leagues": leagues_out,
        "ohf_members_youth": ["omha", "alliance", "gthl", "noha", "owha"],
        "not_on_this_plate": ["oha", "ohl", "heo", "hno"],
    }
    write_json(OUT / "INDEX.json", index)
    write_json(UNIT / "INDEX.json", index)
    write_json(WEB / "INDEX.json", index)
    print(json.dumps({"ok": True, "leagues": leagues_out}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
