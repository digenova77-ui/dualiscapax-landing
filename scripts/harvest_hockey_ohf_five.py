#!/usr/bin/env python3
"""DualisCapax — five OHF youth members as Dualis league indexes.

OMHA / ALLIANCE / GTHL / NOHA / OWHA.
If the cite disagrees with the seed, write an anomaly and keep it.
Bring-in = promote an anomaly into the next seed. Never invent players.
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
        "expect_in_title": ["omha", "ontario minor"],
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
        "expect_in_title": ["alliance"],
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
        "expect_in_title": ["gthl", "greater toronto"],
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
        "expect_in_title": ["noha", "northern ontario"],
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
        "expect_in_title": ["owha", "women"],
        "ohf_path": "own path → championship → OHF",
        "seed_orgs": [
            {"slug": "owha-branch-index", "name": "OWHA branch index (see girls harvest)"},
        ],
    },
]

BESIDE = [
    {"id": "oha", "name": "Ontario Hockey Association", "why": "OHF member — junior, not this youth plate"},
    {"id": "ohl", "name": "Ontario Hockey League", "why": "OHF member — major junior, not this youth plate"},
    {"id": "heo", "name": "Hockey Eastern Ontario", "why": "Hockey Canada sibling beside OHF"},
    {"id": "hno", "name": "Hockey Northwestern Ontario", "why": "Hockey Canada sibling beside OHF"},
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2) + "\n")


def load_json(path: Path) -> Any:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        return None


def ping(url: str) -> Dict[str, Any]:
    cite: Dict[str, Any] = {"url": url, "fetched_at": utc_now(), "ok": False}
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    try:
        with urllib.request.urlopen(req, timeout=40) as resp:
            body = resp.read(8000).decode("utf-8", errors="replace")
            cite["ok"] = True
            cite["status"] = getattr(resp, "status", 200)
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
    anomalies: List[Dict[str, Any]] = []
    prev = load_json(OUT / "ANOMALIES.json") or {}
    prior = list(prev.get("open") or [])

    leagues_out: List[Dict[str, Any]] = []
    for row in LEAGUES:
        cite = ping(row["cite"])
        title = (cite.get("title_echo") or "").lower()
        if not cite.get("ok"):
            anomalies.append({
                "kind": "cite_down",
                "league": row["id"],
                "cite": row["cite"],
                "error": cite.get("error"),
                "status": "noticed",
                "bring_in": False,
                "seen_at": captured,
            })
        elif row.get("expect_in_title") and not any(tok in title for tok in row["expect_in_title"]):
            anomalies.append({
                "kind": "title_mismatch",
                "league": row["id"],
                "cite": row["cite"],
                "title_echo": cite.get("title_echo"),
                "status": "noticed",
                "bring_in": True,
                "note": "Official page title does not echo the member name. Keep and inspect.",
                "seen_at": captured,
            })

        pack = {
            "unit": "sports/hockey-ohf-five",
            "kind": "dualis_league_index",
            "law": "Org index only. Anomalies stay visible. No named minors.",
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
        leagues_out.append({
            "id": row["id"],
            "short": row["short"],
            "cite_ok": bool(cite.get("ok")),
            "org_count": pack["org_count"],
        })

    for row in BESIDE:
        anomalies.append({
            "kind": "beside_the_five",
            "league": row["id"],
            "name": row["name"],
            "note": row["why"],
            "status": "noticed",
            "bring_in": False,
            "seen_at": captured,
        })

    # Keep prior open anomalies unless the same kind+league already restated.
    keys = {(a["kind"], a.get("league")) for a in anomalies}
    for old in prior:
        k = (old.get("kind"), old.get("league"))
        if k not in keys:
            old["status"] = old.get("status") or "noticed"
            anomalies.append(old)

    anomaly_doc = {
        "law": "Notice anomalies. Bring them in as orgs/leagues when they are real. Never invent a player.",
        "captured_at": captured,
        "open": anomalies,
        "open_count": len(anomalies),
    }
    write_json(OUT / "ANOMALIES.json", anomaly_doc)
    write_json(UNIT / "ANOMALIES.json", anomaly_doc)
    write_json(WEB / "ANOMALIES.json", anomaly_doc)

    index = {
        "title": "DualisCapax OHF five — youth members",
        "law": "Five leagues to start. Anomalies stay on the table.",
        "season": SEASON,
        "captured_at": captured,
        "leagues": leagues_out,
        "ohf_members_youth": ["omha", "alliance", "gthl", "noha", "owha"],
        "not_on_this_plate": ["oha", "ohl", "heo", "hno"],
        "anomaly_count": len(anomalies),
    }
    write_json(OUT / "INDEX.json", index)
    write_json(UNIT / "INDEX.json", index)
    write_json(WEB / "INDEX.json", index)
    print(json.dumps({"ok": True, "leagues": leagues_out, "anomalies": len(anomalies)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
