/**
 * Iris interaction adapter.
 *
 * This browser-only adapter does not simulate a connected model, fabricate
 * telemetry, or authorize side effects. When no approved backend is present,
 * it states that limitation plainly. Text is rendered as text, never HTML.
 */
(function (w, d) {
  "use strict";

  var VERSION = "iris-adapter-trinity-v1";
  var MAX_INPUT_CHARS = 4000;
  var busy = false;

  function responseFor(query) {
    var text = String(query || "").trim();
    if (!text) return "Tell me what you want to examine.";
    if (w.IrisPolicy && typeof w.IrisPolicy.veto === "function") {
      var decision = w.IrisPolicy.veto(text);
      if (decision && decision.grant === "VETO") return decision.spoken || "I can't help with that request.";
    }
    if (w.IrisSession && typeof w.IrisSession.say === "function") {
      return null;
    }
    return "I have your message. This page is currently in local interface mode; a verified Iris reasoning service is not connected, so I won't pretend I searched records, ran calculations, or verified a claim. I can help frame the question for a real, evidence-backed review.";
  }

  function element(tag, className, label, text) {
    var node = d.createElement(tag);
    if (className) node.className = className;
    if (label) node.setAttribute("aria-label", label);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function appendMessage(stream, role, text) {
    var user = role === "user";
    var bubble = element("div", user ? "iris-message iris-message-user" : "iris-message iris-message-assistant");
    bubble.setAttribute("role", "group");
    bubble.setAttribute("aria-label", user ? "You said" : "Iris response");
    var heading = element("div", "iris-message-label", null, user ? "You" : "Iris · local mode");
    var body = element("div", "iris-message-body", null, text);
    bubble.appendChild(heading);
    bubble.appendChild(body);
    stream.appendChild(bubble);
    stream.scrollTop = stream.scrollHeight;
    return bubble;
  }

  function submit(customText) {
    var stream = d.getElementById("embeddedIrisStream");
    var input = d.getElementById("irisInput") || d.querySelector('input[placeholder*="Ask Iris"]');
    if (!stream || busy) return false;
    var text = String(customText !== undefined ? customText : (input ? input.value : "")).trim();
    if (!text) return false;
    if (text.length > MAX_INPUT_CHARS) {
      appendMessage(stream, "assistant", "That message is too long. Please keep it under " + MAX_INPUT_CHARS + " characters.");
      return false;
    }
    if (input && customText === undefined) input.value = "";
    appendMessage(stream, "user", text);
    busy = true;
    try {
      var answer = responseFor(text);
      if (w.IrisSession && typeof w.IrisSession.say === "function" && answer === null) {
        Promise.resolve(w.IrisSession.say(text)).then(function (result) {
          var spoken = result && (result.spoken || result.text);
          appendMessage(stream, "assistant", String(spoken || "The connected Iris service returned no response."));
        }).catch(function () {
          appendMessage(stream, "assistant", "I couldn't complete that request. No action was authorized.");
        }).then(function () { busy = false; });
      } else {
        appendMessage(stream, "assistant", answer);
        busy = false;
      }
    } catch (error) {
      appendMessage(stream, "assistant", "I couldn't complete that request. No action was authorized.");
      busy = false;
    }
    return true;
  }

  function init() {
    var stream = d.getElementById("embeddedIrisStream");
    var input = d.getElementById("irisInput") || d.querySelector('input[placeholder*="Ask Iris"]');
    var send = d.getElementById("irisSendBtn");
    if (!stream) return;
    w.submitIrisPrompt = submit;
    if (send) send.addEventListener("click", function () { submit(); });
    if (input) input.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submit();
      }
    });
    stream.setAttribute("aria-live", "polite");
    stream.setAttribute("aria-relevant", "additions text");
    stream.setAttribute("data-iris-adapter-version", VERSION);
  }

  w.IrisCognitiveEngine = {
    version: VERSION,
    maxInputChars: MAX_INPUT_CHARS,
    responseFor: responseFor,
    submit: submit,
    init: init
  };

  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", init);
  else init();
})(window, document);
