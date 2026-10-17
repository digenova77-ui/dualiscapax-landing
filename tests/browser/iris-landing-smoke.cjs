const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { test, before, after } = require("node:test");
const { chromium } = require("playwright");

const ROOT = path.resolve(process.cwd());
let server;
let browser;
let origin;

before(async () => {
  server = http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
    catch (_) { res.writeHead(400).end("bad path"); return; }
    const filePath = path.resolve(ROOT, "." + pathname);
    if (!filePath.startsWith(ROOT + path.sep)) { res.writeHead(403).end("forbidden"); return; }
    fs.readFile(filePath, (error, bytes) => {
      if (error) { res.writeHead(404).end("not found"); return; }
      const ext = path.extname(filePath).toLowerCase();
      const types = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".svg": "image/svg+xml",
        ".json": "application/json; charset=utf-8",
        ".webmanifest": "application/manifest+json"
      };
      res.writeHead(200, { "content-type": types[ext] || "application/octet-stream" });
      res.end(bytes);
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = "http://127.0.0.1:" + server.address().port;
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

test("landing Iris opens with usable text controls and no automatic external request", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const externalRequests = [];
  const pageErrors = [];
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (url.startsWith(origin + "/")) return route.continue();
    externalRequests.push(url);
    return route.abort();
  });
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  try {
    await page.goto(origin + "/ai/app.html", { waitUntil: "domcontentloaded" });
    assert.match(await page.title(), /Iris/);
    await page.locator("#text-input").waitFor({ state: "visible" });
    await page.locator("#text-form button[type=submit]").waitFor({ state: "visible" });
    assert.equal(externalRequests.length, 0, "initial page load must not send user data externally");
    assert.deepEqual(pageErrors, [], "page should not throw uncaught JavaScript errors on load");
  } finally {
    await context.close();
  }
});

test("local document is read in-browser and never falls through to public search when no answer engine is configured", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const externalRequests = [];
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (url.startsWith(origin + "/")) return route.continue();
    externalRequests.push(url);
    return route.abort();
  });
  try {
    await page.goto(origin + "/ai/app.html", { waitUntil: "domcontentloaded" });
    const privateMarker = "LOCAL_ONLY_MARKER_91BD";
    await page.locator("#irisLocalFile").setInputFiles({
      name: "private-notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Local note: " + privateMarker)
    });
    await page.waitForFunction(() => document.querySelector("#status").textContent.includes("Local text loaded"));
    assert.equal(await page.evaluate(() => window.IrisFile.snapshot().loaded), true);
    assert.equal(externalRequests.length, 0, "choosing a local file alone must not send it externally");

    await page.locator("#text-input").fill("Summarize my notes");
    await page.locator("#text-form button[type=submit]").click();
    await page.waitForFunction(() => document.querySelector("#status").textContent.includes("Unavailable"));
    assert.match(await page.locator("#caption").innerText(), /I read the text locally/i);
    assert.equal(externalRequests.length, 0, "without a configured answer engine, document content must not fall through to public search");
    assert.equal(await page.evaluate(() => window.IrisSession.state()), "idle", "failed lookup must recover the session to idle");

    await page.locator("#hang").click();
    assert.equal(await page.evaluate(() => window.IrisFile.snapshot().loaded), false, "End must clear the local document");
    assert.match(await page.locator("#status").innerText(), /Session ended/);
  } finally {
    await context.close();
  }
});
