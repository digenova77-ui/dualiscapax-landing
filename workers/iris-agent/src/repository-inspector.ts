export type RepositoryInspectRequest = { repository: string; path: string; ref?: string };

const ALLOWED_REPOSITORIES = new Set([
  "digenova77-ui/dualiscapax-landing",
  "digenova77-ui/dualiscapax-deploy",
  "digenova77-ui/dccp-world",
  "digenova77-ui/dualiscapax-hud",
  "digenova77-ui/dualiscapax-law-core",
  "digenova77-ui/coin-repo",
  "digenova77-ui/abc-agency",
  "digenova77-ui/efuse-unity",
]);

const BLOCKED_PATH_PARTS = [".env", "secret", "credential", "private", "id_rsa", ".pem", ".key", "token", "password", "keystore"];
const ALLOWED_TEXT_EXTENSIONS = new Set([".md", ".mdx", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".yaml", ".yml", ".toml", ".html", ".css", ".sh", ".txt"]);

export function parseRepositoryInspectRequest(value: unknown): RepositoryInspectRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (typeof input.repository !== "string" || !ALLOWED_REPOSITORIES.has(input.repository)) return null;
  if (typeof input.path !== "string") return null;
  const path = input.path.trim();
  if (!path || path.length > 240 || path.startsWith("/") || path.includes("\\") ||
      path.split("/").some((part) => !part || part === "." || part === "..") ||
      BLOCKED_PATH_PARTS.some((part) => path.toLowerCase().includes(part)) ||
      ![...ALLOWED_TEXT_EXTENSIONS].some((ext) => path.toLowerCase().endsWith(ext))) return null;
  let ref: string | undefined;
  if (input.ref !== undefined) {
    if (typeof input.ref !== "string" || !input.ref.trim() || input.ref.length > 120 ||
        input.ref.startsWith("-") || input.ref.includes("..")) return null;
    ref = input.ref.trim();
  }
  return { repository: input.repository, path, ...(ref ? { ref } : {}) };
}
