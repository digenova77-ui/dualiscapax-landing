# Ice bound UX — gaps observed (no new features)

Snapshot while waiting on Dom for better roster sources. Laws: bound seat = `how==="oauth"` via `seatIsBound()`; never invent player names/rosters.

## Done this pass

- **Me** (`js/ice-portal.js` `renderMe`): when `seatIsBound()`, stage opens with a seated identity strip (jersey / team / Bound·TeamSnap) from the existing seat row — not empty/unregistered chrome. Gate uses `seatIsBound()`, not bare `getSeat()`.
- **Game** (`renderGame`): `lockedHtml` (“Claim a seat first”) now keys off `!seatIsBound()` so a non-oauth seat row cannot unlock Game Day.

## Other module opportunities (code gaps only)

### Go / Tape / School / Apps — same loose gate

- `renderGo`, `renderTape`, `renderSchool`, `renderApps` still use `if (!getSeat()) return lockedHtml()`.
- Same mismatch class as Game had: any leftover non-oauth seat object would unlock these stages; unbound with no seat correctly shows claim chrome.
- Opportunity: flip each to `!seatIsBound()` for one law everywhere. Seat stage already correctly branches on `seatIsBound()` → `renderSeatBoundCard`.

### Tape

- Bound path still shows “No tape yet” / Demo tape / “Bind LiveBarn” with no seated identity context (unlike Seat bound card / Me strip).
- Lock gate still `getSeat()` (above). No LiveBarn identity link to the bound jersey in UI.

### School

- Bound path is paste/upload + “Check labels” only — no seated strip tying transcript echo to the bound jersey/team.
- Lock gate still `getSeat()`.

### Apps

- Cards show per-bind “Bound” / “Bind available” via `bindOn(id)` (`dc.ice.binds.*`), which can disagree with seat `how==="oauth"` (chip Bound vs Apps card state).
- TeamSnap card “Bound” is bind-flag based, not `seatIsBound()`.
- Lock gate still `getSeat()`.

### Lander / home / site entry

- `index.html` Ice CTAs hard-link `ice.html?pack=hockey#seat` and copy like “Claim seat · Game · Go · Tape” — static; no read of `dc.ice.seat` / bound state.
- Dock / Iris / explore / alacarte entry language stays “claim / enter” even when Ice chip on `ice.html` shows Bound·#jersey.
- Matches user note: home/site can look unseated while Ice chrome shows Dom bound. Fix would be lander-aware bound chip/copy (not invented here).
- `sport.html` links `ice.html?pack=hockey` without `#seat` (default stage then follows `qsStage` / `seatIsBound`) — better than lander’s forced `#seat`, but still no home-side bound affordance.
- `ice.html` static chip markup defaults to `Claim seat` / `is-empty` until `paintChip()` runs.

### Chip / paint

- `paintChip` toggles `is-empty` with `!s` (`getSeat()`), not `!seatIsBound()`. Pending path already special-cased. After boot ghost purge this usually aligns; mid-session edge cases could diverge.

### Exports

- `DCIce` exports `getSeat` but not `seatIsBound` — external callers cannot share the bound law without re-implementing `how==="oauth"`.

## Out of scope / not done

- No deploy.
- No invented roster or player names.
- No lander/home bound chrome in this pass.
