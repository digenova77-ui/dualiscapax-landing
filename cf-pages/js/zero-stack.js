/* Ground Zero composer. Uses engines already on disk. Hear starts off. */
(function (w) {
  function well() {
    if (document.getElementById("holo-well")) return;
    var host = document.createElement("div");
    host.id = "holo-well";
    host.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 10; i++) {
      var ring = document.createElement("i");
      ring.style.setProperty("--z", String(-280 - i * 240) + "px");
      ring.style.setProperty("--s", String(0.42 + i * 0.11));
      host.appendChild(ring);
    }
    document.body.insertBefore(host, document.body.firstChild);
  }

  function bootHolo() {
    var stage = document.getElementById("iris-stage");
    if (!stage || !w.IrisHolo) return;
    IrisHolo.mount(stage);
    IrisHolo.setForm("orb");
    IrisHolo.setMood("curious");
    IrisHolo.setEnergy(0.48);
    w.addEventListener("pointermove", function (ev) {
      var x = (ev.clientX / Math.max(1, w.innerWidth)) * 2 - 1;
      var y = (ev.clientY / Math.max(1, w.innerHeight)) * 2 - 1;
      IrisHolo.lookAt(x, y);
      var near = Math.abs(x) < 0.14 && Math.abs(y) < 0.22;
      IrisHolo.setMood(near ? "agree" : "curious");
    }, { passive: true });
  }

  function bootFilm() {
    var root = document.getElementById("tour");
    if (!root || !w.DualisVideoEngine) return;
    new DualisVideoEngine({ root: root }).start();
  }

  function caption(text) {
    var el = document.getElementById("iris-line");
    if (el) el.textContent = text;
  }

  function bootHear() {
    var btn = document.getElementById("hear");
    if (!btn) return;
    var on = false;
    btn.addEventListener("click", function () {
      on = !on;
      btn.classList.toggle("on", on);
      btn.textContent = on ? "♪ on" : "♪ off";
      if (on && w.DSAP && DSAP.unlock) {
        DSAP.unlock().then(function () {
          DSAP.setFelt(true);
          DSAP.roar("Truth prevails. Take a seat.");
          caption("Field open. Iris does not speak first after this.");
          if (w.IrisHolo) { IrisHolo.setSpeaking(true); IrisHolo.setEnergy(0.72); }
        }).catch(function () {
          caption("No audio on this device.");
        });
      } else if (w.DSAP && DSAP.stop) {
        DSAP.stop();
        if (w.IrisHolo) { IrisHolo.setSpeaking(false); IrisHolo.setEnergy(0.42); }
        caption("Sound is off.");
      }
    });
  }

  function boot() {
    document.documentElement.classList.add("holo-on");
    document.body.classList.add("holo-on");
    well();
    bootHolo();
    bootFilm();
    bootHear();
    caption("Sound is off. ♪ if you want the field.");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
