import { Agent, getAgentByName, routeAgentRequest } from "agents";

type PlanRequest = { goal: string; constraints?: string[] };
type PlanResult = { id: string; status: "proposed"; createdAt: string; plan: string };
type IrisState = { lastPlanId?: string; lastPlanStatus: "idle" | "proposed"; lastPlanAt?: string };
type Env = {
  AI: Ai;
  IrisAgent: DurableObjectNamespace<IrisAgent>;
  IRIS_AGENT_GATE_TOKEN?: string;
  IRIS_AGENT_ALLOWED_ORIGIN?: string;
};

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

export function parsePlanRequest(value: unknown): PlanRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (typeof input.goal !== "string") return null;
  const goal = input.goal.trim();
  if (goal.length < 8 || goal.length > 4000) return null;
  let constraints: string[] | undefined;
  if (input.constraints !== undefined) {
    if (!Array.isArray(input.constraints) || input.constraints.length > 20) return null;
    if (!input.constraints.every((item) => typeof item === "string" && item.length <= 500)) return null;
    constraints = input.constraints.map((item) => item.trim()).filter(Boolean);
  }
  return { goal, ...(constraints ? { constraints } : {}) };
}

export class IrisAgent extends Agent<Env, IrisState> {
  initialState: IrisState = { lastPlanStatus: "idle" };

  async createPlan(input: PlanRequest): Promise<PlanResult> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const constraints = input.constraints?.length
      ? input.constraints.map((item) => `- ${item}`).join("\n")
      : "- Do not change production systems.\n- Distinguish verified facts from assumptions.\n- Require explicit authorization before side effects.";
    const response = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        {
          role: "system",
          content: "You are Iris Studio's engineering planner. Produce a concise, structured, read-only engineering plan with objective, evidence to inspect, ordered steps, acceptance criteria, tests, risks, and authorization gates. You may propose work only. You cannot authorize, execute, deploy, modify production, or claim tests passed. Mark unknown facts as unknown.",
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
    if (!plan.trim()) throw new Error("Workers AI returned no plan text.");
    this.setState({ lastPlanId: id, lastPlanStatus: "proposed", lastPlanAt: createdAt });
    return { id, status: "proposed", createdAt, plan: plan.trim() };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ service: "iris-agent-staging", status: "ready", mode: "planning-only", executionEnabled: false });
    }
    if (url.pathname === "/v1/plan" && request.method === "POST") {
      const expectedOrigin = env.IRIS_AGENT_ALLOWED_ORIGIN;
      const origin = request.headers.get("origin");
      if (origin && expectedOrigin && origin !== expectedOrigin) return json({ error: "origin_denied" }, 403);
      const expectedToken = env.IRIS_AGENT_GATE_TOKEN;
      const authorization = request.headers.get("authorization") ?? "";
      if (!expectedToken || authorization !== `Bearer ${expectedToken}`) return json({ error: "unauthorized" }, 401);
      if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) return json({ error: "content_type_must_be_json" }, 415);
      const length = Number(request.headers.get("content-length") ?? "0");
      if (length > 12_000) return json({ error: "request_too_large" }, 413);
      let raw: unknown;
      try { raw = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
      const input = parsePlanRequest(raw);
      if (!input) return json({ error: "invalid_plan_request" }, 400);
      try {
        const agent = getAgentByName(env.IrisAgent, "staging-planner");
        const result = await agent.createPlan(input);
        return json(result, 200);
      } catch {
        return json({ error: "planning_failed", status: "not_verified" }, 502);
      }
    }
    return (await routeAgentRequest(request, env)) ?? json({ error: "not_found" }, 404);
  },
} satisfies ExportedHandler<Env>;
