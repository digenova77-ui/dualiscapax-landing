# FATHER-DRAW-ORDER.md

**Status:** RAIL A — unsealed. Father draws.
**Date:** 2026-09-30

## The five items, in order

Each step needs the previous one's output. Skip one and the next has nothing to stand on.

```text
1  TOKEN     replace CLOUDFLARE_API_TOKEN in GitHub secrets
            Account · Cloudflare Pages · Edit
            verify: workflow no longer fails error 10000

2  DEPLOY    run pages-direct-upload with confirm DEPLOY
            zero-nest zip of cf-pages/ (index.html + iris.html + 404.html)
            verify: curl / = 200 Base 3D, curl /no-such-door = 404

3  PIN       run pinata-pin with full true
            same tree, both Pinata and Filebase
            verify: CIDs match, receipt posted

4  DNSLINK   write _dnslink.dualiscapax.ai TXT
            dnslink=/ipfs/<CID>   or  /ipns/<name>
            verify: dig +short TXT _dnslink.dualiscapax.ai

5  IPNS      publish IPNS record, keep the key
            the key is the kill switch — Father only
            verify: ipfs resolve /ipns/dualiscapax.ai
```

## Rollback rule

If any step fails, roll back to the last verified state.
Do not add a catchall to hide a failure.
Do not skip a step to reach the next.

## IPFS cutover

After step 5, the site is mirrored: Pages serves `/`, IPFS serves the same bytes by CID.
The IPNS key stays with Father. No desk holds it.

## What desks can do

Mark, collapse, hash, verify. They cannot sit credentials.
The Father draws.

```text
Look   =  order named
Use    =  Father.draw
Stake  =  off
street =  unchanged
```
