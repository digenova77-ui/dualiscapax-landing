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
    """Echo carousel seats from club Players page. Never invent.

    Petes-style lines: jersey, First L, pos, year.
    Quinte-style lines: last name, year (+ /Players/{id}/ path).
    """
    url = f"https://{host}/Teams/{team_id}/Players/"
    cite: Dict[str, Any] = {"url": url, "fetched_at": utc_now(), "ok": False}
    try:
        body = http_get(url)
        cite["ok"] = True
    except Exception as e:
        cite["error"] = str(e)
        return [], cite
    title_m = re.search(r"<title>([^<]+)", body)
    cite["page_title_echo"] = re.sub(r"\s+", " ", title_m.group(1) if title_m else "").strip()

    seats: List[Dict[str, Any]] = []
    parts = body.split("hover-function player")
    skip = {
        "view full bio", "add", "share", "coaches & staff", "send", "email", "vcard",
        '">',
    }
    for part in parts[1:]:
        seg = part[:3000]
        hrefs = re.findall(r'href="(/Teams/\d+/Players/\d+/)"', seg)
        board_player_path = hrefs[0] if hrefs else None
        board_player_id = None
        if board_player_path:
            m = re.search(r"/Players/(\d+)/", board_player_path)
            board_player_id = m.group(1) if m else None

        tmp = re.sub(r"<script[\s\S]*?</script>", "", seg)
        tmp = re.sub(r"<[^>]+>", "\n", tmp)
        lines = []
        for ln in tmp.splitlines():
            ln = re.sub(r"\s+", " ", ln).strip()
            if not ln:
                continue
            if ln.lower() in skip:
                continue
            if ln.startswith("<"):
                continue
            lines.append(ln)

        jersey = None
        display = None
        pos = None
        year = None
        # Walk lines: optional jersey digit, name, optional pos letter, year
        i = 0
        while i < len(lines):
            ln = lines[i]
            if jersey is None and re.fullmatch(r"\d{1,2}", ln):
                jersey = int(ln)
                i += 1
                continue
            if year is None and re.fullmatch(r"20\d{2}", ln):
                year = int(ln)
                i += 1
                continue
            if pos is None and re.fullmatch(r"[FDG]|LW|RW|C|[Dd]efence|[Ff]orward|[Gg]oal(?:ie)?", ln):
                pos = ln.upper() if len(ln) <= 2 else ln
                if pos in ("DEFENCE", "D"):
                    pos = "D"
                elif pos in ("FORWARD", "F"):
                    pos = "F"
                elif pos.startswith("GOAL"):
                    pos = "G"
                i += 1
                continue
            if display is None and re.search(r"[A-Za-z]", ln) and not re.fullmatch(r"20\d{2}", ln):
                # privacy First L / last-only / First Last
                if len(ln) <= 48 and "http" not in ln.lower():
                    display = ln
                i += 1
                continue
            i += 1

        if not display:
            continue
        # Coaches bleed: skip if no year and looks staff
        if year is None and board_player_id is None:
            continue
        seats.append(
            {
                "jersey": jersey,
                "display_name_echo": display,
                "pos_echo": pos,
                "birth_year_echo": year,
                "board_player_id": board_player_id,
                "board_player_path": board_player_path,
                "cite_status": "cited_board",
            }
        )
    cite["echo_count"] = len(seats)
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
            pack_note_rich = None
            dualis_seats = []
            for row in roster_echo:
                j = row.get("jersey")
                bpid = row.get("board_player_id")
                if j is not None:
                    seat_key = f"{team_id}.#{j}"
                elif bpid:
                    seat_key = f"{team_id}.board-{bpid}"
                else:
                    seat_key = f"{team_id}.name-{slugify(row['display_name_echo'])}"
                last = None
                initial = None
                first = None
                name = row["display_name_echo"]
                # First L  / First Last / Last
                m = re.match(r"^([A-Za-z]+)\s+([A-Z])$", name)
                if m:
                    first, initial = m.group(1), m.group(2)
                    last = None  # privacy truncated surname
                    display = f"{initial}. {first}" if False else name  # keep board echo form
                else:
                    display = name
                    if " " not in name:
                        last = name
                dualis_seats.append(
                    {
                        "seat_key": seat_key,
                        "display_name": display,
                        "preferred_alias": display,
                        "aliases": [display],
                        "jersey": j,
                        "last": last,
                        "first": first,
                        "initial": initial,
                        "birth_year": row.get("birth_year_echo"),
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
                            "sportsheadz_player": bpid,
                        },
                        "cite_status": row.get("cite_status") or "cited_board",
                        "landing_prebaked": False,
                    }
                )
            # Prefer richer hand-built Dualis seats when present (Quinte) — never dilute
            rich_path = ROOT / "cf-pages" / "data" / f"{club_slug}.u16.{SEASON}.seats.json"
            # also try quinte-red-devils naming
            if not rich_path.exists():
                alt = list((ROOT / "cf-pages" / "data").glob(f"*{club_slug}*.seats.json"))
                # common: quinte-red-devils.u16.2026-2027.seats.json
                for cand in (ROOT / "cf-pages" / "data").glob(f"*.u16.{SEASON}.seats.json"):
                    try:
                        rich = json.loads(cand.read_text())
                    except Exception:
                        continue
                    if club_slug in (rich.get("team_id") or "") or club_slug in cand.name:
                        rich_path = cand
                        break
            if rich_path.exists():
                try:
                    rich = json.loads(rich_path.read_text())
                    if len(rich.get("seats") or []) >= len(dualis_seats):
                        dualis_seats = rich["seats"]
                        pack_note_rich = str(rich_path.relative_to(ROOT))
                    else:
                        pack_note_rich = None
                except Exception:
                    pack_note_rich = None
            else:
                pack_note_rich = None
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
                "roster_status": ("rich_dualis_seats" if pack_note_rich else ("echoed" if dualis_seats else "awaiting_player_cites")),
                "rich_seats_source": pack_note_rich,
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
