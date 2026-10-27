import { describe, expect, it } from "vitest";
import { parsePlanRequest } from "./index";

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
