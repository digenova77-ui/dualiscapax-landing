# Unit: Hockey — boys/men amateur trunk

- **Trunk / branch:** sports/hockey-boys-amateur
- **Job:** Ontario AAA gym → Dualis trunk→branch→seat packs (Ice / DCLM / matchups). Port pattern outward later.
- **Product law:** Dualis is the session/seat layer. Public OMHA / club Sportsheadz boards are **cite pipes only** — never the UX ceiling.
- **Playground / seat object:** league → age → team → roster seat (`dc.seat.identity.v1`)
- **Cite classes allowed:**
  - OMHA AAA public standings / season boards
  - Club current-season pages (privacy initials OK)
  - GameSheet when available (connector later — never ask paste)
  - Elite Prospects / HockeyDB for U16+ path cites when listed
- **Blocked without partner:** Spordle verify API, TeamSnap OAuth handshake beyond in-chat login form
- **Status:** harvesting (OMHA U16 AAA Dualis packs)
- **Workflow:** `hockey_boys_omha_u16.yml`
- **Cron slot:** C (`17,47 * * * *`)
- **Script:** `scripts/harvest_hockey_boys_omha_u16.py`
- **Packs path:** `research/hockey/boys-amateur/omha-u16-aaa/` (+ unit packs mirror)
- **Seat law:** echo cites only; never invent surnames/stats; Quinte hand-built seats remain richer than first-pass echo
