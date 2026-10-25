# Redirect configuration — dualiscapax.ai to the canonical apex

Status: staged configuration. Not applied. Application is an account-side
action in Cloudflare and is recorded in the unification change-set note as a
founder-hand item.

Decision implemented: `dualiscapax.com` is the canonical apex.
`dualiscapax.ai` chains to it with a permanent redirect. Serving stays on
Cloudflare Pages; this repository is the single source.

## Why a zone Redirect Rule

Cloudflare Pages `_redirects` rules match URL paths on a single host; they
cannot match on the request hostname. A cross-host chain therefore belongs
in a Cloudflare Redirect Rule on the `dualiscapax.ai` zone. The rule below
is expressed in the dashboard's field form and, equivalently, as an API
payload for later application.

## Rule 1 — .ai apex and www to canonical .com

Dashboard form (zone: `dualiscapax.ai`, Redirect Rules):

- Rule name: `ai-to-com-canonical`
- If incoming requests match (custom filter expression):
  `(http.host eq "dualiscapax.ai") or (http.host eq "www.dualiscapax.ai")`
- Then — Type: Dynamic
- Then — URL expression: `concat("https://dualiscapax.com", http.request.uri.path)`
- Then — Status code: `301`
- Preserve query string: enabled

Equivalent API payload (ruleset phase `http_request_dynamic_redirect`,
zone `dualiscapax.ai`):

```json
{
  "name": "ai-to-com-canonical",
  "expression": "(http.host eq \"dualiscapax.ai\") or (http.host eq \"www.dualiscapax.ai\")",
  "action": "redirect",
  "action_parameters": {
    "from_value": {
      "status_code": 301,
      "target_url": {
        "expression": "concat(\"https://dualiscapax.com\", http.request.uri.path)"
      },
      "preserve_query_string": true
    }
  },
  "enabled": true
}
```

## Rule 2 — www on the canonical zone to the apex

Dashboard form (zone: `dualiscapax.com`, Redirect Rules):

- Rule name: `www-to-apex`
- If incoming requests match: `(http.host eq "www.dualiscapax.com")`
- Then — Type: Dynamic
- Then — URL expression: `concat("https://dualiscapax.com", http.request.uri.path)`
- Then — Status code: `301`
- Preserve query string: enabled

## Application order and prerequisites

1. Attach `dualiscapax.com` (and `www.dualiscapax.com`) as custom domains
   to the production Pages project, and confirm the project serves the
   current payload at the canonical apex.
2. Confirm the production Pages project name in the dashboard before any
   deploy: this repository records it as `dualiscapax-landing`
   (`wrangler.toml`, deploy workflows) while earlier dashboard references
   name it `dualiscapax-web`. Reconcile the two before applying step 3.
3. Apply Rule 1 on the `dualiscapax.ai` zone. A Redirect Rule only fires
   for proxied traffic: if the `.ai` custom domain is detached from the
   Pages project, the `.ai` apex needs a proxied placeholder record
   (for example AAAA `100::`) so requests reach the rule.
4. Apply Rule 2 on the `dualiscapax.com` zone under the same condition
   for `www.dualiscapax.com`.
5. Verify after application:

```sh
curl -sI https://dualiscapax.ai/ | head -5
# Expected: HTTP 301, location: https://dualiscapax.com/

curl -sI https://dualiscapax.ai/ledger | grep -i '^location:'
# Expected: location: https://dualiscapax.com/ledger

curl -sI https://www.dualiscapax.com/ | head -5
# Expected: HTTP 301, location: https://dualiscapax.com/

curl -s https://dualiscapax.com/ -o /dev/null -w '%{http_code}\n'
# Expected: 200
```

## Not covered here

- Functional origins that reference `dualiscapax.ai` in application code
  (member and handshake flows, `.well-known/security.txt`) are unchanged
  by this change-set. Browser page loads follow the redirect; any
  non-browser caller using `.ai` as an API origin requires a separate
  audit before the rule is applied.
- No DNS record values are asserted here. Current zone state is
  account-side and was not visible during preparation.
