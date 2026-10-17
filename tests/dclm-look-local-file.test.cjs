const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function load({ byok } = {}) {
  const calls = [];
  const window = {};
  if (byok) window.DCByok = byok;
  const document = {
    createElement: () => ({}),
    head: { appendChild: (script) => { if (script.onerror) script.onerror(); } }
  };
  const context = {
    window, document, Promise, String, encodeURIComponent, AbortController, setTimeout, clearTimeout,
    fetch: async (url) => { calls.push(String(url)); throw new Error("Unexpected network request"); }
  };
  vm.runInNewContext(fs.readFileSync("ai/dclm-look.js", "utf8"), context, { filename: "dclm-look.js" });
  return { look: window.DCLMLook, calls };
}

(async function () {
  const localText = "local file content: private phrase";
  const noEngine = load();
  const denied = await noEngine.look.run("Summarize this: " + localText, null, { localDocument: true });
  assert.equal(denied.lane, "ERROR");
  assert.match(denied.spoken, /not sent to public search/i);
  assert.equal(noEngine.calls.length, 0, "local document contents must not fall through to Wikipedia or Wikidata");

  let sent = "";
  const withEngine = load({ byok: {
    present: () => true,
    chat: async (messages) => {
      sent = messages[1].content;
      return { ok: true, content: "I found the requested detail." };
    }
  } });
  const result = await withEngine.look.run("Summarize this: " + localText, null, { localDocument: true });
  assert.equal(result.grant, "XAI");
  assert.match(sent, /local file content: private phrase/);
  assert.equal(withEngine.calls.length, 0, "configured answer engine path does not use public search");
  console.log("DCLMLook local-file privacy tests: 6 assertions passed");
})().catch((error) => { console.error(error); process.exitCode = 1; });
