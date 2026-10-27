import { Agent, getAgentByName } from "agents";

import { parsePlanRequest } from "./validation";
import { inspectRepositoryFile } from "./repository-endpoint";
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
