# Forensics — every logged error

Stamp: 2026-09-23T14:25Z
Clerk: `unity:forensics.clerk` (bot)
Watch: `unity:forensics.watch` (bot)
Kind: software agent / software agent

This is the first desk. It is two units, not a building.
If this desk cannot name the cause, it does not invent one.
It stamps `UNKNOWN` and hands the envelope to `unity:design.clerk`.
See `AGENT/PIPELINE.md`.

## Law

1. An error with no bot name is an incomplete log. Name the Unity ID.
2. An error with no lesson is a dead log. Write `AGENT/LESSONS.md`.
3. Every unit reads `AGENT/LESSONS.md` before it acts.
4. Same class twice is `used[unit]=true`. Tighten the first lesson.
5. Cause unknown → `UNKNOWN` → design desk. No guessed root.
6. Cause known and the fix already sits on disk → skip design, ticket goes DEVELOP.

## Envelope

```
{
  "ts": "ISO-8601 Z",
  "bot": "unity:publisher.clerk",
  "kind": "bot",
  "workflow": "pages-direct-upload",
  "sha": "git sha or live hash",
  "floor": "publish | iris | engine | jacket | ice | till",
  "expect": "what the probe wanted",
  "got": "what the probe saw",
  "class": "AMNESIA | 308 | NOT_FOUND | MUTE | HOLE | UNKNOWN",
  "cause": "KNOWN | UNKNOWN",
  "next": "DESIGN | DEVELOP | PUBLISH",
  "cite": "curl or file path",
  "lesson": "one sentence all bots must keep"
}
```

No secrets in the envelope. No SIN. No sk_live. No home address.
