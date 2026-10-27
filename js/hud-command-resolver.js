/**
 * DualisCapax HUD intent resolver — deterministic proposal layer.
 *
 * This module classifies language into a proposal only. It never executes
 * operations, grants authority, calls providers, or treats a phrase as consent.
 * Trinity remains the sole authorization gate for protected actions.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DualisHudIntent = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const COMMANDS = [
    { id: "board.create", triggers: ["create", "make me", "build", "generate", "design", "draw"], risk: "low", capability: "scene.write", confirmation: "preview" },
    { id: "board.explore", triggers: ["show me", "explore", "find", "inspect", "look at", "where is"], risk: "low", capability: "scene.read", confirmation: "none" },
    { id: "board.edit", triggers: ["change", "move", "resize", "redraw", "replace", "make it bigger", "delete"], risk: "medium", capability: "scene.write", confirmation: "preview" },
    { id: "board.solve", triggers: ["how do we", "why", "solve", "analyze", "compare", "optimize"], risk: "low", capability: "reasoning", confirmation: "none" },
    { id: "board.simulate", triggers: ["simulate", "test a scenario", "run a scenario", "predict", "what if"], risk: "medium", capability: "simulation", confirmation: "preview" },
    { id: "board.save", triggers: ["save", "save as", "make a version"], risk: "low", capability: "workspace.persist", confirmation: "none" },
    { id: "board.undo", triggers: ["undo", "undo that", "go back"], risk: "low", capability: "scene.history", confirmation: "none" },
    { id: "board.redo", triggers: ["redo", "redo that"], risk: "low", capability: "scene.history", confirmation: "none" },
    { id: "hud.help", triggers: ["help", "show commands", "what can you do"], risk: "low", capability: "hud.help", confirmation: "none" },
    { id: "wallet.prepare_transfer", triggers: ["send money", "transfer funds", "pay"], risk: "high", capability: "wallet.transfer", confirmation: "explicit", protected: true }
  ];

  function normalize(value) {
    return String(value == null ? "" : value)
      .normalize("NFKC")
      .toLocaleLowerCase("en")
      .replace(/[’']/g, "'")
      .replace(/[^\\p{L}\\p{N}]+/gu, " ")
      .trim()
      .replace(/\\s+/g, " ");
  }

  function hasPhrase(text, phrase) {
    const p = normalize(phrase);
    return (" " + text + " ").includes(" " + p + " ");
  }

  function resolve(input, options) {
    const opts = options || {};
    const text = normalize(input);
    if (!text) return { status: "clarify", reason: "empty_input", candidates: [] };

    const matches = [];
    for (const command of COMMANDS) {
      const hits = command.triggers.filter((trigger) => hasPhrase(text, trigger));
      if (hits.length) {
        const longest = hits.reduce((n, hit) => Math.max(n, normalize(hit).length), 0);
        matches.push({ command, hits, score: longest });
      }
    }

    if (!matches.length) {
      return { status: "unsupported", reason: "no_registered_intent", normalized_input: text, candidates: [] };
    }

    matches.sort((a, b) => b.score - a.score);
    const top = matches.filter((m) => m.score === matches[0].score);
    if (top.length > 1) {
      return {
        status: "clarify",
        reason: "ambiguous_intent",
        normalized_input: text,
        candidates: top.map((m) => m.command.id)
      };
    }

    const chosen = matches[0].command;
    const target = typeof opts.target === "string" && opts.target.trim() ? opts.target.trim() : null;
    const needsTarget = ["board.edit", "board.explore", "board.simulate"].includes(chosen.id);
    if (needsTarget && !target && !/\\b(this|that|selected|current|all)\\b/.test(text)) {
      return {
        status: "clarify",
        reason: "target_required",
        intent: chosen.id,
        normalized_input: text,
        candidates: [chosen.id]
      };
    }

    return {
      status: "proposal",
      intent: chosen.id,
      normalized_input: text,
      target,
      risk: chosen.risk,
      capability: chosen.capability,
      confirmation: chosen.confirmation,
      protected: Boolean(chosen.protected),
      matched_triggers: matches[0].hits,
      execute: false,
      authority: "trinity_server_only",
      notes: [
        "Intent classification is not authorization.",
        "No operation was executed.",
        "Validate capability, principal, request ID, input digest, policy, and budget server-side before protected execution."
      ]
    };
  }

  return Object.freeze({
    version: "dualis.hud-intent-resolver.v1",
    commands: Object.freeze(COMMANDS.map((c) => Object.freeze({ ...c, triggers: Object.freeze(c.triggers.slice()) }))),
    normalize,
    resolve
  });
});
