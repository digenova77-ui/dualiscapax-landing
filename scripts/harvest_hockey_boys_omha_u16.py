#!/usr/bin/env python3
"""DualisCapax — OMHA boys/men U16 AAA branch harvest into Dualis seat packs.

Dualis is the product (trunk→branch→seat→Ice/DCLM). Public OMHA / club Sportsheadz
boards are CITE PIPES only — never the UX ceiling, never invent beyond the cite.

Writes:
  research/hockey/boys-amateur/omha-u16-aaa/
  units/sports/hockey-boys-amateur/packs/
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
from typing import Any, Dict, List, Optional, Tuple

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "research" / "hockey" / "boys-amateur" / "omha-u16-aaa"
UNIT_PACKS = ROOT / "units" / "sports" / "hockey-boys-amateur" / "packs"
QUEUE_PATH = ROOT / "units" / "sports" / "hockey-boys-amateur" / "QUEUE.json"
STANDINGS_URL = "https://omha-aaa.net/Leagues/1024/Standings/"
UA = "DualisCapaxHockeyHarvest/1.0 (+https://dualiscapax.ai; Dualis packs; cite-echo only)"
SEASON = "2026-2027"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2) + "\n")


def http_get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "unknown"


def is_u16_aaa_label(label: str) -> bool:
    """Accept U16 AAA seats; reject AA/A/BB/Select/ADV noise."""
    lab = re.sub(r"\s+", " ", (label or "")).strip()
    low = lab.lower()
    if re.search(r"\b(select|adv|bb)\b", low):
        return False
    # Explicit lower bands
    if re.search(r"u16\s*aa\b", low) and "aaa" not in low:
        return False
    if re.search(r"u16\s*a\b", low) and "aaa" not in low and "aa" not in low:
        return False
    if re.search(r"\bu16\s*al\b", low):
        return False
    # Accept AAA forms
    if re.search(r"u16\s*aaa|u16aaa|under\s*16\s*aaa", low):
        return True
    # Bare U16 / U16 (2011) / COW U16 / NCP-U16 on AAA club hosts
    if re.search(r"(^|\b)u16(\b|\s*\(|$)|ncp-u16|cow u16", low):
        if re.search(r"\b(aa|a|bb|select|adv)\b", low) and "aaa" not in low:
            return False
        return True
    return False


def club_name_from_title(title: str, host: str) -> str:
    # Titles like "Seasons > 2026-2027 (Quinte Red Devils)" or "Roster (Burlington...)"
    m = re.search(r"\(([^)]+)\)\s*$", title)
    if m:
        return m.group(1).strip()
    # fallback host stem
    stem = host.split(".")[0]
    return stem.replace("-", " ").title()


def dualis_team_id(club_slug: str) -> str:
    return f"on.aaa.omha.{club_slug}.u16.{SEASON}"


def discover_hosts(standings_html: str) -> List[str]:
    return sorted(set(re.findall(r"https://([^/]+)/Teams/\d+/Schedule/?", standings_html)))


def discover_u16_on_host(host: str) -> Tuple[str, List[Dict[str, str]], Optional[str]]:
    """Return (club_title, [{team_id,label,path}], error)."""
    url = f"https://{host}/Seasons/Current/"
    try:
        body = http_get(url)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
        return "", [], str(e)
    title_m = re.search(r"<title>([^<]+)", body)
    title = re.sub(r"\s+", " ", title_m.group(1) if title_m else "").strip()
    found: List[Dict[str, str]] = []
    seen = set()
    for m in re.finditer(r'href="(/Teams/(\d+)/?)"[^>]*>([^<]*)<', body):
        label = re.sub(r"\s+", " ", m.group(3)).strip()
        tid = m.group(2)
        if not is_u16_aaa_label(label):
            continue
        if tid in seen:
            continue
        seen.add(tid)
        found.append({"team_id": tid, "label": label, "path": m.group(1), "via": "seasons"})
    # Burlington-style: seasons may omit U16 text; probe Players titles for standings IDs
    if not found:
        # need standings ids — caller may pass; try common: scrape any /Teams/id/ on page
        ids = sorted(set(re.findall(r"/Teams/(\d+)/", body)))
        for tid in ids:
            try:
                pbody = http_get(f"https://{host}/Teams/{tid}/Players/")
            except Exception:
                continue
            pt = re.search(r"<title>([^<]+)", pbody)
            plabel = re.sub(r"\s+", " ", pt.group(1) if pt else "").strip()
            if is_u16_aaa_label(plabel) or re.search(r"under\s*16\s*aaa", plabel, re.I):
                found.append({"team_id": tid, "label": plabel, "path": f"/Teams/{tid}/", "via": "players_title"})
                break
            time.sleep(0.15)
    return title, found, None


def echo_privacy_roster(host: str, team_id: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Echo First+initial / jersey / pos when present. Never invent surnames."""
    url = f"https://{host}/Teams/{team_id}/Players/"
    cite = {"url": url, "fetched_at": utc_now(), "ok": False}
    try:
        body = http_get(url)
        cite["ok"] = True
    except Exception as e:
        cite["error"] = str(e)
        return [], cite
    title_m = re.search(r"<title>([^<]+)", body)
    cite["page_title_echo"] = re.sub(r"\s+", " ", title_m.group(1) if title_m else "").strip()
    seats: List[Dict[str, Any]] = []
    # Common Sportsheadz table: jersey, name, position — echo only clear rows
    # Pattern examples: >32</td> ... >N. Armstrong</td> or similar
    # Conservative: look for Name patterns with jersey nearby
    rows = re.findall(
        r"(?is)<tr[^>]*>\s*<td[^>]*>\s*#?\s*(\d{1,2})\s*</td>\s*<td[^>]*>\s*([^<]{2,40}?)\s*</td>(?:\s*<td[^>]*>\s*([^<]{0,20}?)\s*</td>)?",
        body,
    )
    for jersey_s, name, pos in rows:
        name = re.sub(r"\s+", " ", name).strip()
        pos = re.sub(r"\s+", " ", (pos or "")).strip() or None
        if not name or name.lower() in ("name", "player", "athletes"):
            continue
        if not re.search(r"[A-Za-z]", name):
            continue
        jersey = int(jersey_s)
        # privacy initial forms OK
        seats.append(
            {
                "jersey": jersey,
                "display_name_echo": name,
                "pos_echo": pos,
                "cite_status": "cited_board" if name else "awaiting_player_cites",
            }
        )
    return seats, cite


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    UNIT_PACKS.mkdir(parents=True, exist_ok=True)
    try:
        standings = http_get(STANDINGS_URL)
    except Exception as e:
        print(json.dumps({"ok": False, "error": f"standings fetch: {e}"}))
        return 1

    hosts = discover_hosts(standings)
    batch = int(os.environ.get("OMHA_HARVEST_BATCH", "20"))
    hosts = hosts[:batch]

    teams_out: List[Dict[str, Any]] = []
    errors: List[Dict[str, str]] = []

    for i, host in enumerate(hosts):
        if i:
            time.sleep(0.4)
        title, found, err = discover_u16_on_host(host)
        if err:
            errors.append({"host": host, "error": err})
            continue
        # Burlington fallback using standings IDs if seasons empty
        if not found:
            ids = sorted(set(re.findall(rf"https://{re.escape(host)}/Teams/(\d+)/", standings)))
            for tid in ids:
                try:
                    pbody = http_get(f"https://{host}/Teams/{tid}/Players/")
                except Exception:
                    continue
                pt = re.search(r"<title>([^<]+)", pbody)
                plabel = re.sub(r"\s+", " ", pt.group(1) if pt else "").strip()
                if is_u16_aaa_label(plabel) or re.search(r"under\s*16\s*aaa", plabel, re.I):
                    found.append({"team_id": tid, "label": plabel, "path": f"/Teams/{tid}/", "via": "players_title"})
                    if not title:
                        title = plabel
                    break
                time.sleep(0.15)

        club = club_name_from_title(title, host)
        club_slug = slugify(club)
        for f in found:
            tid = f["team_id"]
            team_id = dualis_team_id(club_slug)
            players_url = f"https://{host}/Teams/{tid}/Players/"
            roster_echo, roster_cite = echo_privacy_roster(host, tid)
            # Dualis seat stubs — identity keys; full Quinte-class seats stay richer when already hand-built
            dualis_seats = []
            for row in roster_echo:
                j = row["jersey"]
                dualis_seats.append(
                    {
                        "seat_key": f"{team_id}.#{j}",
                        "display_name": row["display_name_echo"],
                        "preferred_alias": row["display_name_echo"],
                        "aliases": [row["display_name_echo"]],
                        "jersey": j,
                        "pos": row.get("pos_echo"),
                        "positions": [row["pos_echo"]] if row.get("pos_echo") else [],
                        "ids": {
                            "hcr": None,
                            "spordle": None,
                            "teamsnap_person": None,
                            "teamsnap_player": None,
                            "gamesheet": None,
                            "elite_prospects": None,
                            "hockeydb": None,
                            "ncsa": None,
                            "unity": None,
                            "sportsheadz_team": tid,
                        },
                        "cite_status": row.get("cite_status") or "cited_board",
                        "landing_prebaked": False,
                    }
                )
            pack = {
                "unit": "sports/hockey-boys-amateur",
                "kind": "dualis_team_branch",
                "law": "Dualis seat pack. Public club board = cite pipe only — not the product face.",
                "identity_schema": "dc.seat.identity.v1",
                "team_id": team_id,
                "club_name": club,
                "club_slug": club_slug,
                "age_band": "U16",
                "level": "AAA",
                "season": SEASON,
                "league": "OMHA AAA",
                "host": host,
                "cite": {
                    "standings_index": STANDINGS_URL,
                    "seasons_current": f"https://{host}/Seasons/Current/",
                    "players": roster_cite,
                    "board_label_echo": f.get("label"),
                    "board_team_id": tid,
                    "discovery_via": f.get("via"),
                },
                "seat_count": len(dualis_seats),
                "seats": dualis_seats,
                "roster_status": "echoed" if dualis_seats else "awaiting_player_cites",
                "captured_at": utc_now(),
            }
            fname = f"{club_slug}.u16.{SEASON}.json"
            write_json(OUT / "teams" / fname, pack)
            write_json(UNIT_PACKS / "teams" / fname, pack)
            teams_out.append(
                {
                    "team_id": team_id,
                    "club_name": club,
                    "host": host,
                    "board_team_id": tid,
                    "seat_count": len(dualis_seats),
                    "roster_status": pack["roster_status"],
                    "players_url": players_url,
                }
            )

    index = {
        "title": "DualisCapax OMHA boys U16 AAA — Dualis branch index",
        "law": "Dualis packs. Cite pipes (OMHA/club boards) feed seats — Dualis is not Sportsheadz.",
        "pattern": "trunk→branch→seat",
        "season": SEASON,
        "captured_at": utc_now(),
        "team_count": len(teams_out),
        "teams": teams_out,
        "errors": errors,
        "hosts_scanned": len(hosts),
    }
    write_json(OUT / "INDEX.json", index)
    write_json(UNIT_PACKS / "INDEX.json", index)

    if QUEUE_PATH.exists():
        try:
            q = json.loads(QUEUE_PATH.read_text())
        except json.JSONDecodeError:
            q = {}
        q["status"] = "harvesting"
        q["last_harvest_at"] = utc_now()
        q["last_team_count"] = len(teams_out)
        q["notes"] = "OMHA U16 AAA Dualis packs from public cite pipes. Rosters echo-only."
        write_json(QUEUE_PATH, q)

    print(json.dumps({"ok": True, "team_count": len(teams_out), "errors": errors}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
