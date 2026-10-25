import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { create, step, links, push } = createRequire(import.meta.url)("../js/field.js");

test("field creates the requested count inside the bounds", () => {
  const particles = create(12, 200, 100);
  assert.equal(particles.length, 12);
  for (const p of particles) {
    assert.ok(p.x >= 0 && p.x <= 200);
    assert.ok(p.y >= 0 && p.y <= 100);
  }
});

test("field keeps particles inside the bounds after a step", () => {
  const particles = create(8, 100, 100);
  step(particles, 100, 100, null);
  for (const p of particles) {
    assert.ok(p.x >= 0 && p.x <= 100);
    assert.ok(p.y >= 0 && p.y <= 100);
  }
});

test("pointer pushes a nearby particle away", () => {
  const particles = [{ x: 50, y: 50, vx: 0, vy: 0 }];
  step(particles, 200, 200, { x: 40, y: 50 });
  assert.ok(particles[0].vx > 0);
});

test("links only pairs particles within range", () => {
  const particles = [
    { x: 0, y: 0, vx: 0, vy: 0 },
    { x: 10, y: 0, vx: 0, vy: 0 },
    { x: 200, y: 200, vx: 0, vy: 0 },
  ];
  const pairs = links(particles, 20);
  assert.deepEqual(pairs, [[0, 1]]);
});

test("push adds a particle at the click and caps the field", () => {
  const particles = create(140, 100, 100);
  push(particles, 20, 30, 100, 100);
  assert.equal(particles.length, 140);
  assert.equal(particles[particles.length - 1].x, 20);
  assert.equal(particles[particles.length - 1].y, 30);
});
