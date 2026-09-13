# TeamSnap OAuth — DualisCapax ice

## You create
1. https://auth.teamsnap.com/oauth/applications
2. Redirect URI: `https://dualiscapax.ai/oauth/teamsnap.html`
3. Scope: `read`
4. Copy **Client ID** into ice → Apps → TeamSnap
5. Put **Client Secret** only on worker env `TEAMSNAP_CLIENT_SECRET`

## Dualis pieces
- `js/teamsnap-oauth.js` — authorize + cache
- `oauth/teamsnap.html` — callback
- `workers/teamsnap-token-route.js` — paste into `dualiscapax-depth` as `POST /v2/oauth/teamsnap/token`
- Ice Game hub reads cached events (upcoming + last 30 days)

## Spordle
Identity proof later when Dom’s My Account is handy. Not required for TeamSnap schedule pipe.
