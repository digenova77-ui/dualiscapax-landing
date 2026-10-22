import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const PORT = 18787;
const BASE = `http://127.0.0.1:${PORT}`;

const child = spawn("node", ["iris-voice-server.mjs"], {
  cwd: "/workspace/artifacts",
  env: {
    ...process.env,
    PORT: String(PORT),
    LOCAL_VERIFIER: "1",
    XAI_API_KEY: "test-key",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

child.stdout.on("data", (d) => process.stdout.write(d));
child.stderr.on("data", (d) => process.stderr.write(d));

await delay(800);

async function get(path, headers = {}) {
  const r = await fetch(BASE + path, { headers });
  return { status: r.status, body: await r.json() };
}
async function post(path, body, headers = {}) {
  const r = await fetch(BASE + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json() };
}

let failed = 0;
function check(name, cond) {
  console.log(cond ? "PASS" : "FAIL", name);
  if (!cond) failed++;
}

try {
  const health = await get("/health");
  check("health", health.status === 200 && health.body.ok === true && health.body.localVerifier === true);

  const noSession = await get("/iris/status");
  check("status no session", noSession.body.available === false && noSession.body.reason === "no-session");

  const badTurn = await post("/sandbox/iris/turn", { text: "hi" });
  check("turn rejected", badTurn.status === 401 && badTurn.body.authority === "NONE");

  const good = await post("/sandbox/iris/turn", { text: "hello" }, { "x-test-session": "valid" });
  check(
    "local success path",
    good.status === 200 && good.body.available === true && good.body.result?.note === "local-mock"
  );
} finally {
  child.kill("SIGTERM");
  await delay(200);
}

console.log(failed === 0 ? "ALL PASSED" : `${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
