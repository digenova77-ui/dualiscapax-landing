/**
 * Strict origin validator for the isolated Iris staging Worker.
 * Accepts only https://iris-runtime-staging.<account-subdomain>.workers.dev/
 * with no credentials, non-default port, path, query, or fragment.
 */
import { pathToFileURL } from "node:url";

export function isValidIrisStagingUrl(value) {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value) return false;
  try {
    const url = new URL(value);
    const hostPattern = /^iris-runtime-staging\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.workers\.dev$/;
    return url.protocol === "https:" &&
      hostPattern.test(url.hostname) &&
      url.username === "" &&
      url.password === "" &&
      url.port === "" &&
      url.pathname === "/" &&
      url.search === "" &&
      url.hash === "";
  } catch {
    return false;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!isValidIrisStagingUrl(process.argv[2])) {
    console.error("Expected the HTTPS origin of iris-runtime-staging.<account-subdomain>.workers.dev with no path, query, fragment, or credentials.");
    process.exitCode = 1;
  }
}
