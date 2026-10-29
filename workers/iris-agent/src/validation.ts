export type PlanRequest = { goal: string; constraints?: string[] };

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
