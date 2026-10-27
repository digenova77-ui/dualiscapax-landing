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
