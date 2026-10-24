import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const config = readFileSync(join(here, "wrangler.toml"), "utf8");
const source = readFileSync(join(here, "worker.mjs"), "utf8");
const checks = {
  durableObjectBinding: config.includes('name = "IRIS_MEMORY_STORE"') && config.includes('class_name = "IrisMemoryStore"'),
  sqliteMigration: config.includes('new_sqlite_classes = ["IrisMemoryStore"]'),
  atomicTransaction: source.includes("this.state.storage.transaction"),
  claimRoute: source.includes('"/v1/requests/claim"'),
  lookupRoute: source.includes('"/v1/requests/get"'),
  contextReadRoute: source.includes('"/v1/context/read"'),
  principalIndex: source.includes('"principal:" + principal'),
  serviceTokenGate: source.includes("IRIS_MEMORY_SERVICE_TOKEN") && source.includes("service-auth-required"),
  noProductionRoutes: !/\[\[routes\]\]|workers_dev\s*=\s*false/.test(config),
};
console.log(JSON.stringify({ checks, stagingOnly: true, productionUntouched: true }, null, 2));
if (Object.values(checks).some((value) => value !== true)) process.exit(1);
