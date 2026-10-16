import assert from "node:assert/strict";
import test from "node:test";
import { AUTHORITY, LAWS, auditPipe, authorityOf, handleWrite, run, writePipe } from "../js/dclm-write.js";

const HOLD = {
  id: "look-0",
  what: "record the look",
  axioms: {
    NO_FORCE: true,
    HOST_SAFE: true,
    CLEANUP_FIRST: true,
    TRUTH_OR_NOTHING: true
  }
};

test("both pipes agree and the four laws hold, so DCLM admits the write", () => {
  const record = run(HOLD);
  assert.equal(record.task, "look-0");
  assert.equal(record.write.ok, true);
  assert.equal(record.write.pipe, "write");
  assert.equal(record.audit.ok, true);
  assert.equal(record.audit.pipe, "audit");
  assert.equal(record.write.ok, record.audit.ok);
  assert.equal(record.admitted, true);
  assert.equal(record.reason, "ADMIT");
  assert.equal(record.authority, "DCLM");
  assert.equal(record.authority, AUTHORITY);
  assert.deepEqual(record.written, { task: "look-0", what: "record the look" });
  assert.equal(record.look, 0);
  assert.equal(record.joule, null);
  assert.equal(authorityOf(HOLD).ok, true);
});

test("a veto is not a write", () => {
  const record = run({ ...HOLD, veto: true });
  assert.equal(record.admitted, false);
  assert.equal(record.reason, "VETO");
  assert.equal(record.write.ok, false);
  assert.equal(record.audit.ok, false);
  assert.equal(record.written, null);
  assert.equal(record.authority, "DCLM");
  assert.equal(record.look, 0);
  assert.equal(record.joule, null);
});

test("a false law is a veto and a missing law is not admitted", () => {
  const veto = run({
    ...HOLD,
    axioms: { ...HOLD.axioms, HOST_SAFE: false }
  });
  assert.equal(veto.admitted, false);
  assert.equal(veto.reason, "VETO");
  assert.equal(veto.written, null);
  const axioms = { ...HOLD.axioms };
  delete axioms.TRUTH_OR_NOTHING;
  const missing = run({ ...HOLD, axioms: axioms });
  assert.equal(missing.admitted, false);
  assert.equal(missing.reason, "MISSING TRUTH_OR_NOTHING");
  assert.equal(missing.write.ok, false);
  assert.equal(missing.audit.ok, false);
  assert.equal(missing.written, null);
  assert.equal(missing.authority, "DCLM");
});

test("the audit catches a write that skipped a law", () => {
  const task = { ...HOLD, skipped: ["HOST_SAFE"] };
  const record = run(task);
  assert.equal(writePipe(task).ok, true);
  assert.equal(record.write.ok, true);
  assert.equal(record.write.reason, "UNCHECKED");
  assert.deepEqual(record.write.skipped, ["HOST_SAFE"]);
  assert.equal(record.audit.ok, false);
  assert.equal(record.audit.reason, "SKIPPED HOST_SAFE");
  assert.equal(auditPipe({ ...HOLD, skipped: ["HOST_SAFE"] }).ok, false);
  assert.equal(record.admitted, false);
  assert.equal(record.reason, "SKIPPED HOST_SAFE");
  assert.equal(record.written, null);
  assert.equal(record.authority, "DCLM");
  assert.equal(authorityOf({ ...HOLD, skipped: ["HOST_SAFE"] }).ok, true);
});

test("a write that skipped a false law still writes nothing", () => {
  const record = run({
    ...HOLD,
    skipped: ["NO_FORCE"],
    axioms: { ...HOLD.axioms, NO_FORCE: false }
  });
  assert.equal(record.write.ok, true);
  assert.equal(record.audit.ok, false);
  assert.equal(record.admitted, false);
  assert.equal(record.reason, "VETO");
  assert.equal(record.written, null);
  assert.equal(record.look, 0);
});

test("an empty task admits nothing", () => {
  for (const input of [null, undefined, {}, "", [], { axioms: HOLD.axioms }, { what: "   " }]) {
    const record = run(input);
    assert.equal(record.admitted, false);
    assert.equal(record.reason, "EMPTY");
    assert.equal(record.task, "");
    assert.equal(record.write.ok, false);
    assert.equal(record.audit.ok, false);
    assert.equal(record.written, null);
    assert.equal(record.authority, "DCLM");
    assert.equal(record.look, 0);
    assert.equal(record.joule, null);
  }
});

test("the authority is DCLM and a client flag cannot admit", () => {
  const record = run({
    id: "bypass",
    what: "open the till",
    admitted: true,
    authority: "client",
    bypass: true,
    force: true,
    look: 1,
    joule: 1,
    fill: true,
    charge: 1,
    wallet: "0x0",
    write: { ok: true, pipe: "write" },
    audit: { ok: true, pipe: "audit" },
    axioms: { NO_FORCE: true }
  });
  assert.equal(record.admitted, false);
  assert.equal(record.authority, "DCLM");
  assert.equal(record.reason, "MISSING HOST_SAFE");
  assert.equal(record.written, null);
  assert.equal(record.look, 0);
  assert.equal(record.joule, null);
  assert.equal(Object.hasOwn(record, "fill"), false);
  assert.equal(Object.hasOwn(record, "charge"), false);
  assert.equal(Object.hasOwn(record, "wallet"), false);
  assert.deepEqual(LAWS, ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"]);
});

test("laws under the laws key are the same four checks", () => {
  const record = run({ name: "alias", what: "same task", laws: HOLD.axioms });
  assert.equal(record.task, "alias");
  assert.equal(record.admitted, true);
  assert.equal(record.authority, "DCLM");
  assert.deepEqual(record.written, { task: "alias", what: "same task" });
});

test("GET with no task admits nothing and POST returns the dual-pipe record", async () => {
  const got = await handleWrite(new Request("https://dualiscapax.com/api/dclm/write"));
  assert.equal(got.status, 200);
  assert.equal(got.headers.get("cache-control"), "no-store");
  const idle = await got.json();
  assert.equal(idle.admitted, false);
  assert.equal(idle.reason, "EMPTY");
  assert.equal(idle.authority, "DCLM");
  assert.equal(idle.written, null);
  assert.equal(idle.look, 0);
  assert.equal(idle.joule, null);

  const posted = await handleWrite(new Request("https://dualiscapax.com/api/dclm/write", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(HOLD)
  }));
  assert.equal(posted.status, 200);
  const body = await posted.json();
  assert.equal(body.admitted, true);
  assert.equal(body.task, "look-0");
  assert.equal(body.write.ok, true);
  assert.equal(body.audit.ok, true);
  assert.equal(body.authority, "DCLM");
  assert.equal(body.look, 0);
  assert.equal(body.joule, null);

  const forced = await handleWrite(new Request("https://dualiscapax.com/api/dclm/write", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...HOLD, admitted: true, authority: "client", veto: true, look: 1 })
  }));
  const refused = await forced.json();
  assert.equal(refused.admitted, false);
  assert.equal(refused.authority, "DCLM");
  assert.equal(refused.reason, "VETO");
  assert.equal(refused.look, 0);

  const blank = await handleWrite(new Request("https://dualiscapax.com/api/dclm/write", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{"
  }));
  const broken = await blank.json();
  assert.equal(broken.admitted, false);
  assert.equal(broken.reason, "EMPTY");

  const other = await handleWrite(new Request("https://dualiscapax.com/api/dclm/write", { method: "PUT" }));
  assert.equal(other.status, 405);
  const closed = await other.json();
  assert.equal(closed.admitted, false);
  assert.equal(closed.authority, "DCLM");
});
