import { parseRepositoryInspectRequest } from "./repository-inspector";
import { sha256Hex } from "./digest";

type InspectorEnv = {
  IRIS_AGENT_GATE_TOKEN?: string;
  IRIS_AGENT_ALLOWED_ORIGIN?: string;
  GITHUB_READ_TOKEN?: string;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

export async function inspectRepositoryFile(request: Request, env: InspectorEnv): Promise<Response> {
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
    const binary = atob(file.content.replace(/\s/g, ""));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    if (bytes.byteLength > 12000) return json({ error: "unsupported_or_oversized_file", status: "not_verified" }, 413);
    const sha256 = await sha256Hex(bytes);
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

