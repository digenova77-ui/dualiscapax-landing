# CSS law — before the pages

Do not restyle the mountain yet. This file is the invert of the CSS sprawl.

## Friction (what is on disk now)

Many skins: `theme.css` (root), `assets/theme.css`, `assets/brand.css`, `glass-tiers`, `cta`, `hero-fill`, `layout-law`, `mobile-depth`, `mobile-life`, `site-lander`, `standard`, `text-scale`, `seat-deck`, `presentation`, `medical-docs`, `disease-leaf`, `journal-stage`, `money-gate`, plus `css/holo-depth.css` and quarks.

ARCHITECTURE.md said: skin variables, not a new index. The tree did not obey.

## Affinity (keep)

- IBM Plex as body + mono kickers
- Dark paper + gold tally (broadcast bar, not carnival)
- `--bg / --fg / --muted / --line / --blue / --warm`
- `prefers-reduced-motion`
- Layout law: mobile gist, desktop column

## Knock out later (ask C before mass delete)

Duplicate theme files. Page-local CSS that only restates tokens. Google Fonts `@import` if we self-host Plex. `user-select: none` on whole body if invert needs copy.

## Target stack (do not invent a 20-year hologram)

```
@layer reset, tokens, base, layout, fabric, motion;
```

### tokens (single source)

```css
@property --gold { syntax: "<color>"; inherits: true; initial-value: #e8c36a; }
:root {
  color-scheme: dark;
  --bg: #020308;
  --fg: #f5f5f5;
  --muted: color-mix(in oklab, var(--fg) 68%, transparent);
  --line: color-mix(in oklab, #9ec5ff 20%, transparent);
  --blue: #9ec5ff;
  --gold: #e8c36a;
  --warm: #f3e6d0;
  --g: 0.55rem;
  --n: 42rem;
  --z-sky: 0;
  --z-wrap: 1;
  --z-sticky: 5;
}
```

### layout

- One `.site` measure (`--n`)
- Container type on `.site` — queries for desk vs porch width, not a new engine
- Subgrid only when a desk already has a grid parent

### fabric

- `.layer` / `.row` / `.door` / `.hud` stay names
- Gold square before kicker = tally, not a logo rip

### motion

- Last layer. `@media (prefers-reduced-motion: reduce) { * { animation: none; } }` wins.

## Next hour (still not the website)

1. Write `css/tokens.css` only.
2. Point one *new* shard at it (field-notes already exists — optional).
3. Do not rewrite `index.html`.

Never 100. Dualis does not own CSS. Dualis owns whether we smash another file before the tokens exist.
