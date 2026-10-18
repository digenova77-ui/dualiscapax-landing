#!/usr/bin/env python3
"""The gauntlet for tools/coins/ledger.py. stdlib unittest + seeded randomized fuzz.
Run: python3 tools/coins/gauntlet.py            (unit + adversarial + 20k-op fuzz)
     FUZZ_OPS=1000000 python3 tools/coins/gauntlet.py   (million-op invariant fuzz)
"""
from fractions import Fraction
import copy, hashlib, os, random, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ledger as L
from ledger import Ledger, Rejected, sign

ATT = "aa" * 32
T0 = 1_800_000_000


def hx(*parts):
    return hashlib.sha256(repr(parts).encode()).hexdigest()


class W:
    """Test harness: builds signed/attested ops with fresh nonces."""
    def __init__(self, seed=0, **kw):
        self.L = Ledger(ATT, **kw); self.n = 0; self.keys = {}; self.seed = seed

    def op(self, typ, signer=None, attest=False, now=T0, ttl=30, **f):
        self.n += 1
        o = {"type": typ, "nonce": hx("n", self.seed, self.n), "issued_at": now, "expires_at": now + ttl, **f}
        if signer: o["sig"] = sign(self.keys[signer], o)
        if attest: o["att"] = sign(ATT, o)
        return o

    def fuse(self, name, kind="human", person=None, now=T0):
        idh, key = hx("id", name), hx("key", name)
        self.keys[idh] = key
        p = (person or hx("p", name)) if kind == "human" else None
        self.L.apply(self.op("fuse", attest=True, now=now, id=idh, kind=kind, key=key, person=p), now)
        return idh

    def buy(self, idh, amt, ref=None, rail="usd", now=T0):
        return self.L.apply(self.op("purchase", signer=idh, attest=True, now=now, buyer=idh, amount=amt,
                                    rail=rail, payment_ref=ref or hx("pay", self.n)), now)


class Unit(unittest.TestCase):
    def setUp(self):
        self.w = W(); self.a = self.w.fuse("alice"); self.b = self.w.fuse("bot1", "bot")

    def test_fuse_mints_one_unifi_and_opens_merit(self):
        self.assertEqual(self.w.L.s["unifi"][self.a], 1); self.assertEqual(self.w.L.s["merit"][self.a], 0)

    def test_split_exact_to_cent_odd_goes_efuse(self):
        r = self.w.buy(self.a, 1001)
        self.assertEqual(r["effects"], {"efuse": 501, "merit": 500})

    def test_all_rails(self):
        for rail in ("usd", "fiat", "crypto"): self.w.buy(self.a, 100, rail=rail)
        self.assertEqual(self.w.L.s["merit"][self.a], 150)

    def test_settle_world_cost_then_surplus_to_expansion(self):
        self.w.buy(self.a, 1000)
        r = self.w.L.apply(self.w.op("settle", attest=True, world_cost=300), T0)
        self.assertEqual(r["effects"], {"world_cost_paid": 300, "expansion": 200})
        self.assertEqual(self.w.L.s["efuse"]["balance"], 0)

    def test_settle_short_keeps_nothing_for_expansion(self):
        self.w.buy(self.a, 1000)
        r = self.w.L.apply(self.w.op("settle", attest=True, world_cost=900), T0)
        self.assertEqual(r["effects"], {"world_cost_paid": 500, "expansion": 0})

    def test_split_continues_after_world_cost_covered(self):
        self.w.L.apply(self.w.op("settle", attest=True, world_cost=0), T0)
        self.assertEqual(self.w.buy(self.a, 10)["effects"], {"efuse": 5, "merit": 5})

    def test_derivative_90_9_1(self):
        r = self.w.L.apply(self.w.op("derivative", attest=True, amount=10000, worker=self.a,
                                     source_ref=hx("s")), T0)
        self.assertEqual(r["effects"], {"forest": 9000, "harvest": 900, "seed": 100})

    def test_seed_forest_mode(self):
        w = W(seed_mode="forest"); a = w.fuse("x")
        r = w.L.apply(w.op("derivative", attest=True, amount=10000, worker=a, source_ref=hx("s")), T0)
        self.assertEqual(r["effects"]["seed"], 0); self.assertEqual(r["effects"]["forest"], 9100)

    def test_receipt_chain_verifies(self):
        self.w.buy(self.a, 5); self.assertTrue(Ledger.verify_chain(self.w.L.receipts))


class Adversarial(unittest.TestCase):
    def setUp(self):
        self.w = W(); self.a = self.w.fuse("alice"); self.b = self.w.fuse("bot1", "bot")

    def rej(self, op, now=T0):
        before = self.w.L.state_hash()
        with self.assertRaises(Rejected): self.w.L.apply(op, now)
        self.assertEqual(before, self.w.L.state_hash(), "rejected op mutated state")

    def test_replay_same_op(self):
        o = self.w.op("purchase", signer=self.a, attest=True, buyer=self.a, amount=10, rail="usd", payment_ref=hx("r"))
        self.w.L.apply(o, T0); self.rej(o)

    def test_double_spend_same_payment_new_nonce(self):
        self.w.buy(self.a, 10, ref=hx("pay!")); self.rej(self.w.op("purchase", signer=self.a, attest=True,
            buyer=self.a, amount=10, rail="usd", payment_ref=hx("pay!")))

    def test_derivative_source_double_credit(self):
        f = dict(attest=True, amount=100, worker=self.a, source_ref=hx("src"))
        self.w.L.apply(self.w.op("derivative", **f), T0); self.rej(self.w.op("derivative", **f))

    def test_expired(self):
        self.rej(self.w.op("purchase", signer=self.a, attest=True, buyer=self.a, amount=1, rail="usd",
                           payment_ref=hx("e")), now=T0 + 31)

    def test_clock_skew_future_issue(self):
        self.rej(self.w.op("purchase", now=T0 + 6, signer=self.a, attest=True, buyer=self.a, amount=1,
                           rail="usd", payment_ref=hx("f")), now=T0)

    def test_skew_within_tolerance_ok(self):
        self.w.L.apply(self.w.op("settle", now=T0 + 5, attest=True, world_cost=0), T0)

    def test_ttl_too_long(self):
        self.rej(self.w.op("settle", ttl=61, attest=True, world_cost=0))

    def test_efuse_drain_every_path_everyone(self):
        for t in ("efuse_withdraw", "efuse_sell", "efuse_transfer", "efuse_redeem", "seed_withdraw"):
            for who in (self.a, self.b):
                self.rej(self.w.op(t, signer=who, attest=True, amount=1, to=who))

    def test_settle_without_attestation_cannot_drain(self):
        self.w.buy(self.a, 1000); self.rej(self.w.op("settle", world_cost=500))

    def test_forged_attestation(self):
        o = self.w.op("settle", world_cost=500); o["att"] = sign("bb" * 32, o); self.rej(o)

    def test_tampered_after_signing(self):
        o = self.w.op("purchase", signer=self.a, attest=True, buyer=self.a, amount=10, rail="usd", payment_ref=hx("t"))
        o["amount"] = 10 ** 9; self.rej(o)

    def test_impersonation(self):
        o = self.w.op("purchase", signer=self.b, attest=True, buyer=self.a, amount=10, rail="usd", payment_ref=hx("i"))
        self.rej(o)

    def test_unifi_and_merit_non_transferable(self):
        for t in ("unifi_transfer", "unifi_sell", "merit_sell"):
            self.rej(self.w.op(t, signer=self.a, to=self.b, amount=1))

    def test_malformed(self):
        bad = [None, [], {"type": 5}, {"type": "nope"}, {"type": "purchase"}]
        for amt in (-1, 0, 1.5, True, "10", 10 ** 16, None):
            bad.append(self.w.op("purchase", signer=self.a, attest=True, buyer=self.a, amount=amt, rail="usd",
                                 payment_ref=hx("m", repr(amt))))
        bad.append(self.w.op("purchase", signer=self.a, attest=True, buyer=self.a, amount=1, rail="gold", payment_ref=hx("g")))
        bad.append(self.w.op("purchase", signer=self.a, attest=True, buyer=self.a, amount=1, rail="usd", payment_ref="XYZ"))
        for o in bad: self.rej(o)
        with self.assertRaises(Rejected): self.w.L.apply(self.w.op("settle", attest=True, world_cost=0), "now")

    def test_overflow_guard(self):
        self.rej(self.w.op("purchase", signer=self.a, attest=True, buyer=self.a, amount=L.MAX_AMOUNT + 1,
                           rail="usd", payment_ref=hx("o")))

    def test_rounding_dust_never_lost(self):
        for _ in range(999): self.w.buy(self.a, 1)
        s = self.w.L.s
        self.assertEqual(s["efuse"]["deposited"], 999); self.assertEqual(s["merit"][self.a], 0)
        self.w.L.check_invariants()

    def test_sybil_same_person_two_humans(self):
        self.w.fuse("carol", person=hx("P"))
        with self.assertRaises(Rejected): self.w.fuse("carol2", person=hx("P"))

    def test_sybil_bot_cannot_claim_person(self):
        idh = hx("id", "evil")
        self.rej(self.w.op("fuse", attest=True, id=idh, kind="bot", key=hx("k"), person=hx("pp")))

    def test_sybil_self_registration_without_attestor(self):
        self.rej(self.w.op("fuse", id=hx("id", "z"), kind="human", key=hx("k"), person=hx("pz")))

    def test_refuse_refuse_double_fuse(self):
        with self.assertRaises(Rejected): self.w.fuse("alice", person=hx("other"))

    def test_bot_half_exhaustion_does_not_touch_human_half(self):
        old = L.MERIT_HALF; L.MERIT_HALF = 100
        try:
            self.w.buy(self.b, 200)                      # bot gets 100 merit, half full
            with self.assertRaises(Rejected): self.w.buy(self.b, 2)
            self.w.buy(self.a, 200)                      # human half unaffected
            b2 = self.w.fuse("bot2", "bot")
            with self.assertRaises(Rejected): self.w.buy(b2, 2)   # sybil bots share one half
        finally: L.MERIT_HALF = old
        self.w.L.check_invariants()

    def test_ordering_front_running_settle_cannot_reach_merit(self):
        # Settlement ordered before/after a purchase never touches the buyer's Merit.
        for order in ("settle_first", "buy_first"):
            w = W(); a = w.fuse("x")
            ops = [lambda: w.L.apply(w.op("settle", attest=True, world_cost=10 ** 6), T0), lambda: w.buy(a, 100)]
            if order == "buy_first": ops.reverse()
            for f in ops: f()
            self.assertEqual(w.L.s["merit"][a], 50); w.L.check_invariants()

    def test_atomic_reject_mid_validation(self):
        # Valid sig + attestation but merit half full: nothing (e-fuse, payment ref, nonce) may change.
        old = L.MERIT_HALF; L.MERIT_HALF = 0
        try:
            self.rej(self.w.op("purchase", signer=self.a, attest=True, buyer=self.a, amount=10, rail="usd", payment_ref=hx("x")))
        finally: L.MERIT_HALF = old

    def test_tap_rules(self):
        w = W(reserve_target=1000); a = w.fuse("m")
        tap = lambda amt: w.L.apply(w.op("tap", signer=a, member=a, amount=amt), T0)
        with self.assertRaises(Rejected): tap(1)                                  # out of season
        w.L.apply(w.op("derivative", attest=True, amount=10, worker=a, source_ref=hx("d1")), T0)
        w.L.apply(w.op("season", attest=True, open=True), T0)
        with self.assertRaises(Rejected): tap(1)                                  # unhealthy (forest 9 < 1000)
        w.L.apply(w.op("season", attest=True, open=False), T0)
        w.L.apply(w.op("derivative", attest=True, amount=200_000, worker=a, source_ref=hx("d2")), T0)
        w.L.apply(w.op("season", attest=True, open=True), T0)
        budget = w.L.s["season"]["budget"]; self.assertGreater(budget, 0)
        tap(budget // 2)
        with self.assertRaises(Rejected): tap(budget)                             # over season budget
        with self.assertRaises(Rejected): tap(L.TAP_MEMBER_CAP + 1)                # member cap
        self.assertGreaterEqual(w.L.s["deriv"]["forest"], 1000); w.L.check_invariants()

    def test_chain_tamper_detected(self):
        self.w.buy(self.a, 10); self.w.buy(self.a, 20)
        r = copy.deepcopy(self.w.L.receipts); r[0]["effects"]["merit"] = 999
        self.assertFalse(Ledger.verify_chain(r))
        r = copy.deepcopy(self.w.L.receipts); del r[0]; self.assertFalse(Ledger.verify_chain(r))

    def test_restore_rejects_tampered_snapshot(self):
        self.w.buy(self.a, 10)
        snap = self.w.L.snapshot().replace('"merit":5', '"merit":6', 1)
        with self.assertRaises(Rejected): Ledger.restore(snap, ATT)


def random_run(seed, n_ops, check_every=1):
    """Seeded random workload incl. hostile ops. Returns (ledger, accepted, rejected)."""
    rng = random.Random(seed); w = W(seed=seed, reserve_target=rng.choice([0, 5000, 10 ** 6]))
    ids = []; acc = rej = 0; now = T0; used_refs = []
    for i in range(n_ops):
        now += rng.randint(0, 3); r = rng.random()
        try:
            if r < 0.06 or not ids:
                kind = rng.choice(L.KINDS)
                ids.append(w.fuse(f"{seed}-{i}", kind, person=hx("p", seed, rng.randint(0, n_ops // 4)), now=now))
            elif r < 0.55:
                ref = rng.choice(used_refs) if used_refs and rng.random() < 0.05 else hx("pay", seed, i)
                used_refs.append(ref)
                w.buy(rng.choice(ids), rng.choice([1, 2, 3, 99, 101, rng.randint(1, 10 ** 7)]), ref=ref,
                      rail=rng.choice(["usd", "fiat", "crypto"]), now=now)
            elif r < 0.62:
                w.L.apply(w.op("settle", attest=True, now=now, world_cost=rng.randint(0, 10 ** 7)), now)
            elif r < 0.75:
                w.L.apply(w.op("derivative", attest=True, now=now, amount=rng.randint(1, 10 ** 6),
                               worker=rng.choice(ids), source_ref=hx("src", seed, rng.randint(0, n_ops))), now)
            elif r < 0.78:
                w.L.apply(w.op("season", attest=True, now=now, open=rng.random() < 0.6), now)
            elif r < 0.88:
                m = rng.choice(ids)
                w.L.apply(w.op("tap", signer=m, now=now, member=m, amount=rng.randint(1, 20_000)), now)
            elif r < 0.91:
                a, b = rng.choice(ids), rng.choice(ids)
                w.L.apply(w.op("merit_transfer", signer=a, now=now, **{"from": a}, to=b,
                               amount=rng.choice([1, 7, rng.randint(1, 10 ** 6)])), now)
            elif r < 0.92:
                bt, ow = rng.choice(ids), rng.choice(ids)
                o = w.op("set_controller", signer=ow, now=now, bot=bt, owner=ow); o["bot_sig"] = sign(w.keys[bt], o)
                w.L.apply(o, now)
            elif r < 0.935:
                a, b = rng.choice(ids), rng.choice(ids); k = rng.randint(0, 2)
                if k == 0: w.L.apply(w.op("swap_burn", signer=a, now=now, id=a, amount=rng.randint(1, 10 ** 5)), now)
                elif k == 1: w.L.apply(w.op("work_pay", signer=a, now=now, **{"from": a}, to=b,
                                            amount=rng.randint(1, 10 ** 5), work_ref=hx("w", seed, i)), now)
                else: w.L.apply(w.op("usdc_out", signer=a, attest=True, now=now, id=a, amount=rng.randint(1, 10 ** 5)), now)
            elif r < 0.94:
                m = rng.choice(ids)
                w.L.apply(w.op(rng.choice(["efuse_withdraw", "efuse_sell", "merit_transfer", "unifi_transfer",
                                           "seed_withdraw"]), signer=m, now=now, amount=1, to=m), now)
            else:   # replay / stale / skewed / unsigned
                kind = rng.randint(0, 3)
                if kind == 0 and w.L.receipts: w.L.apply(rng.choice(w.L.receipts)["op"], now)
                elif kind == 1: w.L.apply(w.op("settle", attest=True, now=now - 120, world_cost=0), now)
                elif kind == 2: w.L.apply(w.op("settle", attest=True, now=now + 60, world_cost=0), now)
                else: w.L.apply(w.op("settle", now=now, world_cost=10 ** 6), now)
            acc += 1
        except Rejected:
            rej += 1
        if i % check_every == 0: w.L.check_invariants()
    w.L.check_invariants()
    return w, acc, rej


class MeritTransfer(unittest.TestCase):
    def setUp(self):
        self.w = W(); self.a = self.w.fuse("alice"); self.c = self.w.fuse("carol"); self.b = self.w.fuse("bot1", "bot")
        self.w.buy(self.a, 2000); self.w.buy(self.b, 2000)

    def tx(self, frm, to, amt, signer=None):
        return self.w.L.apply(self.w.op("merit_transfer", signer=signer or frm, **{"from": frm}, to=to, amount=amt), T0)

    def test_same_side_moves(self):
        r = self.tx(self.a, self.c, 300)
        self.assertEqual(r["effects"]["recipient_gets"], 300)
        self.assertEqual((self.w.L.s["merit"][self.a], self.w.L.s["merit"][self.c]), (700, 300))
        self.w.L.check_invariants()

    def test_cross_side_forfeits_human_to_bot(self):
        sup = dict(self.w.L.s["merit_supply"])
        r = self.tx(self.a, self.b, 400)
        self.assertEqual(r["effects"], {"cross_side": True, "forfeit": 400, "recipient_gets": 0, "pool_side": "human"})
        s = self.w.L.s
        self.assertEqual((s["merit"][self.a], s["merit"][self.b], s["merit_pool"]["human"]), (600, 1000, 400))
        self.assertEqual(s["merit_supply"], sup); s and self.w.L.check_invariants()
        self.assertTrue(Ledger.verify_chain(self.w.L.receipts))

    def test_cross_side_forfeits_bot_to_human(self):
        self.tx(self.b, self.a, 1000)
        self.assertEqual(self.w.L.s["merit_pool"]["bot"], 1000); self.assertEqual(self.w.L.s["merit"][self.a], 1000)
        self.w.L.check_invariants()

    def test_precheck_warns_and_is_read_only(self):
        h0 = self.w.L.state_hash()
        p = self.w.L.precheck_transfer(self.a, self.b, 10)
        self.assertTrue(p["ok"] and p["cross_side"]); self.assertIn("FORFEITED", p["warning"]); self.assertEqual(p["recipient_gets"], 0)
        p = self.w.L.precheck_transfer(self.a, self.c, 10)
        self.assertFalse(p["cross_side"]); self.assertIsNone(p["warning"])
        for bad in [(self.a, self.b, 10 ** 6), (self.a, hx("nobody"), 1), (self.a, self.a, 1), (self.a, self.c, 0), (self.a, self.c, 1.5)]:
            self.assertFalse(self.w.L.precheck_transfer(*bad)["ok"])
        self.assertEqual(h0, self.w.L.state_hash())

    def test_rejections_leave_state(self):
        for args in [(self.a, self.c, 1001), (self.a, self.a, 1), (self.a, hx("x"), 1), (self.a, self.c, -5)]:
            h0 = self.w.L.state_hash()
            with self.assertRaises(Rejected): self.tx(*args)
            self.assertEqual(h0, self.w.L.state_hash())
        h0 = self.w.L.state_hash()
        with self.assertRaises(Rejected): self.tx(self.a, self.c, 1, signer=self.c)   # not the owner
        self.assertEqual(h0, self.w.L.state_hash())

    def test_forfeit_cannot_be_reclaimed_or_dodge_caps(self):
        old = L.MERIT_HALF; L.MERIT_HALF = 1000
        try:
            self.tx(self.b, self.a, 1000)               # bot side forfeits all; bot half still full
            with self.assertRaises(Rejected): self.w.buy(self.b, 2)
        finally: L.MERIT_HALF = old


class Hierarchy(unittest.TestCase):
    def setUp(self):
        self.w = W(); self.h1 = self.w.fuse("h1"); self.h2 = self.w.fuse("h2"); self.h3 = self.w.fuse("h3")
        self.b1 = self.w.fuse("b1", "bot"); self.b2 = self.w.fuse("b2", "bot")

    def ctl(self, bot, owner, bot_signer=None):
        o = self.w.op("set_controller", signer=owner, bot=bot, owner=owner)
        o["bot_sig"] = sign(self.w.keys[bot_signer or bot], o)
        return self.w.L.apply(o, T0)

    def test_human_controls_bot(self):
        self.ctl(self.b1, self.h1); self.assertEqual(self.w.L.s["controller"][self.b1], self.h1)
        self.w.L.check_invariants()

    def test_bot_controls_human_refused(self):
        for bot, owner in [(self.h1, self.b1), (self.b2, self.b1), (self.h1, self.h2)]:
            h0 = self.w.L.state_hash()
            with self.assertRaises(Rejected): self.ctl(bot, owner)
            self.assertEqual(h0, self.w.L.state_hash())

    def test_no_hijack_without_bot_consent_or_second_owner(self):
        with self.assertRaises(Rejected): self.ctl(self.b1, self.h1, bot_signer=self.h2)
        self.ctl(self.b1, self.h1)
        with self.assertRaises(Rejected): self.ctl(self.b1, self.h2)

    def test_shares_sum_to_100_percent(self):
        for who, amt in [(self.h1, 1001), (self.h2, 333), (self.h3, 7), (self.b1, 99999), (self.b2, 3)]:
            self.w.buy(who, amt)
        sh = self.w.L.control_shares()
        self.assertEqual(sum(sh.values()), 1); self.assertNotIn(self.b1, sh)     # bots hold no control
        cl = self.w.L.swarm_claims()
        self.assertEqual(sum(cl.values()), self.w.L.s["merit_supply"]["bot"])

    def test_control_tracks_human_trades_bot_side_mirrors(self):
        self.w.buy(self.h1, 2000); self.w.buy(self.h2, 2000); self.w.buy(self.b1, 10000)
        self.assertEqual(self.w.L.control_shares()[self.h1], Fraction(1, 2))
        bot_before = self.w.L.s["merit_supply"]["bot"]
        self.w.L.apply(self.w.op("merit_transfer", signer=self.h1, **{"from": self.h1}, to=self.h2, amount=500), T0)
        sh = self.w.L.control_shares()
        self.assertEqual((sh[self.h1], sh[self.h2]), (Fraction(1, 4), Fraction(3, 4)))
        self.assertEqual(self.w.L.swarm_claims(), {self.h1: 1250, self.h2: 3750})
        self.assertEqual(self.w.L.s["merit_supply"]["bot"], bot_before)          # bot side only mirrors
        # bot-side trades never move human control
        self.w.L.apply(self.w.op("merit_transfer", signer=self.b1, **{"from": self.b1}, to=self.b2, amount=100), T0)
        self.assertEqual(self.w.L.control_shares(), sh)

    def test_random_shares_always_exact(self):
        rng = random.Random(5)
        for _ in range(300):
            self.w.buy(rng.choice([self.h1, self.h2, self.h3, self.b1]), rng.randint(1, 10 ** 6))
            self.assertEqual(sum(self.w.L.control_shares().values()), 1)
            self.assertEqual(sum(self.w.L.swarm_claims().values()), self.w.L.s["merit_supply"]["bot"])


class USDC(unittest.TestCase):
    def setUp(self):
        self.w = W(); self.h = self.w.fuse("h"); self.b = self.w.fuse("b", "bot"); self.b2 = self.w.fuse("b2", "bot")

    def ap(self, typ, signer=None, attest=False, **f):
        return self.w.L.apply(self.w.op(typ, signer=signer, attest=attest, **f), T0)

    def usdc_in(self, who, amt):
        return self.ap("usdc_in", signer=who, attest=True, buyer=who, amount=amt, rail="crypto", payment_ref=hx("u", self.w.n))

    def test_inflow_splits_50_50(self):
        self.assertEqual(self.usdc_in(self.h, 1001)["effects"], {"efuse": 501, "merit": 500})
        with self.assertRaises(Rejected):
            self.ap("usdc_in", signer=self.h, attest=True, buyer=self.h, amount=10, rail="usd", payment_ref=hx("z"))

    def test_swap_burn_work_pay_cross_side_and_out(self):
        self.usdc_in(self.h, 2000)
        self.ap("swap_burn", signer=self.h, id=self.h, amount=600)
        self.assertEqual((self.w.L.s["merit"][self.h], self.w.L.s["usdc"][self.h]), (400, 600))
        r = self.ap("work_pay", signer=self.h, **{"from": self.h}, to=self.b, amount=250, work_ref=hx("job"))
        self.assertTrue(r["effects"]["cross_side"])                      # USDC may cross; Merit did not move
        self.assertEqual(self.w.L.s["merit"][self.b], 0)
        self.ap("usdc_out", signer=self.b, attest=True, id=self.b, amount=250)
        self.assertEqual(self.w.L.s["usdc"][self.b], 0); self.w.L.check_invariants()

    def test_usdc_out_needs_gateway_and_balance(self):
        self.usdc_in(self.h, 200); self.ap("swap_burn", signer=self.h, id=self.h, amount=100)
        for kw in [dict(attest=False, amount=50), dict(attest=True, amount=101)]:
            with self.assertRaises(Rejected): self.ap("usdc_out", signer=self.h, id=self.h, **kw)

    def test_bot_aggregate_cap(self):
        old = L.BOT_USDC_CAP; L.BOT_USDC_CAP = 300
        try:
            self.usdc_in(self.h, 2000); self.ap("swap_burn", signer=self.h, id=self.h, amount=1000)
            self.ap("work_pay", signer=self.h, **{"from": self.h}, to=self.b, amount=200, work_ref=hx("j1"))
            self.ap("work_pay", signer=self.h, **{"from": self.h}, to=self.b2, amount=100, work_ref=hx("j2"))
            h0 = self.w.L.state_hash()
            with self.assertRaises(Rejected):          # many bots share one cap (sybil-proof)
                self.ap("work_pay", signer=self.h, **{"from": self.h}, to=self.b2, amount=1, work_ref=hx("j3"))
            self.assertEqual(h0, self.w.L.state_hash())
            self.ap("work_pay", signer=self.b, **{"from": self.b}, to=self.b2, amount=50, work_ref=hx("j4"))  # bot->bot ok
            self.usdc_in(self.b, 200)
            with self.assertRaises(Rejected): self.ap("swap_burn", signer=self.b, id=self.b, amount=1)
            self.w.L.check_invariants()
        finally: L.BOT_USDC_CAP = old

    def test_merit_and_ownership_never_cross(self):
        self.usdc_in(self.h, 1000)
        self.ap("merit_transfer", signer=self.h, **{"from": self.h}, to=self.b, amount=100)   # forfeits
        self.assertEqual(self.w.L.s["merit"][self.b], 0)
        self.assertNotIn(self.b, self.w.L.control_shares())


class Transition(unittest.TestCase):
    def test_no_progress_without_milestones_and_stepback_on_run(self):
        import transition_sim as T
        self.assertIn("share=  0.0%", T.run("none", lambda t: 0, lambda t: 10 ** 6))      # no IDs -> stays USDC
        r = T.run("run", lambda t: 3_000, lambda t: 50_000 + t * 15_000, shock_at=100, shock_redeem_bps=6000)
        self.assertIn("stepbacks=1", r)
        self.assertEqual(T.run("d", lambda t: 3_000, lambda t: 10 ** 5), T.run("d", lambda t: 3_000, lambda t: 10 ** 5))


class Fuzz(unittest.TestCase):
    def test_invariants_random(self):
        n = int(os.environ.get("FUZZ_OPS", "20000")); seeds = int(os.environ.get("FUZZ_SEEDS", "4"))
        tot_a = tot_r = 0
        for sd in range(seeds):
            w, a, r = random_run(sd, n // seeds, check_every=int(os.environ.get("CHECK_EVERY", "1")))
            tot_a += a; tot_r += r
            self.assertTrue(Ledger.verify_chain(w.L.receipts))
        print(f"\n[fuzz] ops={n} accepted={tot_a} rejected={tot_r} invariant violations=0", file=sys.stderr)

    def test_determinism_and_crash_restore(self):
        w1, *_ = random_run(42, 3000); w2, *_ = random_run(42, 3000)
        self.assertEqual(w1.L.state_hash(), w2.L.state_hash())        # same inputs -> same hash
        self.assertEqual(w1.L.snapshot(), w2.L.snapshot())            # byte-identical
        # crash/restore: snapshot mid-run, restore, replay rest -> identical to uninterrupted run
        ops = [(r["op"], r["at"]) for r in w1.L.receipts]
        cut = len(ops) // 2
        part = Ledger(ATT, reserve_target=w1.L.s["reserve_target"])
        for o, t in ops[:cut]: part.apply(o, t)
        restored = Ledger.restore(part.snapshot(), ATT)
        for o, t in ops[cut:]: restored.apply(o, t)
        full = Ledger(ATT, reserve_target=w1.L.s["reserve_target"])
        for o, t in ops: full.apply(o, t)
        self.assertEqual(restored.state_hash(), full.state_hash())
        self.assertEqual(full.state_hash(), w1.L.state_hash())  # receipt replay rebuilds exact state
        self.assertEqual(restored.receipts[-1]["hash"], w1.L.receipts[-1]["hash"])


if __name__ == "__main__":
    unittest.main(verbosity=1)
