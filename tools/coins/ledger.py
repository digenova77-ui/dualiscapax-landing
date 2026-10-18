#!/usr/bin/env python3
"""DualisCapax three-coin ledger: e-fuse, UniFi3, Merit. Python stdlib only, integer minor units, no floats.

Reference state machine for /tools/coins/UNIFY.md. Every op is validated in full BEFORE any state
changes (all-or-nothing), then a hash-chained receipt is appended. Builds on tools/tokenomics.py
(split_purchase, split_derivative) instead of re-implementing the splits.

Pure accounting: nothing here moves money, touches a chain, production, DNS or secrets.
"""
import hashlib, hmac, json, os, sys
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tokenomics import split_purchase, split_derivative, PAYMENT_RAILS  # noqa: E402

GENESIS = "0" * 64
COINS = ("eFuse", "UniFi\u00b3", "Merit")   # names as in unity-playground meter/coins.ts + unity/fuse.ts
FLOOR_LAW = ("NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING")  # unity-playground law/floor.ts (R5)


def pilot_handle(id_hash):
    """unity-playground unity/unityid.ts handle shape: unity:pilot. + first 32 hex of SHA-256(SPKI) (R3)."""
    return "unity:pilot." + id_hash[:32]
NONCE_TTL = 60                      # seconds, matches law_v8 unity_handoff
MAX_SKEW = 5                        # seconds of tolerated future clock skew
MAX_AMOUNT = 10 ** 15               # minor units per op (10 trillion dollars in cents); overflow guard
MERIT_CAP = 100_000_000 * 100       # David's 100M-coin Merit supply, in minor units (open decision)
MERIT_HALF = MERIT_CAP // 2         # 50/50 humans vs bots
KINDS = ("human", "bot")
SEED_MODES = ("escrow", "forest")   # 1% father seed: escrow until canon amendment, or route to forest
HEALTH_MIN_BPS = 10_000             # forest must be >= reserve target to tap
TAP_MEMBER_CAP = 10_000             # per member per season, minor units (placeholder, open decision)
TAP_SEASON_BPS = 1_000
BOT_USDC_CAP = 10 ** 9              # aggregate USDC (minor units) all bot IDs may hold together (open decision)              # at most 10% of the season's surplus over reserve can be tapped


def canon(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()


def h(b):
    return hashlib.sha256(b).hexdigest()


class Rejected(Exception):
    """Op refused. State is untouched."""


def _amt(x, name="amount", allow_zero=False):
    if isinstance(x, bool) or not isinstance(x, int):
        raise Rejected(f"{name} must be int minor units")
    if x < 0 or (x == 0 and not allow_zero) or x > MAX_AMOUNT:
        raise Rejected(f"{name} out of range")
    return x


def _hex64(x, name):
    if not isinstance(x, str) or len(x) != 64 or any(c not in "0123456789abcdef" for c in x):
        raise Rejected(f"{name} must be 64 lowercase hex")
    return x


def sign(secret_hex, op):
    """Stand-in for a passkey/WebAuthn signature (stdlib has no ECDSA). See UNIFY.md gap list."""
    body = {k: v for k, v in op.items() if k not in ("sig", "att", "bot_sig")}
    return hmac.new(bytes.fromhex(secret_hex), canon(body), hashlib.sha256).hexdigest()


class Ledger:
    def __init__(self, attestor_secret, seed_mode="escrow", reserve_target=0):
        if seed_mode not in SEED_MODES:
            raise ValueError("seed_mode")
        self.s = {
            "attestor": h(bytes.fromhex(attestor_secret)), "seed_mode": seed_mode,
            "ids": {},            # id_hash -> {kind, key, person}
            "persons": {},        # person_hash -> id_hash (one human per person: sybil guard)
            "unifi": {},          # id_hash -> 1 (UniFi3: one per fused identity, soulbound)
            "merit": {},          # id_hash -> minor units (earned, non-transferable)
            "merit_supply": {"human": 0, "bot": 0},
            "merit_pool": {"human": 0, "bot": 0},   # forfeited cross-side transfers, back to the network
            "efuse": {"balance": 0, "deposited": 0, "world_cost_paid": 0, "expansion": 0},
            "purchases_in": 0, "payments": {},      # payment_ref -> 1 (no double credit)
            "deriv": {"in": 0, "forest": 0, "harvest_paid": 0, "seed_escrow": 0, "tapped": 0, "seed_carry": 0},
            "harvest": {},        # id_hash -> minor units
            "season": {"open": False, "id": 0, "budget": 0, "used": 0, "taps": {}},
            "reserve_target": reserve_target,
            "usdc": {},           # id_hash -> external USDC wallet balance (modelled; no chain calls)
            "usdc_flow": {"burned_merit": 0, "out": 0},
            "controller": {},     # bot id_hash -> human id_hash (humans may control bots; never the reverse)
            "nonces": {},         # nonce -> expires_at (single-use)
            "seq": 0, "head": GENESIS,
        }
        self._attestor_secret = attestor_secret
        self.receipts = []

    # ---------- public ----------
    def state_hash(self):
        return h(canon(self.s))

    def apply(self, op, now):
        """Validate fully, then mutate, then append receipt. Raises Rejected with state unchanged."""
        if not isinstance(op, dict) or not isinstance(op.get("type"), str):
            raise Rejected("malformed op")
        if isinstance(now, bool) or not isinstance(now, int):
            raise Rejected("bad clock")
        fn = getattr(self, "_op_" + op["type"], None)
        if fn is None:
            raise Rejected(f"unknown op {op['type']!r}")
        self._check_nonce(op, now)
        effects = fn(op, now, dry=True)     # validation only
        fn(op, now, dry=False)              # mutation (cannot fail after dry run)
        self.s["nonces"][op["nonce"]] = op["expires_at"]
        self._gc_nonces(now)
        self.s["seq"] += 1
        rec = {"seq": self.s["seq"], "prev": self.s["head"], "at": now, "op": op, "effects": effects}
        self.s["head"] = h(canon(rec))
        rec["hash"] = self.s["head"]
        self.receipts.append(rec)
        return rec

    def check_invariants(self):
        s, e, d = self.s, self.s["efuse"], self.s["deriv"]
        merit_total = sum(s["merit"].values()) + sum(s["merit_pool"].values())
        uf = s["usdc_flow"]
        assert s["purchases_in"] == e["deposited"] + merit_total + uf["burned_merit"], "purchase conservation"
        assert uf["burned_merit"] == sum(s["usdc"].values()) + uf["out"], "usdc conservation"
        assert self._bot_usdc() <= BOT_USDC_CAP, "bot usdc cap"
        assert all(v >= 0 for v in s["usdc"].values()), "negative usdc"
        for k in KINDS:
            side = sum(v for i, v in s["merit"].items() if s["ids"][i]["kind"] == k) + s["merit_pool"][k]
            assert side == s["merit_supply"][k], "merit side supply (no cross-side leak)"
        assert e["deposited"] == e["balance"] + e["world_cost_paid"] + e["expansion"], "e-fuse conservation"
        assert sum(s["merit_supply"].values()) == merit_total, "merit supply"
        for k in KINDS:
            assert 0 <= s["merit_supply"][k] <= MERIT_HALF, "merit half cap"
        assert d["in"] == d["forest"] + d["harvest_paid"] + d["seed_escrow"] + d["tapped"], "derivative conservation"
        assert d["harvest_paid"] == sum(s["harvest"].values()), "harvest ledger"
        assert all(v >= 0 for v in list(e.values()) + list(d.values()) + list(s["merit"].values())), "negative"
        for bot, own in s["controller"].items():
            assert s["ids"][bot]["kind"] == "bot" and s["ids"][own]["kind"] == "human", "bot may never control a human"
        assert set(s["unifi"]) == set(s["ids"]) and all(v == 1 for v in s["unifi"].values()), "unifi 1:1"
        return True

    @staticmethod
    def verify_chain(receipts):
        prev = GENESIS
        for i, r in enumerate(receipts, 1):
            body = {k: v for k, v in r.items() if k != "hash"}
            if r["seq"] != i or r["prev"] != prev or h(canon(body)) != r["hash"]:
                return False
            prev = r["hash"]
        return True

    def snapshot(self):
        return canon({"s": self.s, "receipts": self.receipts}).decode()

    @classmethod
    def restore(cls, snap, attestor_secret):
        d = json.loads(snap)
        L = cls(attestor_secret)
        L.s, L.receipts = d["s"], d["receipts"]
        if L.s["attestor"] != h(bytes.fromhex(attestor_secret)) or not cls.verify_chain(L.receipts):
            raise Rejected("snapshot fails verification")
        if L.receipts and L.receipts[-1]["hash"] != L.s["head"]:
            raise Rejected("snapshot head mismatch")
        return L

    # ---------- guards ----------
    def _check_nonce(self, op, now):
        n, iss, exp = op.get("nonce"), op.get("issued_at"), op.get("expires_at")
        _hex64(n, "nonce")
        for v in (iss, exp):
            if isinstance(v, bool) or not isinstance(v, int):
                raise Rejected("bad timestamps")
        if n in self.s["nonces"]:
            raise Rejected("replay: nonce already used")
        if exp - iss > NONCE_TTL or exp <= iss:
            raise Rejected("ttl too long")
        if iss > now + MAX_SKEW:
            raise Rejected("issued in the future (clock skew)")
        if now >= exp:
            raise Rejected("expired")

    def _gc_nonces(self, now):
        # Expired nonces can be dropped: an op carrying one is already refused as expired.
        # Keep MAX_SKEW margin so a future-dated reissue cannot reuse it.
        dead = [n for n, exp in self.s["nonces"].items() if exp + MAX_SKEW < now]
        for n in dead:
            del self.s["nonces"][n]

    def _signed_by(self, op, id_hash):
        ident = self.s["ids"].get(id_hash)
        if ident is None:
            raise Rejected("unknown identity")
        if not isinstance(op.get("sig"), str) or not hmac.compare_digest(sign(ident["key"], op), op["sig"]):
            raise Rejected("bad signature")
        return ident

    def _attested(self, op):
        if not isinstance(op.get("att"), str) or not hmac.compare_digest(sign(self._attestor_secret, op), op["att"]):
            raise Rejected("bad attestation")

    # ---------- ops ----------
    def _op_fuse(self, op, now, dry):
        """First registration: passkey fused to identity hash. This IS the e-fuse receipt that
        ignites the Unity (UniFi3) and Merit bridges. Attested (stand-in for law_v8 efuse_fuse)."""
        idh, kind, key, person = op.get("id"), op.get("kind"), op.get("key"), op.get("person")
        _hex64(idh, "id"); _hex64(key, "key")
        if kind not in KINDS:
            raise Rejected("kind")
        self._attested(op)
        if idh in self.s["ids"]:
            raise Rejected("identity already fused")
        if kind == "human":
            _hex64(person, "person")
            if person in self.s["persons"]:
                raise Rejected("sybil: person already has a human identity")
        elif person is not None:
            raise Rejected("bots carry no person hash")
        if not dry:
            self.s["ids"][idh] = {"kind": kind, "key": key, "person": person, "fused_at": now}
            if kind == "human":
                self.s["persons"][person] = idh
            self.s["unifi"][idh] = 1
            self.s["merit"][idh] = 0
        return {"unifi_minted": 1, "id": idh}

    def _op_purchase(self, op, now, dry):
        """Dollars or crypto in: 50/50, e-fuse gets the odd cent, buyer keeps Merit (capped per half)."""
        buyer, ref, rail = op.get("buyer"), op.get("payment_ref"), op.get("rail")
        amt = _amt(op.get("amount"))
        _hex64(ref, "payment_ref")
        if rail not in PAYMENT_RAILS:
            raise Rejected("rail")
        self._attested(op)                       # gateway confirms the money actually settled
        ident = self._signed_by(op, buyer)
        if ref in self.s["payments"]:
            raise Rejected("double-spend: payment already credited")
        sp = split_purchase(amt, rail)
        k = ident["kind"]
        if self.s["merit_supply"][k] + sp.merit > MERIT_HALF:
            raise Rejected(f"merit {k} half exhausted")
        if not dry:
            e = self.s["efuse"]
            e["balance"] += sp.efuse; e["deposited"] += sp.efuse
            self.s["merit"][buyer] += sp.merit
            self.s["merit_supply"][k] += sp.merit
            self.s["purchases_in"] += amt
            self.s["payments"][ref] = 1
        return {"efuse": sp.efuse, "merit": sp.merit}

    def _op_settle(self, op, now, dry):
        """Attested world cost paid from the e-fuse; surplus funds expansion. The only outflow."""
        wc = _amt(op.get("world_cost"), "world_cost", allow_zero=True)
        self._attested(op)
        e = self.s["efuse"]
        paid = min(e["balance"], wc)
        surplus = e["balance"] - paid if paid == wc else 0
        if not dry:
            e["balance"] -= paid + surplus
            e["world_cost_paid"] += paid
            e["expansion"] += surplus
        return {"world_cost_paid": paid, "expansion": surplus}

    def _op_derivative(self, op, now, dry):
        """Derivative value flows 90 forest / 9 harvest (worker) / 1 father seed."""
        amt = _amt(op.get("amount")); worker = op.get("worker"); ref = op.get("source_ref")
        _hex64(ref, "source_ref")
        self._attested(op)
        if worker not in self.s["ids"]:
            raise Rejected("unknown worker")
        if ref in self.s["payments"]:
            raise Rejected("double-spend: source already credited")
        forest_mode = self.s["seed_mode"] == "forest"
        f = split_derivative(amt, 0 if forest_mode else self.s["deriv"]["seed_carry"])
        forest, seed = f.forest, f.seed
        if forest_mode:
            forest, seed = forest + seed, 0
        if not dry:
            d = self.s["deriv"]
            d["in"] += amt; d["forest"] += forest; d["harvest_paid"] += f.harvest; d["seed_escrow"] += seed
            if not forest_mode:
                d["seed_carry"] = f.seed_carry
            self.s["harvest"][worker] = self.s["harvest"].get(worker, 0) + f.harvest
            self.s["payments"][ref] = 1
        return {"forest": forest, "harvest": f.harvest, "seed": seed}

    def _health_bps(self):
        t = self.s["reserve_target"]
        return 10 ** 9 if t == 0 else self.s["deriv"]["forest"] * 10_000 // t

    def _op_season(self, op, now, dry):
        """Attested: open/close tapping season. Budget fixed at open = 10% of surplus over reserve."""
        opn = op.get("open")
        if not isinstance(opn, bool):
            raise Rejected("open must be bool")
        self._attested(op)
        surplus = max(0, self.s["deriv"]["forest"] - self.s["reserve_target"])
        if not dry:
            se = self.s["season"]
            if opn:
                se.update(open=True, id=se["id"] + 1, budget=surplus * TAP_SEASON_BPS // 10_000, used=0, taps={})
            else:
                se["open"] = False
        return {"open": opn}

    def _op_tap(self, op, now, dry):
        """Maple law: only in season, only when healthy, only up to a limit that keeps it healthy."""
        who = op.get("member"); amt = _amt(op.get("amount"))
        self._signed_by(op, who)
        se = self.s["season"]
        if not se["open"]:
            raise Rejected("tap: out of season")
        if self._health_bps() < HEALTH_MIN_BPS:
            raise Rejected("tap: system unhealthy")
        if se["used"] + amt > se["budget"]:
            raise Rejected("tap: season budget exceeded")
        if se["taps"].get(who, 0) + amt > TAP_MEMBER_CAP:
            raise Rejected("tap: member cap exceeded")
        if self.s["deriv"]["forest"] - amt < self.s["reserve_target"]:
            raise Rejected("tap: would breach reserve")
        if not dry:
            d = self.s["deriv"]
            d["forest"] -= amt; d["tapped"] += amt
            se["used"] += amt; se["taps"][who] = se["taps"].get(who, 0) + amt
        return {"tapped": amt}

    # ---------- USDC: the only cross-side medium (David, 2026-10-17) ----------
    # Inflow: USDC in == a purchase on the crypto rail -> 50/50 e-fuse / Merit.
    # Out: swap_burn (Merit burned 1:1 into the holder's USDC wallet, paid from the Merit-half reserve),
    #      work_pay (USDC for work, may cross human<->bot), usdc_out (attested gateway to open market).
    # Merit and ownership never cross sides; only USDC does.
    def _bot_usdc(self):
        return sum(v for i, v in self.s["usdc"].items() if self.s["ids"][i]["kind"] == "bot")

    def _bot_cap_ok(self, to, add, frm=None):
        if self.s["ids"][to]["kind"] != "bot":
            return
        sub = add if frm is not None and self.s["ids"][frm]["kind"] == "bot" else 0
        if self._bot_usdc() + add - sub > BOT_USDC_CAP:
            raise Rejected("bot-side aggregate USDC cap reached (anti-cornering)")

    def _op_usdc_in(self, op, now, dry):
        """USDC inflow: identical to a purchase on the crypto rail (50/50). rail must be signed as "crypto"."""
        if op.get("rail") != "crypto":
            raise Rejected("usdc_in requires rail=crypto")
        return self._op_purchase(op, now, dry)

    def _op_swap_burn(self, op, now, dry):
        who = op.get("id"); amt = _amt(op.get("amount"))
        ident = self._signed_by(op, who)
        if self.s["merit"][who] < amt:
            raise Rejected("insufficient merit")
        self._bot_cap_ok(who, amt)
        if not dry:
            k = ident["kind"]
            self.s["merit"][who] -= amt; self.s["merit_supply"][k] -= amt
            self.s["usdc_flow"]["burned_merit"] += amt
            self.s["usdc"][who] = self.s["usdc"].get(who, 0) + amt
        return {"merit_burned": amt, "usdc": amt}

    def _op_work_pay(self, op, now, dry):
        frm, to, ref = op.get("from"), op.get("to"), op.get("work_ref")
        amt = _amt(op.get("amount")); _hex64(ref, "work_ref")
        self._signed_by(op, frm)
        if to not in self.s["ids"] or to == frm:
            raise Rejected("bad recipient")
        if self.s["usdc"].get(frm, 0) < amt:
            raise Rejected("insufficient usdc")
        self._bot_cap_ok(to, amt, frm)
        if not dry:
            self.s["usdc"][frm] -= amt
            self.s["usdc"][to] = self.s["usdc"].get(to, 0) + amt
        return {"usdc": amt, "cross_side": self.s["ids"][frm]["kind"] != self.s["ids"][to]["kind"]}

    def _op_usdc_out(self, op, now, dry):
        who = op.get("id"); amt = _amt(op.get("amount"))
        self._attested(op); self._signed_by(op, who)
        if self.s["usdc"].get(who, 0) < amt:
            raise Rejected("insufficient usdc")
        if not dry:
            self.s["usdc"][who] -= amt; self.s["usdc_flow"]["out"] += amt
        return {"usdc_out": amt}

    # ---------- Hierarchy: humans own the bot swarm memory space (David, 2026-10-17) ----------
    def _op_set_controller(self, op, now, dry):
        """A human takes control of a bot's memory space. Signed by the human AND the bot (consent of the
        current key holder). Refused if the controller is a bot or the target is a human."""
        bot, own = op.get("bot"), op.get("owner")
        b, o = self.s["ids"].get(bot), self.s["ids"].get(own)
        if b is None or o is None:
            raise Rejected("unknown identity")
        if o["kind"] != "human":
            raise Rejected("law: a bot may never own or control anything (only humans control)")
        if b["kind"] != "bot":
            raise Rejected("law: a human can never be owned or controlled")
        self._signed_by(op, own)
        sig2 = op.get("bot_sig")
        if not isinstance(sig2, str) or not hmac.compare_digest(sign(b["key"], op), sig2):
            raise Rejected("bad bot consent signature")
        if bot in self.s["controller"] and self.s["controller"][bot] != own:
            raise Rejected("bot already controlled; current owner must release")
        if not dry:
            self.s["controller"][bot] = own
        return {"bot": bot, "owner": own}

    def control_shares(self):
        """Read-only. 100% of the human side holds a claim on 100% of the bot side: each human's share =
        their Merit / total human Merit (exact Fractions, summing to exactly 1 when any human holds Merit).
        Only human trading changes these; the bot side mirrors them."""
        hm = {i: v for i, v in self.s["merit"].items() if self.s["ids"][i]["kind"] == "human" and v > 0}
        tot = sum(hm.values())
        return {i: Fraction(v, tot) for i, v in sorted(hm.items())} if tot else {}

    def swarm_claims(self):
        """Read-only. Integer split of the whole bot side (bot Merit supply) across humans by control share,
        largest-remainder so it sums to the bot supply exactly, ties broken by id (deterministic)."""
        total = self.s["merit_supply"]["bot"]; sh = self.control_shares()
        if not sh:
            return {}
        base = {i: int(f * total) for i, f in sh.items()}
        rem = total - sum(base.values())
        for i in sorted(sh, key=lambda i: (-(sh[i] * total - base[i]), i))[:rem]:
            base[i] += 1
        return base

    # Every e-fuse outflow, UniFi3 transfer and Merit sale is refused by construction, for anyone.
    def _refuse(self, op, now, dry):
        raise Rejected(f"{op['type']}: forbidden for everyone, founder included")

    _op_efuse_withdraw = _op_efuse_sell = _op_efuse_transfer = _op_efuse_redeem = _refuse
    _op_unifi_transfer = _op_unifi_sell = _op_merit_sell = _refuse

    # ---------- Merit transfer (David, 2026-10-17) ----------
    CROSS_SIDE_WARNING = ("WARNING: recipient is on the other side of the human/bot Merit split. "
                          "Like sending to the wrong chain, the full amount is FORFEITED to the network pool. "
                          "The recipient receives nothing and it cannot be undone.")

    def precheck_transfer(self, sender, to, amount):
        """Read-only. UIs call this before signing a merit_transfer and show `warning` if set."""
        try:
            _amt(amount)
            a, b = self.s["ids"].get(sender), self.s["ids"].get(to)
            if a is None or b is None:
                raise Rejected("unknown identity")
            if sender == to:
                raise Rejected("self transfer")
            if self.s["merit"][sender] < amount:
                raise Rejected("insufficient merit")
        except Rejected as e:
            return {"ok": False, "error": str(e), "cross_side": None, "forfeit": 0, "recipient_gets": 0, "warning": None}
        cross = a["kind"] != b["kind"]
        return {"ok": True, "error": None, "cross_side": cross, "forfeit": amount if cross else 0,
                "recipient_gets": 0 if cross else amount, "warning": self.CROSS_SIDE_WARNING if cross else None}

    def _op_merit_transfer(self, op, now, dry):
        """Same side: moves. Cross side (human<->bot): accepted as forfeiture to the sender side's
        network pool; recipient gets nothing; side supplies and the 50/50 caps are unchanged."""
        snd, to = op.get("from"), op.get("to")
        self._signed_by(op, snd)
        pc = self.precheck_transfer(snd, to, op.get("amount"))
        if not pc["ok"]:
            raise Rejected(pc["error"])
        amt, k = op["amount"], self.s["ids"][snd]["kind"]
        if not dry:
            self.s["merit"][snd] -= amt
            if pc["cross_side"]:
                self.s["merit_pool"][k] += amt
            else:
                self.s["merit"][to] += amt
        return {"cross_side": pc["cross_side"], "forfeit": pc["forfeit"], "recipient_gets": pc["recipient_gets"],
                "pool_side": k if pc["cross_side"] else None}
    _op_seed_withdraw = _refuse   # until a canon amendment frames the 1% as a seed share
