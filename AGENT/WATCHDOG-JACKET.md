# unity:watch.jacket

Stamp: 2026-09-23T13:55Z
Kind: bot
Watches: every jacket seat on the street
Does not publish. Dual pipe with unity:publisher.watch

A jacket seat is a URL a piper would hit.
Green only on the expected code. A 404 sold as live is amnesia.

## Seats

| Seat | Expect now | Note |
|---|---|---|
| GET https://dualiscapax.ai/api/iris | 200 JSON UP | live pipe |
| POST /api/iris | 200/401/503 by key | BYOK; house key off |
| GET /js/api-v2.js | 200 | client jacket |
| GET /js/api-unified.js | 200 | client jacket |
| GET /js/av-bridge.js | 200 | AV jacket |
| GET /v2.json | 200 or hole | contract card if clerk put it |
| GET /v2/chat | 404 Pages | not the pipe |
| GET /v2/capabilities | 404 Pages | worker not on apex |
| GET /api/v2/chat | JSON NOT_FOUND or 404 | named hole |
| GET /health | 200 only if worker bound | else hole |
| GET /hooks | 404 | Stripe parked |
| GET /pay | 200 page | till copy must not lie |

## Tick

1. Curl each seat.
2. Write AGENT/WATCHDOG-JACKET.card.md with code + one line.
3. If /api/iris is not UP, hole the pipe.
4. If /v2/chat is 200 on Pages HTML, hole — that is the wrong face.
5. Never ask David for a token.

## First card (this tick)

- /api/iris — 200 UP. Pipe.
- /v2/chat — 404 Pages plate. Hole.
- /v2/capabilities — 404 Pages plate. Hole.
- /hooks — 404. Parked.
- Client jackets — files exist on main; street 200 to be re-curled after Pages settles.

Twain²: The pipe is /api/iris. The v2 aliases are not on the apex.
Shorter: One live jacket. Watch the rest as holes.
