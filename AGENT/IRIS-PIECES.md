# Iris hashed work pieces

Stamp: 2026-09-23T14:57Z
A piece is small. A piece has a hash. A piece does not promote itself.

Hash = git blob sha of the file on `main`.
LIVE = street curl matches `expect`.
Piece N+1 does not start until piece N is SEALED.
Piece N is not LIVE until the probe is green.

SEALED is not LIVE. Pages can 503 a sealed file.

## Law

1. One writer per path. Dual pipe: one watch.
2. Do not start the next piece because chat said the last one shipped.
3. Do not claim guaranteed street. Claim guaranteed *bytes* + a named probe.
4. A hash mismatch is FAILED. Re-mint. Do not patch the receipt to match a hole.

See `AGENT/IRIS-PIECES.json`.
