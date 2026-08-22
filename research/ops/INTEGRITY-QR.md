# Residual integrity + QR

## What is locked
SHA-256 of selected plane paths → root hash of sorted `path:sha256` lines.

## Human disclosure
`integrity.html` — TOC, full root, QR to the verify surface.

## Machine
`residual-integrity.json` — same data for automation / residual ring.

## What it proves
Published bytes match the snapshot. **Not** scientific truth.

## History chain
Each residual-ring promote can append a new root. Drift = root change + which entry changed.

## QR
Encodes URL to integrity page (GitHub Pages or production www once bound). Optional future: QR payload = `dcx:root:<hex>` for offline compare.
