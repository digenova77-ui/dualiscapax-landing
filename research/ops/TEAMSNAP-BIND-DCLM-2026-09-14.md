# DCLM — TeamSnap bind process (2026-09-14)

## Loop (as designed)
1. User picks seat → pending_claim on device
2. Press Connect → OAuth authorize (user logs in — Dualis does not auto-login)
3. Callback `/oauth/teamsnap.html` → worker exchanges code → access_token on device
4. Seal pending jersey `how:oauth` → drop Tab 1 `#seat` proven face
5. Optional: pull `/me` + schedule (nice); **not required** to seal if token valid + pending known

## Verdict
**PASS with one critical fix.** Pending seat + validated token is enough for every player (Dom is not special). Soft me/jersey cross-check is optional depth — if TeamSnap me cannot mirror jersey, seal still stands.

## Weaknesses (ranked)

### 1. CRITICAL — Redirect origin mismatch (root of mobile stall)
- `api-config` hard-forced `DC_TEAMSNAP_REDIRECT = https://dualiscapax.ai/oauth/teamsnap.html`
- Household tests on `dualiscapax-landing.pages.dev`
- OAuth state + `pending_claim` written on **pages.dev** origin
- TeamSnap returned (or tried to return) to **apex** → blank/stall / lost state / no bounce to Dualis Tab 1
- **Fix:** same-origin `redirectUri()`; allowlist both URLs in TeamSnap developer app

### 2. HIGH — Full-page navigation away from Dualis
- `location.href = auth.teamsnap.com` replaces Dualis tab
- If TeamSnap UI blanks (user screenshot: header only), user is stranded with no Dualis chrome
- Better later: paired tab / Dualis stays Tab 1 (LiveBarn pattern) — only if TeamSnap OAuth allows return without same-tab replace; often OAuth wants same window. Mitigate with clear “return URL” + same-origin callback first.

### 3. MED — Callback success landed `#game` (pre-patch)
- Bound face is Seat (Tab 1). Game is next. Fixed → always `#seat` once sealed.

### 4. MED — No soft identity cross-check
- Seal trusts pending jersey + token, does not yet match TeamSnap `/me` or team roster jersey
- Fine as MVP (“if it can’t, you’ve got it”)
- Better: after `/me` + members, if jersey conflict → show cite sheet (pending vs TeamSnap) without inventing; never silent rewrite

### 5. LOW — Worker / secret dependency
- Token exchange needs depth worker `TEAMSNAP_CLIENT_SECRET`
- Failures surface on callback page; good. Keep never asking user for secrets.

### 6. LOW — Inefficiency
- Full schedule pull before redirect can delay bounce; prefer seal+redirect first, schedule refresh async on Ice

## Better loop (target)
1. Connect (user presses) → same-origin redirect_uri
2. Token OK = login validated
3. Seal pending → `#seat` Bound card (Tab 1) immediately
4. Background: schedule + optional roster jersey echo vs pending
5. Dualis stays the session; TeamSnap is the prove pipe only
