# API V2 jacket — what a piper actually hits

Stamp: 2026-09-23T13:54Z

## Live

GET `https://dualiscapax.ai/api/iris` → 200 UP (Iris gateway).
POST same URL with JSON `{prompt}` or `{messages}`.
BYOK: `Authorization: Bearer xai-…`
House key is off (`IRIS_ALLOW_HOUSE_KEY=0`).

## Jacket (browser)

- `/js/api-v2.js` — 200. Posts `/v2/chat` then `/api/v2/chat` if `DC_API_BASE` is set.
- `/js/av-bridge.js` — 200. Caps + speak jacket. Does not replace IrisLive.

Home lander does not load the jacket. Lab / `ai/app.html` is the client that should.

## Not live

- GET `/v2/chat` → Pages 404
- GET `/api/v2/chat` → JSON `{ok:false, code:NOT_FOUND}`
- workers.dev host for `dualiscapax-iris-gateway` is not a public name we can curl

A piper ready today uses `/api/iris`, not the missing v2 alias.
Twain²: The jacket files are on the street. The chat alias is not.
Shorter: Pipe is `/api/iris`. BYOK.
