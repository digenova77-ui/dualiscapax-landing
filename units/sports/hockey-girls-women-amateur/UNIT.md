# Unit: Hockey — girls/women amateur trunk

- **Trunk / branch:** sports/hockey-girls-women-amateur
- **Job:** Silent harvest to build the map where infrastructure is thin — platform scaffold for depth/complexity, not a PWHL PR skin
- **Playground / seat object:** league → age → team → roster seat (peer trunk to boys/men amateur)
- **Cite classes allowed (layer 1):**
  - OWHA / girls AAA public boards when posted
  - Club season pages / Sportsheadz-style current rosters (privacy initials OK)
  - Instagram roster-reveal cards when jersey+name+pos present
  - GameSheet when the league uses it (connector later — never ask paste)
  - Elite Prospects only U16+ when listed
- **Blocked without partner:** Spordle verify API
- **Status:** queued (structure + cite class locked; harvest script next)
- **Workflow:** none yet — assign cron slot B when script writes packs
- **Cron slot (planned):** B (`12,42 * * * *`)
- **Verification layer cap:** 1 (do not spawn cron until layer 2 harvest script exists)
- **Packs path:** `units/sports/hockey-girls-women-amateur/packs/` then mirror under `research/hockey/girls-women/` when live
