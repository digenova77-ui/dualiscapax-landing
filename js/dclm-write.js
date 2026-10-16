export const LAWS = Object.freeze([
  "NO_FORCE",
  "HOST_SAFE",
  "CLEANUP_FIRST",
  "TRUTH_OR_NOTHING"
]);

export const AUTHORITY = "DCLM";

function text(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 240) : "";
}

function taskOf(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  return input;
}

function nameOf(task) {
  if (!task) return "";
  return text(task.id) || text(task.name) || text(task.what);
}

function whatOf(task) {
  if (!task) return "";
  return text(task.what) || nameOf(task);
}

function axiomsOf(task) {
  if (!task) return {};
  const src = task.axioms && typeof task.axioms === "object" && !Array.isArray(task.axioms)
    ? task.axioms
    : task.laws;
  if (!src || typeof src !== "object" || Array.isArray(src)) return {};
  return src;
}

function skippedOf(task) {
  if (!task || !Array.isArray(task.skipped)) return [];
  return LAWS.filter(function (law) { return task.skipped.includes(law); });
}

function lawReason(axioms, skip) {
  const blind = new Set(skip);
  for (let i = 0; i < LAWS.length; i++) {
    const law = LAWS[i];
    if (blind.has(law)) continue;
    if (axioms[law] === false) return "VETO";
    if (axioms[law] !== true) return "MISSING " + law;
  }
  return "";
}

function pipe(name, ok, reason, skipped) {
  const out = { pipe: name, ok: ok, reason: reason };
  if (skipped.length) out.skipped = skipped;
  return out;
}

export function authorityOf(input) {
  const task = taskOf(input);
  if (!nameOf(task)) return { authority: AUTHORITY, ok: false, reason: "EMPTY" };
  if (task.veto === true) return { authority: AUTHORITY, ok: false, reason: "VETO" };
  const reason = lawReason(axiomsOf(task), []);
  if (reason) return { authority: AUTHORITY, ok: false, reason: reason };
  return { authority: AUTHORITY, ok: true, reason: "HOLD" };
}

export function writePipe(input) {
  const task = taskOf(input);
  const skipped = skippedOf(task);
  if (!nameOf(task)) return pipe("write", false, "EMPTY", skipped);
  if (task.veto === true) return pipe("write", false, "VETO", skipped);
  const reason = lawReason(axiomsOf(task), skipped);
  if (reason) return pipe("write", false, reason, skipped);
  return pipe("write", true, skipped.length ? "UNCHECKED" : "HOLD", skipped);
}

export function auditPipe(input) {
  const task = taskOf(input);
  const skipped = skippedOf(task);
  if (!nameOf(task)) return pipe("audit", false, "EMPTY", []);
  if (skipped.length) return pipe("audit", false, "SKIPPED " + skipped.join(","), []);
  if (task.veto === true) return pipe("audit", false, "VETO", []);
  const reason = lawReason(axiomsOf(task), []);
  if (reason) return pipe("audit", false, reason, []);
  return pipe("audit", true, "HOLD", []);
}

export function run(input) {
  const task = taskOf(input);
  const write = writePipe(task);
  const audit = auditPipe(task);
  const gate = authorityOf(task);
  const agreed = write.ok === audit.ok;
  const admitted = agreed && write.ok === true && gate.ok === true;
  let reason = "ADMIT";
  if (!admitted) {
    if (!gate.ok) reason = gate.reason;
    else if (!agreed) reason = audit.ok ? write.reason : audit.reason;
    else reason = write.reason;
  }
  const name = nameOf(task);
  return {
    task: name,
    write: write,
    audit: audit,
    admitted: admitted,
    reason: reason,
    authority: AUTHORITY,
    written: admitted ? { task: name, what: whatOf(task) } : null,
    look: 0,
    joule: null
  };
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*"
    }
  });
}

export async function handleWrite(request) {
  const method = request && request.method;
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "Content-Type",
        "access-control-max-age": "86400"
      }
    });
  }
  if (method === "GET") return json(200, run(null));
  if (method === "POST") {
    let task = null;
    try {
      task = await request.json();
    } catch (err) {
      task = null;
    }
    return json(200, run(task));
  }
  return json(405, run(null));
}
