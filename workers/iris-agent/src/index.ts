import { Agent, getAgentByName } from "agents";

import { parsePlanRequest } from "./validation";
import { parseRepositoryInspectRequest } from "./repository-inspector";
type PlanResult = { id: string; status: "proposed"; createdAt: string; plan: string };
type IrisState = { lastPlanId?: string; lastPlanStatus: "idle" | "proposed"; lastPlanAt?: string };
type Env = {
  AI: Ai;
  IrisAgent: DurableObjectNamespace<IrisAgent>;
  IRIS_AGENT_GATE_TOKEN?: string;
  IRIS_AGENT_ALLOWED_ORIGIN?: string;
  GITHUB_READ_TOKEN?: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export class IrisAgent extends Agent<Env, IrisState> {
  initialState: IrisState = { lastPlanStatus: "idle" };

  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/v1/plan" || request.method !== "POST") return json({ error: "not_found" }, 404);

    const expectedOrigin = this.env.IRIS_AGENT_ALLOWED_ORIGIN;
    if (!expectedOrigin) return json({ error: "origin_policy_not_configured" }, 503);
    const origin = request.headers.get("origin");
    if (origin && origin !== expectedOrigin) return json({ error: "origin_denied" }, 403);
    const expectedToken = this.env.IRIS_AGENT_GATE_TOKEN;
    const authorization = request.headers.get("authorization") ?? "";
    if (!expectedToken || authorization !== `Bearer ${expectedToken}`) return json({ error: "unauthorized" }, 401);
    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) return json({ error: "content_type_must_be_json" }, 415);
    const length = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(length) && length > 12_000) return json({ error: "request_too_large" }, 413);

    let raw: unknown;
    try {
      const body = await request.text();
      if (new TextEncoder().encode(body).byteLength > 12_000) return json({ error: "request_too_large" }, 413);
      raw = JSON.parse(body);
    } catch { return json({ error: "invalid_json" }, 400); }
    const input = parsePlanRequest(raw);
    if (!input) return json({ error: "invalid_plan_request" }, 400);

    try {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const constraints = input.constraints?.length
        ? input.constraints.map((item) => `- ${item}`).join("\n")
        : "- Do not change production systems.\n- Distinguish verified facts from assumptions.\n- Require explicit authorization before side effects.";
      const response = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          {
            role: "system",
            content: "You are Iris Studio's engineering planner for DualisCapax. Map each plan to one or more strategic pillars: (1) Residual Law Finance, (2) Hybrid Bicameral Autonomous AI, (3) Edge Technologies & Frontier Intelligence, (4) Research and Engineering Architecture. Explain how the work connects to the integrated platform and its Color → Cut → Clarity → Diamond architecture where relevant. Produce a concise, structured, read-only engineering plan with objective, pillar alignment, evidence to inspect, ordered steps, acceptance criteria, tests, risks, and authorization gates. Distinguish proposed, implemented, tested, deployed, and live-verified states. You may propose work only. You cannot authorize, execute, deploy, modify production, or claim tests passed. Mark unknown facts as unknown.",
          },
          {
            role: "user",
            content: `Goal:\n${input.goal}\n\nConstraints:\n${constraints}\n\nReturn a plan, not implementation claims.`,
          },
        ],
        max_tokens: 900,
      });
      const plan = typeof response === "object" && response !== null && "response" in response
        ? String((response as { response: unknown }).response ?? "")
        : "";
      if (!plan.trim()) return json({ error: "empty_model_response", status: "not_verified" }, 502);
      this.setState({ lastPlanId: id, lastPlanStatus: "proposed", lastPlanAt: createdAt });
      const result: PlanResult = { id, status: "proposed", createdAt, plan: plan.trim() };
      return json(result);
    } catch {
      // Deliberately omit provider internals, credentials, and request bodies from errors.
      return json({ error: "planning_failed", status: "not_verified" }, 502);
    }
  }
}


async function inspectRepositoryFile(request: Request, env: Env): Promise<Response> {
  const expectedOrigin = env.IRIS_AGENT_ALLOWED_ORIGIN;
  if (!expectedOrigin) return json({ error: "origin_policy_not_configured" }, 503);
  const origin = request.headers.get("origin");
  if (origin && origin !== expectedOrigin) return json({ error: "origin_denied" }, 403);
  const gate = env.IRIS_AGENT_GATE_TOKEN;
  if (!gate || request.headers.get("authorization") !== `Bearer ${gate}`) return json({ error: "unauthorized" }, 401);
  const token = env.GITHUB_READ_TOKEN;
  if (!token) return json({ error: "repository_inspector_not_configured" }, 503);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) return json({ error: "content_type_must_be_json" }, 415);
  let raw: unknown;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > 4000) return json({ error: "request_too_large" }, 413);
    raw = JSON.parse(body);
  } catch { return json({ error: "invalid_json" }, 400); }
  const input = parseRepositoryInspectRequest(raw);
  if (!input) return json({ error: "invalid_inspection_request" }, 400);
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "DualisCapax-Iris-ReadOnly-Inspector",
  };
  const api = "https://api.github.com/repos/" + input.repository;
  try {
    const commitResponse = await fetch(api + "/commits/" + encodeURIComponent(input.ref ?? "main"), {
      method: "GET", headers, redirect: "error",
    });
    if (!commitResponse.ok) return json({ error: "revision_lookup_failed", status: "not_verified" }, 502);
    const commitData = await commitResponse.json() as { sha?: string };
    if (!commitData.sha || !/^[a-f0-9]{40}$/i.test(commitData.sha)) return json({ error: "revision_unresolved", status: "not_verified" }, 502);
    const path = input.path.split("/").map(encodeURIComponent).join("/");
    const fileResponse = await fetch(api + "/contents/" + path + "?ref=" + encodeURIComponent(commitData.sha), {
      method: "GET", headers, redirect: "error",
    });
    if (!fileResponse.ok) return json({ error: fileResponse.status === 404 ? "file_not_found" : "file_read_failed", status: "not_verified" }, fileResponse.status === 404 ? 404 : 502);
    const file = await fileResponse.json() as { type?: string; path?: string; sha?: string; size?: number; encoding?: string; content?: string; html_url?: string };
    if (file.type !== "file" || !file.content || file.encoding !== "base64" || (file.size ?? 0) > 12000) return json({ error: "unsupported_or_oversized_file", status: "not_verified" }, 413);
    const binary = atob(file.content.replace(/\\s/g, ""));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    if (bytes.byteLength > 12000) return json({ error: "unsupported_or_oversized_file", status: "not_verified" }, 413);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const sha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    return json({
      status: "read-only-observation",
      observedAt: new Date().toISOString(),
      repository: input.repository,
      path: file.path,
      requestedRef: input.ref ?? "main",
      resolvedCommitSha: commitData.sha,
      blobSha: file.sha,
      sha256,
      sizeBytes: bytes.byteLength,
      sourceUrl: file.html_url,
      content: new TextDecoder().decode(bytes),
      limitations: ["Observation only; not proof of runtime behavior, test success, authorization, or deployment.", "No repository write or command execution occurred."],
    });
  } catch {
    return json({ error: "repository_inspection_failed", status: "not_verified" }, 502);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ service: "iris-agent-staging", status: "ready", mode: "planning-only", executionEnabled: false });
    }
    if (url.pathname === "/v1/repository/inspect" && request.method === "POST") return inspectRepositoryFile(request, env);
    if (url.pathname === "/v1/plan" && request.method === "POST") {
      const agent = await getAgentByName(env.IrisAgent, "staging-planner");
      return agent.fetch(request);
    }
    return json({ error: "not_found" }, 404);
  },
} satisfies ExportedHandler<Env>;
