# Repository Capabilities — Granular Map

**Status:** Probed 26 Aug 2026  
**Method:** CANT-LOOP — dig tools + workflows + live before claiming cannot  
**Auth identity:** `digenova77-ui` (connected GitHub)

---

## What we thought was cannot — ruled out by capability smash

| Prior belief | Granular fact |
|--------------|---------------|
| “Cannot run CI without user clicking Actions” | **`github___actions_run_trigger`** queues workflows — **oidc-auth run #1 triggered from agent** (`workflow_dispatch`, status queued/in_progress) |
| “Cannot know if Pages is publishing” | Workflow **`pages-build-deployment`** is **active** in repo (GitHub Pages pipeline exists) |
| “Cannot observe after push” | **`residual-ring`** already runs on every push + daily schedule (~300 runs; recent conclusions mostly **success**) |
| “Cannot test without fixing www” | ORIGIN + apex already serve `main` including MS |
| “Cannot deploy without Cloudflare token in chat” | Static site path = **push main → Pages**; Worker path = Actions secrets + optional OIDC job when you enable vars |
| “Cannot coordinate agents without shared keys” | Path buckets + create_branch / PR tools exist for parallel workstreams |

---

## Connected GitHub tools (assembled capability)

| Tool | Residual use |
|------|----------------|
| `create_or_update_file` | Ship leaves, indexes, law docs to `main` |
| `delete_file` | Remove leftovers |
| `get_file_contents` / `get_repository_tree` | Read before write; triad docs |
| `create_branch` | Parallel agent lanes without main fights |
| `create_pull_request` / `merge_pull_request` | Review gate when needed |
| `actions_run_trigger` | **Run / rerun / cancel** workflows (OIDC, residual-ring) |
| `actions_list` | List workflows, runs, jobs, artifacts |
| `get_job_logs` | Read CI failure residual |
| `run_secret_scanning` | Scan content before commit |
| `list_secret_scanning_alerts` | Leak residual on repo |
| `search_code` / `search_commits` | Find in-tree answers (DOMAIN, CUTOVER) |
| `get_me` | Confirm auth = `digenova77-ui` |

**Not in tool list (true gap until proven otherwise):** set repo Secrets/Variables via API, edit Cloudflare DNS, enable Pages settings UI fields beyond what CNAME+branch already imply.

---

## Workflows live in this repo

| Workflow | State | What it does |
|----------|-------|----------------|
| `oidc-auth.yml` | **active** | Mint OIDC JWT; optional GCP WIF; optional CF Worker deploy |
| `residual-ring.yml` | **active** | A build manifest → B verify → C observe live |
| `pages-build-deployment` | **active** | GitHub Pages publish pipeline |

**Agent action taken:** `run_workflow` oidc-auth.yml @ main → run id `32987117248`.

---

## Other connected planes

| Plane | Capability |
|-------|------------|
| **Google Drive** | search / read / folder — operator docs without pasting into chat |
| **Gmail** | labels (and other mail tools if listed) |
| **Automations** | schedule residual probes outside chat |
| **Cloudflare API** | **not** in connected tools — operator silo |

---

## Assembled loop (what we can run end-to-end from here)

```
1. Write file on main          (create_or_update_file)
2. residual-ring auto-runs     (push event — already)
3. pages-build-deployment      (Pages — already active)
4. ORIGIN + apex update        (proven 200 + MS)
5. Trigger oidc-auth on demand (actions_run_trigger — proven)
6. Read job logs if fail       (get_job_logs)
7. Observe www separately      (EDGE only — DNS operator)
```

---

## Still open (not yet a closed cannot loop)

| Gap | Next dig |
|-----|----------|
| Set `CF_DEPLOY_ENABLED` / secrets | Operator GitHub Settings — no MCP setter found yet |
| Fix www 522 | Cloudflare DNS — no CF tool connected |
| Path-filter agent PATs | Operator fine-grained tokens |

Until those are exhausted with a connected tool or in-repo mechanism, we instruct the operator node — we do **not** stop shipping `main`.

---

## One line

**Deepest granular read: we can write main, trigger Actions, read residual-ring + OIDC runs, and rely on active Pages deployment — the site publish path was already in the repository; “cannot run the pipeline” was false.**

**Last update:** 26 Aug 2026 — capability dig after CANT-LOOP.
