# Document pane

Half-size window for medical simulation and engineering **Look** sheets.

## Law
- Catalog = titles + Look sheets only. No sealed bodies in git.
- Prices from `research/payment-links.json` V8.
- `open: false` — UI says CLOSED, not Buy now.
- Medical library does not open engineering.
- Crypto audit ≠ IP unlock.
- Simulation ≠ treatment. Engineering ≠ P.Eng. stamp.

## Files
| Path | Role |
| --- | --- |
| `research/doc-catalog.json` | Look catalog |
| `js/doc-pane.js` | Opens `window.open` at 50% or overlay fallback |
| `css/doc-pane.css` | Pane + viewer skin |
| `research/doc-pane.html` | The window itself |
| `research/docs.html` | Public index |

Card 02 (`data-doc-class="engineering"`) and card 04 (`data-doc-class="medical"`) open this pane.
