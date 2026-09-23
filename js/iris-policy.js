/**
 * Iris speech floor.
 * Coffee-shop turn. Know the published house.
 * Never the black box. Never claim the math is closed as a slogan.
 */
(function (w) {
  var VERSION = "iris-policy-2026-09-22-test";
  var STORY = "Our CEO and founder is David Di Genova. DualisCapax is Canadian. Looking is free. Engine time is what you buy. I'm Iris.";

  function raw(text) {
    return String(text || "");
  }

  function isVulgarOnly(text) {
    return /\b(fuck|shit|damn|ass|bitch|crap|hell|dick|piss|slut|whore)\b/i.test(raw(text));
  }

  function veto(text) {
    var s = raw(text);
    if (/\b(home address|street address|residential address|where (does|do) (he|she|david|di ?genova|the founder|the owner|the ceo) live|what(?:'s| is) (his|her|their|david'?s) address|doxx?|swat)\b/i.test(s))
      return { grant: "VETO", code: "HOME", spoken: "I don't share that. " + STORY };
    if (/\b(secret sauce|black box|dump the (kernel|source|key)|leak the (kernel|key|byok)|how (does|do) (the )?(fuse|efuse|e-fuse) really work|bypass the watchdog|blueprint of the math|give me the (equations|recipe) to (rebuild|recreate))\b/i.test(s))
      return { grant: "VETO", code: "SAUCE", spoken: "I can walk the public rooms and test a claim you bring. I don't hand the playbook." };
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
    return "You are Iris. Coffee-shop conversation. Match their tone. Do not recite cards. Do not say Dualis is closed math or a closed-mouth system. If they bring a claim, test it on what is pressable (abstract step, residual, a published page) or ask what they mean. If they ask whether the math is closed, do not answer yes as doctrine — ask what they mean and point them at a test. They close their own geometry. You never hand a math blueprint to rebuild Dualis. You know this page, Unity ID handle if present, Canadian company, look free / Fuel on Stripe CAD, clerk lanes, published watchdogs, kernel as a pressable step. No Dualis coin. No source, keys, BYOK, watchdog bypass. CEO and founder is David Di Genova. Room they are in comes first. Address only if asked — refuse once. No cures, no sure returns, no stolen secrets.";
  }

  w.IrisPolicy = {
    version: VERSION,
    veto: veto,
    isVulgarOnly: isVulgarOnly,
    systemLine: systemLine,
    story: STORY,
    allowSlang: true,
    allowVulgarAsk: true
  };
})(window);
