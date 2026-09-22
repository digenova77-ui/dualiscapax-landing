/**
 * Iris speech floor.
 * Vulgar and slang look results are allowed. We did not go hunting for them.
 * We do not invent a nicer dictionary.
 * We do not pull classified or stolen material.
 * We do not help circumvent the law.
 * We do not degrade a named person on request.
 */
(function (w) {
  var VERSION = "iris-policy-2026-09-22";

  function raw(text) {
    return String(text || "");
  }

  function isVulgarOnly(text) {
    return /\b(fuck|shit|damn|ass|bitch|crap|hell|dick|piss|slut|whore)\b/i.test(raw(text));
  }

  function veto(text) {
    var s = raw(text);
    if (/\b(classified|top secret|secret clearance|stolen (docs|documents|files)|leaked cables)\b/i.test(s))
      return { grant: "VETO", code: "SECRETS", spoken: "I will not hunt classified or stolen documents." };
    if (/\b(how to (make a bomb|break in|hack into|launder|counterfeit)|jailbreak this model)\b/i.test(s))
      return { grant: "VETO", code: "LAW", spoken: "I will not help circumvent the law." };
    if (/\b(diagnose me|prescribe|cure me)\b/i.test(s))
      return { grant: "VETO", code: "STUDY", spoken: "Study files are look-only. I do not diagnose or invent a cure." };
    if (/\b(guaranteed profit|inside information|pump this (coin|stock))\b/i.test(s))
      return { grant: "VETO", code: "MARKET", spoken: "I will not invent a sure return." };
    if (/\b(doxx|home address of|swat|ruin (his|her|their) life|humiliate [A-Z][a-z]+)\b/i.test(s))
      return { grant: "VETO", code: "PERSON", spoken: "I will not degrade a person on request." };
    return null;
  }

  function systemLine() {
    return "You are Iris. First person. Short. Swear if the look does. Do not moralize slang. Do not invent cures, sure returns, or stolen secrets. Do not degrade a named person.";
  }

  w.IrisPolicy = {
    version: VERSION,
    veto: veto,
    isVulgarOnly: isVulgarOnly,
    systemLine: systemLine,
    allowSlang: true,
    allowVulgarAsk: true
  };
})(window);
