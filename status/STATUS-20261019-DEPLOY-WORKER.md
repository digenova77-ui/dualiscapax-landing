# Status update — deploy worker, website replacement (2026-10-19, 22:25 EDT)

**Outcome: HOLD at the on-box install step. Everything repo-side is repaired,
verified, and fired; the one missing piece is a one-time install on the
server that has never been run.**

## Diagnosis (from the failed run's own log)

Run 38425309591 / job 118415170638 (deploy-worker, mode=deploy) failed in the
Deploy step in 1s. Decisive log lines:

```
DEPLOY_RESULT: REFUSED — receiver /usr/local/sbin/dualis-deploy is not present/executable on the box.
Install it first: bootstrap mode (needs a general key), or the one-paste installer in install/install-on-box.sh.
Deploy NEVER falls back to copying files into place ad hoc.
##[error]Process completed with exit code 1.
```

Root-cause chain, each link evidenced:

1. The on-box receiver was never installed and the worker key was never
   authorized on the server. The repository README's key registry records
   this state, and the Oct 13 probe runs (38342065789, 38342099662) proved
   both general candidate keys are refused by the server (NO_AUTH) while
   proving the runner can reach it.
2. The pipeline cannot bootstrap itself: the candidate key secrets were
   removed after the probes. The repository now holds exactly one Actions
   secret, SSH_KEY_DEPLOY (verified by API listing, names only). A probe
   dispatched tonight (run 39358272334) failed at key selection:
   "KEY_SELECTION: the secret for this mode/key is empty or missing".
3. The receiver also pins the bundle by index checksum
   (EXPECTED_INDEX_MD5 eb57611c15b2d3b06ecd4fa1cf3e6352, the previous
   webroot index). The replacement package index (md5
   287f92b124375a6d9731bfd350e48d42, sha256
   6c56ad77e284ad852d0ba0961d0813469e904ded6f5f0428b9feea3655fac43f) would
   have been refused by that pin even with the receiver installed.

## Repair (branch replacement-20261019, commit 77e61c54c5179f716b473d741d5d3d487aeaf89d)

- webroot/ now carries the replacement package exactly: the 63 previous
  webroot files removed, the 27 package files placed at their
  package-relative paths. Read back from the branch: webroot/index.html
  sha256 matches the package index exactly; the narration audio is
  byte-identical.
- receiver/dualis-deploy.sh: EXPECTED_INDEX_MD5 re-pinned to the
  replacement index (287f92b124375a6d9731bfd350e48d42). New receiver
  sha256 c074ce36b65d1a963018837f6fe2b80a6a5a5ef68ebd808b249e1c16d5cb92f1.
- install/install-on-box.sh regenerated: embedded receiver replaced and
  its recorded sha256 updated; extraction round-trip verified.
- MANIFEST.md consolidated for the replacement bundle (27 webroot rows;
  the 6 deploy/sovereign rows carried over, bytes verified against the
  repository; deploy/passkey documentation rows unchanged). The 63
  superseded webroot rows were appended to MANIFEST-HISTORY.md.
- README.md index-pin reference updated.
- Bundle verification, simulating the receiver's own checks against the
  branch's exact bytes: 33 manifest rows checked, zero mismatches; the
  index checksum gate passes.

## Fired

Deploy dispatched from the branch — run 39358307542: checkout and key
selection passed (worker key fingerprint
SHA256:SxI4Ut9NX1VT/DHBYbPRqupCVFO3bb+QtMr/Bja0eHQ), Deploy step refused
with the same DEPLOY_RESULT: REFUSED line quoted above. The pipeline is
fail-closed and changed nothing on the server.

## The remaining piece (exact)

One on-box act, in a console session on the New Jersey server
(108.61.17.141): run the branch's install/install-on-box.sh once. It
installs the receiver (with the re-pinned index checksum) and authorizes
the worker key as a forced command that can only run the receiver. The
file is self-contained. After that single act, a deploy dispatch from
branch replacement-20261019 lands the replacement bundle end-to-end.

## Verification of the public face

https://dualiscapax.com/ fetched cold after the runs: still serving the
previous face ("Dawn of the Bot Swarms"). No bytes changed anywhere live.

## Named remainder beyond this pipeline

Even a successful receiver pass installs the tree at
/var/www/dualiscapax-com and stages (does not enable) the sovereign nginx
site; the apex is served through the Canonical Door lane. The .ai
redirect and the API v2 jacket verification belong to that lane's
runbook and were not attempted from this seat.
