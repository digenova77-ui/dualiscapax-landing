# Unified login — passkey-first (Unity ID)

**DualisCapax** · ED-COM-20260912-UNITY-PASSKEY-V1  
**Goal:** Minimize passwords on Dualis. One Unity ID. Partner apps link intimately via OAuth — not by inventing more passwords.

Related: `PARTNER-ASK-HOCKEY-CONNECTORS.md` · `ONTARIO-AAA-IDENTITY.md` · ice Apps bind (login links + attestation today).

---

## What “unified” actually means

Two different doors get confused as one:

| Door | What it is | Password? |
|---|---|---|
| **A · Dualis home** | Unity ID unlocks ice portal, vault, connectors list | **Passkey** (WebAuthn face/finger). Optional recovery phrase. No Dualis server password. |
| **B · Partner link** | TeamSnap / Spordle / LiveBarn / GameSheet / Hudl grant Dualis *read* of their data | **Their** OAuth (or partner API). User may already use Google *inside* TeamSnap — that stays their business. Dualis never scrapes a Google cookie. |

We **cannot** install a Dualis passkey on TeamSnap’s login page. Passkeys are per-site (relying party). What we *can* do is: unlock Dualis with a passkey, then run OAuth so Dualis **knows** the link.

---

## Target UX (athlete / parent)

1. Open Dualis → **Unlock with passkey** (or create one on onboard).  
2. Claim seat → prove (Spordle preferred / TeamSnap email when OAuth ships).  
3. Apps → **Connect TeamSnap** → browser OAuth consent → return to Dualis → chip says **Bound · OAuth**.  
4. Same for LiveBarn (tape pointer), GameSheet (score pull — never paste), Hudl (optional).  
5. Tokens live in the **on-device vault** gated by the same passkey. Dualis servers do not need the password to Spordle.

Optional later: “Continue with Google / Apple” **only** to bootstrap Unity ID on a new phone — then immediately register a passkey and prefer that forever.

---

## Path (phased)

### Phase 0 — now (shipped / shipping)
- Real vendor **login links** in ice Apps + seat prove.  
- **Attestation:** “I signed in — mark bound on this phone.” Honest local flag.  
- Dualis **cannot** detect their session from a new tab (browser law).  
- Onboard: optional passkey + device phrase (already in product law).

### Phase 1 — Dualis passkey-first (our site)
- Make passkey the **primary** unlock for ice + runtime (phrase = recovery, not daily login).  
- Minimize any password fields on dualiscapax.ai.  
- Store connector status + encrypted tokens behind WebAuthn unlock.  
- Google/Apple Sign-In = optional bootstrap only, not the daily door.

### Phase 2 — TeamSnap OAuth (self-serve — first intimate link)
- Register OAuth app at TeamSnap (`auth.teamsnap.com`, APIv3).  
- Scopes: `read` first (teams, members, events, availabilities).  
- Redirect URI: `https://dualiscapax.ai/oauth/teamsnap/callback` (and ice deep link).  
- On success: map TeamSnap member email ↔ chosen roster seat → `SETTLED` claim.  
- Mark bind `oauth` (replaces attestation).  
- **This is the closest thing to “login with that account”** we control without a partner MSA.

### Phase 3 — Spordle / HCR verify (partner ask)
- Prefer for Ontario AAA identity.  
- Need partner verify/OAuth: account holder linked to HCR member X after consent.  
- Read-only. No registry write.  
- See `PARTNER-ASK-HOCKEY-CONNECTORS.md` §0.

### Phase 4 — LiveBarn / GameSheet / Hudl
- LiveBarn: partner OAuth → surface list + media window **pointer** (not CDN host).  
- GameSheet: league-scoped score API / OAuth — **never paste**.  
- Hudl: partner library read + deep links.  
- Each returns OAuth → vault under passkey.

### Phase 5 — polish
- One “Connected accounts” screen under Apps.  
- Revoke per vendor.  
- Guardian gate for minors before tape/named roster.  
- Org seats: coach OAuth ≠ player seat proof.

---

## What we will not do

- Scrape WebUI or steal cookies after “Open TeamSnap.”  
- Claim Dualis passkey logs you into Spordle.  
- Ask families for their TeamSnap / LiveBarn passwords.  
- Paste GameSheet.  
- Host named-minor video.

---

## Why passkey (not Google-as-daily-login)

- Passkey = phishing-resistant, no Dualis password database to leak.  
- Fits on-device / CLEANUP_FIRST posture.  
- Google can still appear as *one* recovery / bootstrap IdP; the daily unlock stays WebAuthn on this device.  
- Partner intimacy is OAuth tokens, not federated Google into every rink vendor.

---

## Next concrete actions

1. You: try Apps binds with real logins + attest (smoke).  
2. Us: Phase 1 — ice unlock requires passkey when one exists.  
3. Us: Phase 2 — TeamSnap OAuth app registration (you own the TeamSnap developer account).  
4. You: Spordle / LiveBarn / GameSheet partner intros using `PARTNER-ASK-HOCKEY-CONNECTORS.md`.



---

## Identity handshake (TeamSnap / Spordle)

LiveBarn is soft (tape pointer). **TeamSnap + Spordle** are identity-critical.

Until partner OAuth lands, Dualis still needs a **signed local receipt** that the user completed UV (passkey) when marking the bind:

1. User opens vendor login (real URL).  
2. User signs in on *their* site.  
3. Back in Dualis → **I signed in — passkey handshake**.  
4. WebAuthn `get()` assertion → receipt `dc.identity.handshake.v1` with `receipt_hash` + assertion signature fields, stored under `dc.ice.proof.{vendor}`.  
5. Bind state becomes `handshake` (not bare attestation).

**What this proves:** a real human with the Dualis passkey attested the bind on this device at time T.  
**What this does not prove yet:** that TeamSnap’s servers issued a token to Dualis (that is Phase 2 OAuth — same receipt schema upgrades `how` to `oauth`).

Ice unlock: if a passkey exists, the rink stays gated until WebAuthn unlock for the session (~12h).


---

## TeamSnap schedule pipe (Phase 2 value)

After OAuth `read` on the claimed seat’s team:

| Dualis surface | TeamSnap source |
|---|---|
| Game hub · next puck / practice | Upcoming `event` (game + practice types) |
| Game hub · last 30 days | Recent events + availability / results if present |
| Season board | Full team season schedule |
| Go · rink + Maps | Event location fields |
| En-route countdown | Event start − pasted/live ETA |

Spordle/HCR = identity proof. TeamSnap = calendar + roster seat graph. Do not invent events — echo only what OAuth returns.
