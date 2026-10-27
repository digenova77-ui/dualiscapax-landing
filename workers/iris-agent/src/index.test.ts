import { describe, expect, it } from "vitest";
import { parsePlanRequest } from "./validation";

describe("parsePlanRequest", () => {
  it("accepts a bounded goal and constraints", () => {
    expect(parsePlanRequest({ goal: "Audit the staging agent bridge", constraints: ["No production changes"] })).toEqual({
      goal: "Audit the staging agent bridge",
      constraints: ["No production changes"],
    });
  });
  it("rejects missing, short, or oversized goals", () => {
    expect(parsePlanRequest({})).toBeNull();
    expect(parsePlanRequest({ goal: "short" })).toBeNull();
    expect(parsePlanRequest({ goal: "x".repeat(4001) })).toBeNull();
  });
  it("rejects malformed or excessive constraints", () => {
    expect(parsePlanRequest({ goal: "Audit the staging agent bridge", constraints: "no" })).toBeNull();
    expect(parsePlanRequest({ goal: "Audit the staging agent bridge", constraints: Array(21).fill("x") })).toBeNull();
    expect(parsePlanRequest({ goal: "Audit the staging agent bridge", constraints: [7] })).toBeNull();
  });
  it("ignores unknown properties rather than executing them", () => {
    expect(parsePlanRequest({ goal: "Audit the staging agent bridge", command: "deploy production" })).toEqual({
      goal: "Audit the staging agent bridge",
    });
  });
});

import { parseRepositoryInspectRequest } from "./repository-inspector";

describe("parseRepositoryInspectRequest", () => {
  it("accepts an allowlisted repository and safe file path", () => {
    expect(parseRepositoryInspectRequest({
      repository: "digenova77-ui/dualiscapax-landing",
      path: "workers/iris-agent/src/index.ts",
      ref: "main",
    })).toEqual({
      repository: "digenova77-ui/dualiscapax-landing",
      path: "workers/iris-agent/src/index.ts",
      ref: "main",
    });
  });
  it("rejects unknown repositories, traversal, and sensitive paths", () => {
    expect(parseRepositoryInspectRequest({ repository: "attacker/evil", path: "README.md" })).toBeNull();
    expect(parseRepositoryInspectRequest({ repository: "digenova77-ui/dualiscapax-landing", path: "../README.md" })).toBeNull();
    expect(parseRepositoryInspectRequest({ repository: "digenova77-ui/dualiscapax-landing", path: ".env.production" })).toBeNull();
    expect(parseRepositoryInspectRequest({ repository: "digenova77-ui/dualiscapax-landing", path: "config/private-key.pem" })).toBeNull();
  });
  it("rejects invalid refs and malformed requests", () => {
    expect(parseRepositoryInspectRequest({ repository: "digenova77-ui/dualiscapax-landing", path: "README.md", ref: "../main" })).toBeNull();
    expect(parseRepositoryInspectRequest(null)).toBeNull();
  });
});

import { sha256Hex } from "./digest";

describe("sha256Hex", () => {
  it("returns the SHA-256 digest of the exact input bytes", async () => {
    const bytes = new TextEncoder().encode("abc");
    await expect(sha256Hex(bytes)).resolves.toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
  it("distinguishes different byte sequences", async () => {
    const encoder = new TextEncoder();
    await expect(sha256Hex(encoder.encode("abc"))).resolves.not.toBe(await sha256Hex(encoder.encode("abd")));
  });
});


import { inspectRepositoryFile } from "./repository-endpoint";

describe("repository inspection endpoint security gates", () => {
  const baseEnv = {
    IRIS_AGENT_ALLOWED_ORIGIN: "https://dualiscapax.com",
    IRIS_AGENT_GATE_TOKEN: "test-gate-token",
    GITHUB_READ_TOKEN: "test-github-read-token",
  };

  function request(headers: Record<string, string> = {}, body = JSON.stringify({
    repository: "digenova77-ui/dualiscapax-landing",
    path: "README.md",
    ref: "main",
  })) {
    return new Request("https://iris-agent-staging.example.workers.dev/v1/repository/inspect", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer test-gate-token", ...headers },
      body,
    });
  }

  async function response(req: Request, env: Record<string, unknown> = baseEnv) {
    return inspectRepositoryFile(req, env as never);
  }

  it("fails closed when the gate token is absent", async () => {
    const res = await response(request(), { ...baseEnv, IRIS_AGENT_GATE_TOKEN: undefined });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("rejects a foreign browser origin before upstream access", async () => {
    const res = await response(request({ origin: "https://attacker.example" }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "origin_denied" });
  });

  it("fails closed when the GitHub read token is not configured", async () => {
    const res = await response(request(), { ...baseEnv, GITHUB_READ_TOKEN: undefined });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "repository_inspector_not_configured" });
  });

  it("rejects non-JSON requests", async () => {
    const res = await response(request({ "content-type": "text/plain" }, "hello"));
    expect(res.status).toBe(415);
    expect(await res.json()).toEqual({ error: "content_type_must_be_json" });
  });

  it("rejects oversized bodies before parsing or upstream access", async () => {
    const res = await response(request({}, "x".repeat(4001)));
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: "request_too_large" });
  });

  it("rejects malformed inspection payloads before upstream access", async () => {
    const res = await response(request({}, JSON.stringify({
      repository: "attacker/evil",
      path: "README.md",
    })));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_inspection_request" });
  });

  it("does not expose the inspector through an unsupported method", async () => {
    const res = await inspectRepositoryFile(new Request("https://iris-agent-staging.example.workers.dev/v1/repository/inspect", {
      method: "GET",
    }), baseEnv as never);
    expect(res.status).toBe(401);
  });
});
