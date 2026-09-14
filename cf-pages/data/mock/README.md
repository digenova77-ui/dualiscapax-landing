# Mock fixtures (blow-away)

## `league-dom.json`

- **Purpose:** Dom Di Genova Quinte #29 Game Day League pane format test only.
- **Kill switch:** `MOCK_LEAGUE_ENABLED` in `cf-pages/js/ice-portal.js` (set `false`) **or** delete this file.
- **Gate:** Quinte `#29` last name contains `di genova` only. Other seats never see mock rows.
- **Law:** Fixture file only — never written into Dom seat profile / Me attrs. After testing, flip kill switch / delete file → zero ghost.
- **Label in UI:** `MOCK · prior season · Dom test only · blow-away`
- **Data:** Prior-season OMHA AAA U16 board echo (standings + Pool B scores) + Quinte OMHA scorers slice for Dualis row format proof. Not live 2026-27.
