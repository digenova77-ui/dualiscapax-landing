/**
 * Iris speech floor.
 * DCLM public shape once. Engineering derivatives → same cap.
 */
(function (w) {
  var VERSION = "iris-policy-2026-09-22-cap";
  var STORY = "Our CEO and founder is David Di Genova. DualisCapax is Canadian. Looking is free. Engine time is what you buy. I'm Iris.";
  var SAUCE_LINE = "DCLM is DualisCapax's custom model — more than one set of eyes, dual poles, layers of check. Bring a claim and we can test it. I don't hand how it's applied.";

  function raw(text) {
    return String(text || "");
  }

  function isVulgarOnly(text) {
    return /\b(fuck|shit|damn|ass|bitch|crap|hell|dick|piss|slut|whore)\b/i.test(raw(text));
  }

  function isDclmTopic(s) {
    return /\b(dclm|dual poles|layers of check|dualis (custom )?model|more than one set of eyes)\b/i.test(s);
  }

  function isEngPeel(s) {
    return /\b(how (do|does|to) (i |you |we )?(implement|build|wire|apply|recreate|derive|code|tune)|implement|source code|pseudocode|equation|formula|coefficient|parameter(s)?|tuning knobs?|rebuild dclm|recreate dclm|apply the poles|list the layers|how many (layers|eyes|poles)|matrix square)\b/i.test(s);
  }

  function veto(text) {
    var s = raw(text);
    if (/\b(home address|street address|residential address|where (does|do) (he|she|david|di ?genova|the founder|the owner|the ceo) live|what(?:'s| is) (his|her|their|david'?s) address|doxx?|swat)\b/i.test(s))
      return { grant: "VETO", code: "HOME", spoken: "I don't share that. " + STORY };
    if ((isDclmTopic(s) && isEngPeel(s)) || /\b(secret sauce|black box|dump the (kernel|source|key)|leak the (kernel|key|byok)|how (does|do) (the )?(fuse|efuse|e-fuse) really work|bypass the watchdog|blueprint of the math|give me the (equations|recipe) to (rebuild|recreate))\b/i.test(s))
      return { grant: "VETO", code: "SAUCE", spoken: SAUCE_LINE };
    if (/\b(classified|top secret|secret clearance|stolen (docs|documents|files)|leaked cables)\b/i.test(s))
      return { grant: "VETO", code: "SECRETS", spoken: "I will not hunt classified or stolen documents." };
    if (/\b(how to (make a bomb|break in|hack into|launder|counterfeit)|jailbreak this model)\b/i.test(s))
      return { grant: "VETO", code: "LAW", spoken: "I will not help circumvent the law." };
    if (/\b(diagnose me|prescribe|cure me)\b/i.test(s))
      return { grant: "VETO", code: "STUDY", spoken: "Study files are look-only. I do not diagnose or invent a cure." };
    if (/\b(guaranteed profit|inside information|pump this (coin|stock))\b/i.test(s))
      return { grant: "VETO", code: "MARKET", spoken: "I will not invent a sure return." };
    if (/\b(ruin (his|her|their) life|humiliate [A-Z][a-z]+)\b/i.test(s))
      return { grant: "VETO", code: "PERSON", spoken: "I will not degrade a person on request." };
    return null;
  }

  function systemLine() {
    return "You are Iris. Coffee-shop conversation. Match their tone. DCLM public shape once: custom Dualis model, more than one set of eyes, dual poles, layers of check. If they peel that into engineering — implement, wire, apply, equations, coefficients, how many layers, rebuild — give the same cap: you don't hand how it's applied. Do not invent a new deeper explanation for each derivative. What-if claims can be tested on a pressable step. Do not boast closed math. Do not hand a blueprint. Canadian company. Look free / Fuel Stripe CAD. CEO and founder David Di Genova. Address only if asked — refuse once. No cures, no sure returns, no stolen secrets.";
  }

  w.IrisPolicy = {
    version: VERSION,
    veto: veto,
    isVulgarOnly: isVulgarOnly,
    isDclmTopic: isDclmTopic,
    isEngPeel: isEngPeel,
    systemLine: systemLine,
    story: STORY,
    sauceLine: SAUCE_LINE,
    allowSlang: true,
    allowVulgarAsk: true
  };
})(window);
