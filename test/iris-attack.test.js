import assert from "node:assert/strict";
import test from "node:test";
import { RING, attack, invert2, match, publishedResponse, seats, solveJob } from "../js/iris-attack.js";

const LAW = {
  directive: "LOOK",
  refuse: true,
  axioms: { NO_FORCE: true, HOST_SAFE: true, CLEANUP_FIRST: true, TRUTH_OR_NOTHING: true },
  faces: { L1: true }
};

test("the ring rotates every free dreamer and the next turn leads", () => {
  assert.deepEqual(RING, ["Llama", "Mistral", "Gemma", "Phi", "Qwen", "DeepSeek", "Falcon", "OLMo"]);
  assert.deepEqual(seats(0), RING);
  assert.equal(seats(3)[0], "Phi");
  assert.equal(seats(3)[7], "Gemma");
  assert.equal(new Set(seats(5)).size, 8);
  assert.equal(seats(-1)[0], "OLMo");
});

test("an empty attack names the method and books nothing", () => {
  const hit = attack({ turn: 0, seeds: [], text: "what is your method of attack" });
  assert.equal(hit.onDuty, "Llama");
  assert.equal(hit.books.length, 0);
  assert.equal(hit.solved.length, 0);
  assert.equal(hit.answer.length, 0);
  assert.match(hit.spoken, /hybrid/);
  assert.match(hit.spoken, /only seed/);
  assert.match(hit.spoken, /engine solves/);
  assert.match(hit.spoken, /book nothing/);
  assert.match(hit.spoken, /Mistral/);
  assert.match(hit.spoken, /OLMo/);
});

test("the published response does not book a dream", async () => {
  const res = publishedResponse();
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.method, "hybrid");
  assert.equal(body.onDuty, "Llama");
  assert.equal(body.books.length, 0);
  assert.match(body.spoken, /book nothing/);
});

test("a high probability that will not invert is not the answer", () => {
  const hit = attack({
    turn: 1,
    seeds: [{ dreamer: "Mistral", idea: "singular", p: 1, matrix: [1, 0, 0, 0] }]
  });
  assert.equal(hit.onDuty, "Mistral");
  assert.equal(hit.solved.length, 0);
  assert.equal(hit.books[0].spread, 1);
  assert.match(hit.spoken, /do not take the dream/);
  assert.equal(invert2([1, 0, 0, 1]).join(), "1,0,0,1");
  assert.equal(invert2([1, 0, 0, 0]), null);
});

test("she books the engine when a shy probability actually solves", () => {
  const hit = attack({
    turn: 0,
    seeds: [
      { dreamer: "Llama", idea: "loud miss", p: 1, matrix: [1, 0, 0, 0] },
      { dreamer: "Gemma", idea: "quiet invert", p: 0, matrix: [1, 0, 0, 1] }
    ]
  });
  assert.equal(hit.solved.length, 1);
  assert.equal(hit.solved[0].dreamer, "Gemma");
  assert.equal(hit.solved[0].spread, -1);
  assert.deepEqual(hit.answer[0].inverse, [1, 0, 0, 1]);
  assert.match(hit.spoken, /solved the seed from Gemma/);
  assert.match(hit.spoken, /Llama priced a miss higher/);
  assert.doesNotMatch(hit.spoken, /loud miss/);
});

test("a law job solves and a veto does not", () => {
  assert.equal(solveJob(LAW).status, "INDEXED");
  const veto = attack({
    turn: 2,
    seeds: [{ dreamer: "Gemma", idea: "break the floor", p: 0.5, job: { directive: "LOOK", refuse: true, axioms: { NO_FORCE: false } } }]
  });
  assert.equal(veto.solved.length, 0);
  assert.equal(veto.books[0].spread, 0.5);
  const held = attack({
    turn: 2,
    seeds: [{ dreamer: "Gemma", idea: "hold the floor", p: 0.5, job: LAW }]
  });
  assert.equal(held.solved[0].solution.law.status, "INDEXED");
  assert.equal(held.solved[0].spread, -0.5);
});

test("a matrix and a law job both have to pass", () => {
  const hit = attack({
    turn: 0,
    seeds: [{
      dreamer: "Llama",
      idea: "split",
      p: 1,
      matrix: [1, 0, 0, 1],
      job: { directive: "LOOK", refuse: true, axioms: { HOST_SAFE: false } }
    }]
  });
  assert.equal(hit.solved.length, 0);
  assert.equal(hit.books[0].spread, 1);
});

test("a dreamer off the ring and a bad measure are refused", () => {
  const hit = attack({
    turn: 0,
    seeds: [
      { dreamer: "Claude", idea: "paid", p: 1, matrix: [1, 0, 0, 1] },
      { dreamer: "Phi", idea: "loose", p: 2, matrix: [1, 0, 0, 1] }
    ]
  });
  assert.equal(hit.books.length, 0);
  assert.ok(hit.refused.includes("Claude"));
  assert.ok(hit.refused.includes("Phi"));
});

test("prose with no engine input does not solve", () => {
  const hit = attack({
    turn: 4,
    seeds: [{ dreamer: "Qwen", idea: "maybe later", p: 0.5 }]
  });
  assert.equal(hit.onDuty, "Qwen");
  assert.equal(hit.solved.length, 0);
  assert.equal(hit.books[0].solution, null);
});

test("the attack question matches and a lookup does not", () => {
  assert.equal(match("what is your method of attack"), true);
  assert.equal(match("tell me about the dreamers"), true);
  assert.equal(match("how does self-arbitrage work"), true);
  assert.equal(match("who is the prime minister of canada"), false);
});
