import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const PORT = 18786;
const BASE = `http://127.0.0.1:${PORT}`;
const child = spawn("node", ["iris-voice-server.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PORT), LOCAL_VERIFIER: "0", XAI_API_KEY: "test-key" },
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
child.stdout.on("data", d => { logs += d.toString(); });
child.stderr.on("data", d => { logs += d.toString(); });

async function request(path, options = {}) {
  const response = await fetch(BASE + path, options);
  return { status: response.status, body: await response.json() };
}

let ready = false;
try {
  for (let i = 0; i < 40; i++) {
    if (child.exitCode !== null) throw new Error(`server exited early: ${logs}`);
    try {
      const response = await fetch(BASE + "/health");
      if (response.ok) { ready = true; break; }
    } catch {}
    await delay(100);
  }
  if (!ready) throw new Error(`server did not become ready: ${logs}`);

  const status = await request("/iris/status", { headers: { cookie: "session=pretend" } });
  if (status.body.available !== false || status.body.reason !== "verifier-not-wired") {
    throw new Error("production status must fail closed without canonical verifier");
  }

  const turn = await request("/sandbox/iris/turn", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: "session=pretend" },
    body: JSON.stringify({ text: "hello" }),
  });
  if (turn.status !== 401 || turn.body.available !== false || turn.body.authority !== "NONE") {
    throw new Error("production turn must reject an unverified cookie");
  }

  console.log("PASS production status fails closed without verifier");
  console.log("PASS fake session cookie cannot invoke the provider path");
} finally {
  child.kill("SIGTERM");
  await delay(150);
}
