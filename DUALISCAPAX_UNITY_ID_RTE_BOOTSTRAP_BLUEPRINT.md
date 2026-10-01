# DualisCapax Unity ID / API v2 / RTE Bootstrap Blueprint

**Document status:** DESIGN / BOOTSTRAP GAP IDENTIFIED  
**Target:** designated online computer when explicitly attached  
**Current execution environment:** temporary Sandbox  
**Primary rule:** prepare, verify, and receipt every operation; do not claim a live computer or live connector where none is bound.

> Unity ID can supersede scattered account identity only after it is built as a real issuer, authenticator, capability broker, and revocation system. It must never require or store a Google passphrase.

---

## 1. Audit findings

### 1.1 Live builder

The public builder currently exposes a deterministic scene contract:

- Manifest is edited as draft input.
- IDs, transforms, geometry kinds, and references are validated before WebGL objects are created.
- Unknown or 2D scene objects fail closed.
- Identical manifest plus compiler version is intended to produce an identical scene contract.
- The public client states that authoritative scene, receipt, and kernel state belong to the kernel/Father layer.
- The purity gate requires manifest authorization, determinism, non-destructiveness, kernel/Father signature, and a receipt.
- The UI describes a 2-of-3 Father / Son / Spirit approval boundary.
- No password or signing secret should be held by the public client.

The builder is therefore a **draft-and-verification client**, not a secure execution host.

### 1.2 API v2 jacket

Repository evidence in `AGENT/API-V2.md` states:

- `GET https://dualiscapax.ai/api/iris` is the current live Iris gateway.
- `POST /api/iris` accepts `{prompt}` or `{messages}`.
- BYOK is expected through `Authorization: Bearer xai-…`.
- The house key is disabled.
- `/js/api-v2.js` exists and attempts `/v2/chat`, then `/api/v2/chat` when `DC_API_BASE` is set.
- `/js/av-bridge.js` exists as a caps/speech jacket.
- `/v2/chat` is not live.
- `/api/v2/chat` returns a not-found response.
- The home lander does not load the jacket; `ai/app.html` is the intended client.

**Conclusion:** API v2 is currently a jacket/client contract, not a deployed API surface. The bootstrap must create an explicit versioned adapter rather than silently treating `/api/iris` as `/api/v2/chat`.

### 1.3 RTE

The runtime path specifies an invited runtime for a machine the holder already runs:

- Browser, Node, and Python hosts are supported in principle.
- The runtime is invited, not implanted or silently installed.
- The holder keeps books and keys on their device.
- The outbound surface is derived receipts and hashes, not raw books or credentials.
- Local bind can be live on the device; public-chain write remains `WAIT_GRANT` until a real grant exists.
- Plant/controller execution is not a safety system.
- No silent GPS, no credentials in chat/repo, and no claim of universal deployment.

**Conclusion:** RTE is a local/hosted runtime contract, not proof that an online computer currently exists or is perpetually available.

### 1.4 IPFS / Pinata

The repository law says:

- GitHub is the library.
- Cloudflare is live.
- Pinata is the spare copy.
- One fact belongs to one object.
- A successful Pinata API response does not prove public gateway retrieval.
- A CID must not be invented.
- Core lander pins and current-truth lean packs are distinct sets.

**Conclusion:** IPFS is a publication/backup connector, never an identity authority or write bypass.

### 1.5 Unity ID

The current Unity ID card describes an agency identity:

- Kind: human, bot, or swarm.
- Public white ledger: Unity ID, display name, jurisdiction, bound document types, expiry, review date, and rapport summary.
- Dark ledger: document numbers, health numbers, SIN, address, raw portrait bytes, and other sensitive values never appear in Git or on the public site.
- Defaults are hash-only after bind.
- The issuer, not localStorage, mints the ID.
- Revoke/re-issue requires a defined consensus path.

**Conclusion:** the Unity ID concept is a schema and policy, not yet a production issuer or universal login.

---

## 2. Non-negotiable security decision

### Never store a Google passphrase

Do not put a Google password or passphrase into:

- Unity ID fields.
- Dark Ledger records.
- GitHub Actions secrets.
- Cloudflare Worker variables.
- browser localStorage or IndexedDB.
- the public builder.
- chat messages, prompts, receipts, or RTE payloads.
- a local plaintext `.env` committed or uploaded anywhere.

### Correct access pattern

Use one of these instead:

1. **Google OAuth 2.0 Authorization Code + PKCE** for a web client.
2. **WebAuthn/passkeys** for the Unity ID authenticator.
3. **Short-lived access tokens** held only in memory where possible.
4. **Rotating refresh tokens** stored only in a platform secret vault or encrypted server-side session store.
5. **Device-bound credentials** for the designated online computer.
6. **Least-privilege Google scopes** selected per connector operation.
7. **Explicit revocation** through Google and the Unity ID issuer.

Unity ID should become the broker that proves who is asking and what capability was granted. It should not become a password vault.

---

## 3. Proposed identity architecture

```text
Holder
  │
  ├── WebAuthn / passkey assertion
  │
Unity ID issuer
  │  ├── subject + issuer + lifecycle
  │  ├── capability grants
  │  ├── expiry + nonce + audience
  │  ├── revocation registry
  │  └── audit event hash
  │
  ├── Google OAuth connector (scoped, delegated, revocable)
  ├── GitHub connector (repo/action scope only)
  ├── Cloudflare connector (Pages/Workers scope only)
  ├── Drive connector (file/folder operation scope only)
  └── Pinata/IPFS connector (pin/read scope only)

Dark Ledger: server-side metadata, hashes, votes, receipts; no raw secrets.
Public builder: draft, display, dry-run, receipt verification; no authority.
Father/kernel: final write only after verified policy and quorum.
```

### Unity ID record

```json
{
  "schema": "dualis.unity-id.v1",
  "id": "unity:subject:opaque-id",
  "issuer": "https://id.dualiscapax.ai",
  "kind": "human|bot|service|swarm",
  "workspace": "opaque-workspace-id",
  "status": "proposed|active|suspended|revoked|expired|retired",
  "authenticator": "webauthn",
  "audience": ["builder", "rte", "connector-gateway"],
  "issued_at": "RFC3339",
  "expires_at": "RFC3339",
  "review_at": "RFC3339",
  "nonce": "random-unique-value",
  "capabilities": [
    {
      "connector": "google-drive",
      "operation": "files.read|files.move",
      "resource": "opaque-resource-id",
      "scope": "narrow-scope",
      "expires_at": "RFC3339",
      "grant_id": "opaque-grant-id"
    }
  ],
  "revocation_ref": "opaque-revocation-id"
}
```

Sensitive government or financial identifiers remain outside this public record. Store only a cryptographic commitment and issuer attestation when a proper vault exists.

---

## 4. API v2 jacket bootstrap

### 4.1 Do not fake the route

Until deployed and tested, `/api/v2/chat` must return a structured `NOT_READY` or remain clearly documented as unavailable. It must not silently masquerade as a different API.

### 4.2 Adapter contract

Proposed endpoints:

| Method | Route | Purpose | Default side effect |
|---|---|---|---|
| `GET` | `/api/v2/health` | version, build, dependency, connector status | none |
| `POST` | `/api/v2/chat` | authenticated chat request | derived response only |
| `POST` | `/api/v2/tasks/prepare` | create a Dark Ledger prompt envelope | ledger append |
| `GET` | `/api/v2/tasks/{id}` | read task state/receipt | none |
| `POST` | `/api/v2/tasks/{id}/dry-run` | validate without external write | none |
| `POST` | `/api/v2/tasks/{id}/vote` | submit authenticated vote | ledger append |
| `POST` | `/api/v2/tasks/{id}/execute` | request Father/kernel execution | gated write |
| `GET` | `/api/v2/connectors` | show redacted connector capabilities | none |
| `GET` | `/api/v2/receipts/{id}` | verify a receipt | none |

### 4.3 Request envelope

```json
{
  "schema": "dualis.task.v2",
  "request_id": "opaque-id",
  "request_hash": "sha256(canonical-request)",
  "unity_id": "unity:subject:opaque-id",
  "target": "online-computer-id",
  "verb": "inspect|prepare|dry-run|write",
  "object": "connector/resource/object-id",
  "kind": "rte|builder|drive|github|cloudflare|ipfs",
  "base_revision": "git-sha-or-manifest-hash",
  "claim": {},
  "fetch_plan": {},
  "constraints": {
    "non_destructive": true,
    "reversible": true,
    "max_runtime_seconds": 600,
    "network_allowlist": []
  },
  "requested_by": "unity:subject:opaque-id"
}
```

### 4.4 Response envelope

Every response must say what happened:

```json
{
  "schema": "dualis.receipt.v2",
  "request_id": "opaque-id",
  "request_hash": "sha256",
  "status": "PASS|FAIL|HOLE|WAIT_GRANT|VETO",
  "stage": "claim|fetch|collapse|vote|dry-run|execute|receipt",
  "evidence": [],
  "connector_results": [],
  "before_hash": "sha256-or-null",
  "after_hash": "sha256-or-null",
  "rollback": {"available": true, "method": "opaque-reference"},
  "votes": [],
  "redactions": ["secret", "raw_identity_document"],
  "created_at": "RFC3339"
}
```

---

## 5. RTE bootstrap

### Browser host

- Load only an explicit runtime bundle.
- Display target, version, policy, and connector status.
- Never request a Google password.
- Use OAuth PKCE or passkey authentication.
- Keep access token memory-only when possible.
- Disable privileged commands by default.
- Require a dry-run receipt before any external write.

### Node host

```bash
node runtime/dualis.js --invite
node runtime/dualis.js --doctor
node runtime/dualis.js --manifest ./manifest.json --dry-run
node runtime/dualis.js --receipt ./receipts/latest.json
```

These commands are proposed interfaces; implement only if the referenced runtime files and their contracts exist. A command must fail closed when the Unity ID, target, base revision, or receipt is missing.

### Python host

```bash
python3 -m runtime.dualis --invite
python3 -m runtime.dualis --doctor
python3 -m runtime.dualis --manifest ./manifest.json --dry-run
python3 -m runtime.dualis --verify-receipt ./receipts/latest.json
```

### Controller/plant boundary

Do not describe the runtime as a safety system. Controller execution requires a seated operator, an explicit invite, a restricted host, and a separate operational safety review.

---

## 6. Connector capability matrix

| Connector | Identity proof | Safe read | Safe write | Secret boundary | Rollback |
|---|---|---:|---:|---|---|
| GitHub | Unity ID + GitHub OAuth/app | workflows, runs, files | branch-scoped commit/action | GitHub secret store | revert commit / re-enable workflow |
| Google Drive | Unity ID + OAuth scope | metadata, content when granted | move/archive only by grant | Google OAuth vault | move back to parent |
| Cloudflare | Unity ID + scoped API token/service binding | Pages/Workers status | named project deployment only | Cloudflare secret store | prior deployment / manual rollback |
| Pinata/IPFS | Unity ID + connector token | gateway/pin status | named CID/file pin only | connector secret store | unpin only with separate approval |
| Browser | passkey/session | public or user-approved page | only explicit browser action | browser session, never copied | browser-native undo where available |
| RTE host | device-bound Unity ID | local status/manifest | local reversible write | OS vault/device key | local snapshot |

A connector is **verified** only when its identity, target, scope, permitted operation, evidence, and rollback path are present. “Configured” alone is not verified.

---

## 7. Command classes

### Class 0 — inspect

Read public or explicitly granted state. No write. Examples: health, inventory, manifest read, workflow list, connector scope display.

### Class 1 — prepare

Create a prompt, plan, hash, or dry-run. No external change. Examples: compile draft, create archive plan, produce deployment manifest.

### Class 2 — reversible write

Move/archive, create a branch, create a receipt, or update a local draft. Requires Unity ID and receipt. Prefer this class.

### Class 3 — privileged write

Deploy, change access, disable workflows, publish, delete, rotate, or alter production. Requires Father/kernel policy, exact target, 2-of-3 authenticated quorum, nonce, expiry, and rollback.

### Class 4 — prohibited by default

Credential extraction, password collection, arbitrary remote shell, silent persistence, raw personal-document storage, bypassing a connector, or unbounded “do everything” execution.

---

## 8. Deep-search implementation loop

For every substantial task:

1. **Discover:** inspect live route, repository, current branch, deployed revision, configuration, and relevant primary documents.
2. **Normalize:** identify canonical object, duplicate/superseded sources, exact target, and base revision.
3. **Claim:** write the requested outcome in a structured envelope.
4. **Fetch:** independently verify source evidence, environment identity, connector scope, and dependencies.
5. **Plan:** list files, APIs, commands, tests, risks, and rollback.
6. **Dry-run:** calculate changes without external writes.
7. **Vote:** bind authenticated votes to the same request hash.
8. **Implement:** make the smallest reversible change.
9. **Test:** run unit, integration, negative, security, and live-surface checks.
10. **Compare:** record before/after hashes and changed resources.
11. **Receipt:** emit PASS, FAIL, HOLE, WAIT_GRANT, or VETO.
12. **Review:** do not claim success if the final live surface was not independently checked.

---

## 9. Install/bootstrap plan

### Phase 0 — inventory only

- Confirm target computer identity.
- Confirm OS, runtime versions, disk, network policy, and clock.
- Confirm repository revision and deployment revision.
- Enumerate connectors without reading secret values.
- Confirm no persistent machine is being confused with the Sandbox.

### Phase 1 — local safe runtime

- Install pinned Node/Python dependencies in an isolated environment.
- Install runtime files only after checksum verification.
- Add manifest validation and receipt verification.
- Add dry-run mode and fixture tests.
- Do not install persistence, startup services, or remote agents.

### Phase 2 — identity foundation

- Deploy Unity ID issuer in an isolated environment.
- Add WebAuthn registration and assertion.
- Add OAuth PKCE connector flow.
- Add capability grants, expiry, nonce, audience, and revocation.
- Add redacted audit events.

### Phase 3 — API v2 jacket

- Implement `/api/v2/health` first.
- Implement `/api/v2/tasks/prepare` and `/dry-run`.
- Add `/receipts` verification.
- Add `/chat` only behind authenticated, rate-limited, BYOK-safe policy.
- Keep `/api/iris` compatibility explicit and documented.

### Phase 4 — connector adapters

- GitHub read-only audit.
- Drive reversible archive/move.
- Cloudflare read-only status.
- Pinata status/read and named-pin dry-run.
- Only then consider scoped writes under quorum.

### Phase 5 — production gate

- Independent security review.
- Negative-test suite passes.
- Recovery drill passes.
- Secret exposure scan passes.
- Connector matrix is complete.
- Father/kernel receipt and quorum are real, not UI labels.

---

## 10. Minimum negative tests

- Google password submitted to any endpoint: reject and do not log.
- Unknown Unity ID: reject.
- Unregistered issuer: reject.
- Expired/revoked capability: reject.
- Wrong audience or workspace: reject.
- Replayed nonce: reject.
- Changed base revision: reject prior votes.
- One-of-three approval: remain WAIT_GRANT.
- Missing evidence: HOLE.
- Public client attempts privileged write: reject.
- API v2 route unavailable: return explicit NOT_READY, never fake success.
- Pinata API success but gateway retrieval fails: remain HOLE.
- Local receipt presented as blockchain settlement: reject claim.
- RTE host without invite: refuse bind.
- Connector token absent: fail without asking for a password in chat.
- Secret-like value in logs: redact and raise audit event.
- Non-deterministic second run: fail reproducibility check.
- Rollback target missing: do not execute privileged write.

---

## 11. Father write docket format

```json
{
  "status": "PENDING",
  "proposal": "exact bounded operation",
  "request_hash": "sha256",
  "target_computer": "verified-online-computer-id",
  "target_resource": "exact-resource",
  "base_revision": "sha-or-version",
  "claim_evidence": [],
  "fetch_evidence": [],
  "connector_scope": [],
  "risk": "low|medium|high",
  "rollback": {},
  "votes": [],
  "father_decision": "WAIT_GRANT",
  "execution_receipt": null
}
```

The Father layer should execute only when every required field is populated, votes are authenticated and bound to the same request hash, and the operation is within policy. Otherwise it returns a structured HOLE or WAIT_GRANT.

---

## 12. What can be bootstrapped now

Safe now:

- publish this design document;
- add schemas and fixture tests;
- add read-only connector inventory;
- add API v2 health and dry-run contracts in an isolated environment;
- improve builder receipts and target indicators;
- run local RTE doctor/manifest validation;
- document the exact live gap between `/api/iris` and `/api/v2/chat`.

Not safe or not currently possible:

- storing a Google passphrase;
- claiming Unity ID has superseded Google before an issuer exists;
- installing arbitrary software into a public static website;
- silently binding a persistent online computer;
- enabling universal remote access;
- deploying a privileged backend without a real auth and secret boundary;
- treating symbolic Trinity labels as authenticated votes;
- allowing the computer to store “anything it wants.”

## 13. Bootstrap acceptance criteria

The project may call Unity ID operational only when:

- an issuer exists and is independently reachable;
- WebAuthn/passkey login works;
- Google OAuth PKCE works without password collection;
- capabilities are narrow, expiring, and revocable;
- the Dark Ledger is server-side and secret-redacted;
- API v2 health and receipt endpoints are live;
- RTE bind and unbind are tested;
- connector scopes are evidenced;
- the public builder cannot authorize writes;
- negative tests pass;
- rollback has been demonstrated;
- the online computer identity is verified separately from the Sandbox.

Until then, status is **DESIGN / BOOTSTRAP GAP**, not LIVE universal identity.
