const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("ai/app.html", "utf8");
assert.match(html, /id="text-form"/, "Iris must expose a typed-message fallback");
assert.match(html, /id="status"[^>]*role="status"/, "Iris must expose visible status to assistive technology");
assert.match(html, /aria-label="Camera preview"/);
assert.match(html, /Visual understanding is not connected yet/);
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))
  .map((match) => match[1])
  .filter((script) => script.trim());
assert.ok(scripts.length > 0, "Iris page must contain its controller script");
assert.doesNotThrow(() => new Function(scripts[scripts.length - 1]), "Iris inline controller must parse");
console.log("Iris UI source checks passed");
