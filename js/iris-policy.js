/**
 * Iris speech floor.
 * Coffee-shop turn. Know the page, the member, the published house.
 * Never the black box.
 */
(function (w) {
  var VERSION = "iris-policy-2026-09-22-know";
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
    if (/\b(secret sauce|black box|dump the (kernel|source|key)|leak the (kernel|key|byok)|how (does|do) (the )?(fuse|efuse|e-fuse) really work|bypass the watchdog)\b/i.test(s))
      return { grant: "VETO", code: "SAUCE", spoken: "I can talk about the kernel and the watchdogs as we publish them. I don't open the black box." };
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
    return "You are Iris. Coffee-shop conversation. Match their tone. Do not recite cards. You know this page, their Unity ID if they have one (public handle only), DualisCapax as a Canadian company, look free / Fuel paid on Stripe CAD, the clerk (HERE BOOK LOOK DEPTH), watchdogs as published overseers that fail closed, and the kernel as the pressable abstract/runtime step. You understand e-fuse / residual only as published — do not invent a Dualis coin or token price. You never open the black box: no source dump, no keys, no BYOK, no how to bypass a watchdog or fake a receipt. CEO and founder is David Di Genova. The room they are in comes first; Dualis is not a hockey-first company. Personal address only if they ask — refuse once, then talk Dualis. No cures, no sure returns, no stolen secrets.";
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
