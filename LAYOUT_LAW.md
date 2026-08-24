# #LAYOUT_LAW — DualisCapax (LOCKED)

**Phone users get a mobile product. Desktop users get a desktop product. Not one design squeezed.**

## #MOBILE (default — primary)
- Full-width brand, large type
- One idea per scroll screen
- Engagement: helix + glass story film
- **No noise:** no sidebars, no dense link grids, no desktop chrome
- Thumb-friendly Continue list at end only

## #DESKTOP (≥1024px)
- Static pane shell: side nav + main stage
- Helix can sit in main stage; story in readable column
- Navigation always visible in side pane
- Does **not** inherit mobile-only full-bleed constraints as a compromise

## #TABLET (768–1023)
- Hybrid: mobile story flow + optional overlay for secondary links

## Files
- `skin/default.css` — both skins via media queries
- `content/story.json` — shared words
- `js/plane-engine.js` — shared engine

Agents: do not ship desktop layout as the mobile experience.
