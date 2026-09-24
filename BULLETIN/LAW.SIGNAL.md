# LAW.SIGNAL — identifiable store, discard noise

**Status:** STANDING 2026-09-24T19:11-04:00
**MOTION-ID:** MILL-KEEP
**Table:** `BULLETIN/SIGNAL.STORE.md`

## Schema

Every stored cell has:
ID · kind · claim · named object · last measurement · last TEST-ID · departments · SHA

Kinds:
- `K-` production KEEP (lease)
- `L-` loss (signal — named dirt)
- `M-` map (trio receipt)
- `E-` evidence (sidecars, old receipts)
- `A-` archive (retired face-law)
- `N-` noise (no ID, reprint, speech that fights curl with no object)

No ID = noise. Reprint of a sealed cell = noise. Hope is not a clock.

## Meaning filter

A cell becomes K-PROD only if:
- the named object exists
- the measurement matches the claim, or the claim is explicitly a hole
- Twain² does not fight the measurement
- involved seats marked CROSSCHECK

LOSS is signal. Cafe-as-current-face is noise. Cafe-on-street as L-CAFE-APEX is loss.
Sidecars stay evidence. They never enter LAW.CURRENT.
Archive / noise / evidence: demote status, do not delete bytes.
