# The Ubuntu / Unix Filesystem Command Bible

## Dual Pipeline Edition

**Purpose:** a practical, safe, deep reference for operating an Ubuntu machine that participates in the Dual Pipeline.

**Pipeline A — Claim:** what the operator says should be true.  
**Pipeline B — Fetch / Execute / Evidence:** what the machine can independently inspect, perform, measure, and receipt.

> A command is not truth merely because it ran. A command becomes evidence only when the target, identity, input, output, exit status, time, and base revision are recorded.

---

## 0. Safety floor

Before any command that writes, moves, deletes, publishes, installs, or changes access:

```bash
id
whoami
hostnamectl
pwd
printf 'target=%s\n' "$PWD"
git status --short 2>/dev/null || true
date -u +%Y-%m-%dT%H:%M:%SZ
```

Use these rules:

1. Prefer read-only inspection first.
2. Use absolute paths for important operations.
3. Quote paths: `"$path"`.
4. Never run `rm -rf` on an unreviewed variable.
5. Never paste passwords, API keys, private keys, or tokens into commands.
6. Prefer a secret manager, OAuth, passkey, or environment injection from a protected service.
7. Use `--dry-run` when available.
8. Record a before hash and an after hash for material changes.
9. Stop on missing identity, unclear target, or ambiguous scope.
10. A missing value is `HOLE`, not zero and not success.

Safe shell preamble:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'
trap 'printf "ERROR line=%s status=%s\n" "$LINENO" "$?" >&2' ERR
```

---

## 1. The Unix mental model

Everything is a path, a process, a descriptor, or a permission boundary.

- `/` — filesystem root.
- `/home` — user homes.
- `/home/ubuntu` — the Ubuntu user’s home.
- `/etc` — system configuration.
- `/var` — changing state, logs, caches, queues.
- `/tmp` — temporary files; never treat as durable.
- `/run` — runtime state; often cleared at boot.
- `/usr/bin`, `/usr/local/bin` — executable programs.
- `/opt` — optional applications.
- `/srv` — service data.
- `/mnt`, `/media` — mounted devices.
- `/proc` — kernel process view.
- `/sys` — kernel/device view.
- `/dev` — device nodes.

A path is not a file until verified:

```bash
path=/absolute/path/to/object
if [[ -e "$path" ]]; then
  file -- "$path"
  stat -- "$path"
else
  echo "HOLE: missing path: $path" >&2
  exit 2
fi
```

---

## 2. Navigation and path inspection

```bash
pwd
cd /path/to/project
cd -- "$HOME"
cd -
ls -la
ls -lah --time-style=long-iso
findmnt
mount | column -t
realpath -- "$path"
readlink -f -- "$path"
```

Useful identity checks:

```bash
printf 'user=%s uid=%s gid=%s\n' "$(id -un)" "$(id -u)" "$(id -g)"
id -a
getent passwd "$(id -un)"
umask
```

Do not trust a prompt’s displayed directory. Use `pwd -P` when symlinks matter.

---

## 3. Creating and changing files

```bash
mkdir -p -- /absolute/project/{src,tests,receipts}
touch -- /absolute/project/notes.md
printf '%s\n' 'content' > /absolute/project/notes.md
printf '%s\n' 'more' >> /absolute/project/notes.md
cp --preserve=mode,timestamps source.txt destination.txt
cp -a source-dir destination-dir
mv -- source.txt destination.txt
install -D -m 0644 source.txt /absolute/project/data/source.txt
```

Atomic write pattern:

```bash
tmp=$(mktemp "${TMPDIR:-/tmp}/receipt.XXXXXX")
trap 'rm -f -- "$tmp"' EXIT
printf '%s\n' "$json" > "$tmp"
python3 -m json.tool "$tmp" >/dev/null
mv -- "$tmp" /absolute/project/receipt.json
trap - EXIT
```

Never edit a critical file in place if a partial write would be harmful.

---

## 4. Listing, searching, and classifying

```bash
find . -maxdepth 2 -type f -print
find . -type f -size +10M -print
find . -type f -mtime -1 -print
find . -type f -name '*.json' -print
find . -type f -perm /111 -print
find . -type f -empty -print
find . -type l -ls
```

Content search:

```bash
rg -n --hidden --glob '!.git' 'pattern' .
grep -RIn --exclude-dir=.git 'pattern' .
awk 'length($0) > 120 { print FNR ":" $0 }' file.txt
```

File classification:

```bash
file --brief --mime-type -- file
stat --printf='path=%n\nsize=%s\nmode=%A\nuid=%u\ngid=%g\nmtime=%y\n' -- file
sha256sum -- file
cksum -- file
```

Duplicate names are not proof of duplicate bytes. Compare hashes:

```bash
sha256sum -- file-a file-b
cmp --silent file-a file-b && echo IDENTICAL || echo DIFFERENT
```

---

## 5. Permissions and ownership

Mode bits:

```bash
ls -l file
chmod 0644 file
chmod 0755 script.sh
chmod u+x script.sh
chmod -R u=rwX,go=rX directory
chown user:group file
chgrp group file
getfacl -- file
setfacl -m u:username:r-- file
```

Interpretation:

- `r` — read.
- `w` — write.
- `x` — execute or traverse a directory.
- `u` — owner.
- `g` — group.
- `o` — others.
- `X` — execute only on directories or already-executable files.

Safe principle: do not use `chmod -R 777`. Never make secrets world-readable.

Find suspicious permissions:

```bash
find /absolute/project -type f -perm -0002 -print
find /absolute/project -type f \( -name '*.pem' -o -name '*credential*' -o -name '.env*' \) -printf '%m %p\n'
```

---

## 6. Processes and jobs

```bash
ps auxww
ps -ef --forest
top
pgrep -a -f 'python|node|vite|server'
pgrep -af process-name
pstree -ap
jobs -l
```

Signals:

```bash
kill -TERM PID
sleep 2
kill -KILL PID  # last resort only
pkill -TERM -f 'exact-pattern'
```

Never use a broad `pkill -f` pattern until the process list has been printed and reviewed.

Process evidence:

```bash
pid=1234
readlink -f "/proc/$pid/exe"
tr '\0' ' ' < "/proc/$pid/cmdline"; echo
cat "/proc/$pid/status"
ls -l "/proc/$pid/fd"
```

---

## 7. Services and persistence

```bash
systemctl status service-name --no-pager
systemctl is-enabled service-name
systemctl list-units --type=service --state=running
journalctl -u service-name --since '1 hour ago' --no-pager
```

Do not create a persistent service merely because a task is convenient. For an approved service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now service-name
sudo systemctl restart service-name
sudo systemctl disable --now service-name
```

Check timers and scheduled work:

```bash
systemctl list-timers --all
crontab -l
sudo crontab -l
atq
```

Persistence requires explicit owner, purpose, identity, logs, resource limits, update path, and rollback.

---

## 8. Networking and HTTP evidence

```bash
ip addr
ip route
resolvectl status
ss -ltnp
ss -lupn
curl -I --fail-with-body https://example.com/
curl -sS -D /tmp/headers.txt -o /tmp/body.txt https://example.com/
curl -sS --max-time 20 -w '\nHTTP=%{http_code} SIZE=%{size_download} TIME=%{time_total}\n' -o /tmp/body https://example.com/
```

Local service verification:

```bash
curl --fail http://127.0.0.1:4173/health
curl --fail http://127.0.0.1:4173/builder/
```

Never treat DNS resolution, TCP connection, HTTP 200, application success, and correct content as the same fact. Record them separately.

---

## 9. Packages and environments

APT inspection:

```bash
apt-cache policy package-name
apt list --installed 2>/dev/null | less
dpkg -l
```

Install only from approved sources:

```bash
sudo apt-get update
sudo apt-get install --no-install-recommends package-name
```

Python isolation:

```bash
python3 --version
python3 -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip freeze > requirements.lock.txt
```

Node isolation:

```bash
node --version
npm --version
corepack enable
npm ci
npm audit --omit=dev
```

Do not install arbitrary packages into a public website. Install in a pinned build environment, record the lockfile, and verify hashes.

---

## 10. Git and repository hygiene

```bash
git status --short
git branch --show-current
git log --oneline --decorate -10
git diff --check
git diff --stat
git diff -- path/to/file
git show --stat --oneline HEAD
git rev-parse HEAD
```

Safe branch workflow:

```bash
git fetch origin
git switch -c change/name origin/main
# edit and test
git diff --check
git add -- path/to/file
git commit -m 'scope: explain the bounded change'
git push -u origin HEAD
```

Recovery:

```bash
git reflog --date=iso
 git restore --source=HEAD -- path/to/file
 git stash push -m 'named temporary state'
```

Never rewrite remote history to hide a failed operation. Preserve receipts and revert safely.

---

## 11. JSON, YAML, logs, and receipts

```bash
python3 -m json.tool receipt.json
jq '.' receipt.json
jq -e '.status == "PASS"' receipt.json
jq -r '.request_hash, .status, .created_at' receipt.json
sed -n '1,200p' log.txt
tail -n 100 log.txt
tail -f log.txt
```

Receipt minimum:

```json
{
  "request_hash": "sha256",
  "target": "verified-target",
  "actor": "verified-identity",
  "base_revision": "git-sha-or-manifest-sha",
  "command_class": "inspect|prepare|reversible-write|privileged-write",
  "status": "PASS|FAIL|HOLE|WAIT_GRANT|VETO",
  "exit_code": 0,
  "before_hash": null,
  "after_hash": null,
  "evidence": [],
  "rollback": null,
  "created_at": "RFC3339"
}
```

---

## 12. Archives and deletion

Archive before delete:

```bash
archive=/absolute/archive/$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p -- "$archive"
cp -a -- source "$archive/"
sha256sum -- source "$archive/source"
```

Review candidates:

```bash
find /absolute/project -type f -print0 | sort -z | xargs -0 sha256sum > before.sha256
```

Never infer that two files are duplicates from names alone. Use same scope, same type, same parent, same or verified content, and a retained newest reference.

---

## 13. Dual Pipeline command pattern

### Pipeline A — Claim

```bash
cat > claim.json <<'JSON'
{
  "verb": "inspect",
  "object": "builder",
  "kind": "web-surface",
  "target": "https://dualiscapax.ai/builder/",
  "expected": "builder exposes deterministic manifest validation and no public secret",
  "base_revision": "record-before-run"
}
JSON
sha256sum claim.json
```

### Pipeline B — Fetch / evidence

```bash
set -Eeuo pipefail
url='https://dualiscapax.ai/builder/'
status=$(curl -sS -L -o /tmp/builder.html -w '%{http_code}' "$url")
printf '{"url":"%s","http":%s,"bytes":%s}\n' "$url" "$status" "$(wc -c </tmp/builder.html)"
rg -n 'password|private.?key|secret|manifest|receipt|kernel|WRITE AUTHORITY' /tmp/builder.html || true
sha256sum /tmp/builder.html
```

### Collapse

```bash
if [[ "$status" == 200 ]] && ! rg -qi 'private key|password input' /tmp/builder.html; then
  echo 'PASS: surface checks passed; inspect deeper before any write'
else
  echo 'HOLE or FAIL: do not authorize'
fi
```

---

## 14. Filesystem doctor

A reusable read-only doctor:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
root=${1:-.}
root=$(realpath -- "$root")
{
  echo "doctor_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "root=$root"
  echo "user=$(id -un)"
  echo "host=$(hostname)"
  echo "kernel=$(uname -srmo)"
  echo "disk=$(df -P "$root" | tail -1)"
  echo "git=$(git -C "$root" rev-parse HEAD 2>/dev/null || echo none)"
  find "$root" -maxdepth 2 -type f -printf '%m %s %p\n' | sort | head -200
} | tee "doctor-$(date -u +%Y%m%dT%H%M%SZ).txt"
```

This is evidence collection, not a security certification.

---

## 15. What not to do

```bash
# Do not do these blindly:
rm -rf "$variable"
sudo chmod -R 777 /
curl URL | sh
wget -O- URL | bash
ssh root@host
find / -delete
kill -9 -1
```

Replace them with staged inspection, pinned artifacts, explicit paths, least privilege, and receipts.

---

## 16. Closing law

- The shell is powerful, not wise.
- The filesystem is state, not proof.
- A command can be syntactically valid and operationally wrong.
- The Dual Pipeline is complete only when Claim, Fetch, Collapse, change, test, rollback, and receipt all agree.
- Fast output without identity and evidence is noise.
- A secure machine is not one that can do everything; it is one that can prove what it did and refuse what it cannot justify.
