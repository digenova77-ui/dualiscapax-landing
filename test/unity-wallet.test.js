import assert from "node:assert/strict";
import test from "node:test";
import { unityWallet } from "../js/unity-wallet.js";

const SECRET_NAMES = ["key", "privateKey", "phrase", "seed", "secret", "password", "mnemonic", "recovery"];

function namesOf(book) {
  return Object.keys(book).concat(Object.keys(book.wallet));
}

test("no key field", () => {
  const book = unityWallet({ identification: "Ada", key: "abc", privateKey: "abc" });
  assert.equal(Object.hasOwn(book, "key"), false);
  assert.equal(Object.hasOwn(book, "privateKey"), false);
  assert.equal(Object.hasOwn(book.wallet, "key"), false);
  assert.equal(JSON.stringify(book).includes("abc"), false);
});

test("nothing to remember", () => {
  const book = unityWallet({
    identification: "Ada",
    key: "hide",
    phrase: "twelve words",
    secret: "no",
    password: "no",
    seed: "no",
    mnemonic: "no",
    recovery: "write this down"
  });
  assert.equal(book.remember, false);
  const names = namesOf(book);
  for (const name of names) {
    assert.equal(SECRET_NAMES.includes(name), false);
  }
  const text = JSON.stringify(book);
  assert.equal(text.includes("write this down"), false);
  assert.equal(text.includes("twelve words"), false);
  assert.equal(text.includes("hide"), false);
});

test("identification plus wallet", () => {
  const book = unityWallet({ identification: "Ada" });
  assert.equal(book.identification, "Ada");
  assert.equal(book.wallet.identification, "Ada");
  assert.deepEqual(book.wallet.holding, []);
});

test("look stays 0 and joule stays null", () => {
  const book = unityWallet({ identification: "Ada", look: 1, joule: 4, key: "abc" });
  assert.equal(book.look, 0);
  assert.equal(book.joule, null);
});

test("GET reflects the identification and an empty holding", async () => {
  const { onRequest } = await import("../functions/api/unity/wallet.js");
  const res = await onRequest({
    request: new Request("https://dualiscapax.test/api/unity/wallet?identification=Ada&look=1&joule=9&key=secret")
  });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  const body = await res.json();
  assert.equal(body.identification, "Ada");
  assert.equal(body.wallet.identification, "Ada");
  assert.deepEqual(body.wallet.holding, []);
  assert.equal(body.look, 0);
  assert.equal(body.joule, null);
  assert.equal(body.remember, false);
  assert.equal(Object.hasOwn(body, "key"), false);
  assert.equal(JSON.stringify(body).includes("secret"), false);
});

test("a write is refused and nothing is stored", async () => {
  const { onRequest } = await import("../functions/api/unity/wallet.js");
  const res = await onRequest({
    request: new Request("https://dualiscapax.test/api/unity/wallet", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identification: "Ada", key: "secret", look: 1, joule: 2 })
    })
  });
  assert.equal(res.status, 405);
  const body = await res.json();
  assert.equal(body.error, "GET");
  assert.equal(JSON.stringify(body).includes("secret"), false);
});
