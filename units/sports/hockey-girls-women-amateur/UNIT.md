# Unit: Hockey — girls/women amateur trunk

- **Trunk / branch:** sports/hockey-girls-women-amateur
- **Job:** Silent harvest to build the map where infrastructure is thin — platform scaffold for depth/complexity, not a PWHL PR skin
- **Playground / seat object:** league → age → team → roster seat (peer trunk to boys/men amateur)
- **Cite classes allowed (layer 1):**
  - OWHA / girls AA public boards when posted (Ontario top club band; AAA label rare on OWHA boards)
  - Club season pages / Sportsheadz-style current rosters (privacy initials OK)
  - Instagram roster-reveal cards when jersey+name+pos present
  - GameSheet when the league uses it (connector later — never ask paste)
  - Elite Prospects only U16+ when listed
- **Blocked without partner:** Spordle verify API
- **Status:** harvesting (branch index live)
- **Workflow:** `hockey_girls_owha.yml`
- **Cron slot:** B (`12,42 * * * *`)
- **Script:** `scripts/harvest_hockey_girls_owha.py`
- **Verification layer cap:** 4
- **Packs path:** `research/hockey/girls-women/` (+ mirror under `units/.../packs/`)
- **Roster law:** team stubs only until player cites exist — never invent surnames/stats
