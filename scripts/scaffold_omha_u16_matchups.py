#!/usr/bin/env python3
"""Scaffold seat-owned OMHA U16 AAA matchup packs across Dualis harvest teams.

Law: packs belong to seated player — never environment default.
Never overwrite status=live (e.g. Dom #29 vs Gaels).
Public board echoes become THEM chips only — Dualis is not Sportsheadz.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parents[1]
HARVEST = ROOT / "research" / "hockey" / "boys-amateur" / "omha-u16-aaa"
OUT = ROOT / "cf-pages" / "data" / "matchups"
SEASON = "2026-2027"

SLUG_ALIAS = {
    "greater-kingston-aaa-hockey": "greater-kingston-gaels",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def ice_slug(club_slug: str) -> str:
    return SLUG_ALIAS.get(club_slug, club_slug)


def load_teams() -> List[Dict[str, Any]]:
    teams = []
    for p in sorted((HARVEST / "teams").glob(f"*.u16.{SEASON}.json")):
        d = json.loads(p.read_text())
        seats = [s for s in (d.get("seats") or []) if s.get("jersey") is not None]
        club_slug = d.get("club_slug") or p.name.split(".u16.")[0]
        teams.append(
            {
                "club_slug": club_slug,
                "club_name": d.get("club_name"),
                "team_id": d.get("team_id"),
                "ice_slug": ice_slug(club_slug),
                "seats": seats,
                "roster_status": d.get("roster_status"),
            }
        )
    return teams


def them_chips(opp: Dict[str, Any], limit: int = 8) -> List[Dict[str, str]]:
    chips = []
    for s in (opp.get("seats") or [])[:limit]:
        bits = []
        if s.get("jersey") is not None:
            bits.append(f"#{s['jersey']}")
        if s.get("display_name"):
            bits.append(str(s["display_name"]))
        if s.get("pos"):
            bits.append(str(s["pos"]))
        chips.append(
            {
                "t": " · ".join(bits),
                "s": "cited_board" if s.get("cite_status") else "awaiting",
            }
        )
    if not chips:
        chips.append({"t": "Opponent roster awaiting Dualis cite echo", "s": "awaiting"})
    return chips


def pack_path(team_slug: str, jersey: int, opp_slug: str) -> Path:
    return OUT / team_slug / str(jersey) / f"vs-{opp_slug}.json"


def main() -> int:
    teams = load_teams()
    with_seats = [t for t in teams if t["seats"]]
    created = 0
    skipped_live = 0
    skipped_existing = 0

    for home in with_seats:
        for seat in home["seats"]:
            jersey = int(seat["jersey"])
            for opp in teams:
                if opp["ice_slug"] == home["ice_slug"]:
                    continue
                path = pack_path(home["ice_slug"], jersey, opp["ice_slug"])
                if path.exists():
                    try:
                        old = json.loads(path.read_text())
                    except Exception:
                        old = {}
                    if old.get("status") == "live":
                        skipped_live += 1
                        continue
                    if old.get("them") and old.get("status") == "awaiting_player_cites":
                        skipped_existing += 1
                        continue

                you_bits = [
                    x
                    for x in [
                        seat.get("display_name") or seat.get("preferred_alias"),
                        f"#{jersey}",
                        seat.get("pos"),
                    ]
                    if x
                ]
                pack = {
                    "law": "Belongs to seated player only — never environment default. Prepared ahead across OMHA U16 AAA.",
                    "status": "awaiting_player_cites",
                    "seat": {
                        "team_slug": home["ice_slug"],
                        "jersey": jersey,
                        "last": seat.get("last"),
                        "display_name": seat.get("display_name") or seat.get("preferred_alias"),
                        "pos": seat.get("pos"),
                    },
                    "opponent": {
                        "team_slug": opp["ice_slug"],
                        "label": opp.get("club_name") or opp["ice_slug"],
                    },
                    "appointment_note": f"OMHA U16 AAA · {SEASON} · pack prepared ahead",
                    "edge": "—",
                    "dos": [],
                    "you": [{"t": " — ".join(str(x) for x in you_bits), "s": seat.get("cite_status") or "awaiting"}],
                    "them": them_chips(opp),
                    "cite_sheet": {
                        "you_status": "awaiting_player_cites",
                        "them_status": "cited_board" if opp.get("seats") else "awaiting",
                        "note": "Fill YOU/dos/edge from cites only — never invent. Dom household notes stay on Dom seat only.",
                    },
                    "captured_at": utc_now(),
                }
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(json.dumps(pack, indent=2) + "\n")
                created += 1

    packs = sorted(str(p.relative_to(OUT)) for p in OUT.rglob("vs-*.json"))
    pairs = []
    for i, a in enumerate(teams):
        for b in teams[i + 1 :]:
            pairs.append(
                {
                    "home": a["ice_slug"],
                    "away": b["ice_slug"],
                    "note": "OMHA U16 AAA dual direction when seats exist",
                }
            )
    index = {
        "law": "Matchup packs belong to the seated player (team+jersey), not the Ice environment. Prepare opponent packs ahead. Dom household cites only on Dom's seat.",
        "season": SEASON,
        "league": "OMHA AAA U16",
        "updated_at": utc_now(),
        "teams_with_seats": [
            {
                "ice_slug": t["ice_slug"],
                "club_name": t["club_name"],
                "seat_count": len(t["seats"]),
            }
            for t in with_seats
        ],
        "pairs": pairs,
        "pack_count": len(packs),
        "packs": packs,
        "scaffold": {
            "created_this_run": created,
            "skipped_live": skipped_live,
            "skipped_existing_awaiting": skipped_existing,
        },
    }
    (OUT / "INDEX.json").write_text(json.dumps(index, indent=2) + "\n")
    print(
        json.dumps(
            {
                "ok": True,
                "created": created,
                "skipped_live": skipped_live,
                "skipped_existing": skipped_existing,
                "pack_count": len(packs),
                "teams_with_seats": len(with_seats),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
