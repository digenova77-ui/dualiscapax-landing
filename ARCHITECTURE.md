# DualisCapax site architecture

**Principle:** Build the whole thing once. Change the **skin** without rebuilding content or engine.

| Layer | File(s) | Changes when… |
|-------|---------|----------------|
| **Content** | `content/story.json` | Copy, beats, links change |
| **Skin** | `skin/default.css` (swap file or variables) | Colors, type size, spacing, density |
| **Engine** | `js/plane-engine.js` | WebGL / scroll behavior |
| **Shell** | `index.html` | Almost never — loads the three layers |

## Skin variables (edit these, not the whole HTML)

```css
--brand-size
--title-size
--body-size
--pad
--gold
--bg
```

## Rule for agents

1. Copy change → `content/story.json` only  
2. Look/feel → `skin/*.css` only  
3. Motion/3D → `js/plane-engine.js` only  
4. Do **not** paste a full new index for a logo-size tweak  
