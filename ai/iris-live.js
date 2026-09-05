/** Live rail if open. Otherwise DCLM house book. Never fake a locked worker. */
(function (w) {
  var VERSION = "iris-live-2026-09-04-house";
  async function run(text, opt) {
    if (w.DCLMLook && typeof w.DCLMLook.run === "function") {
      return w.DCLMLook.run(text, opt || {});
    }
    if (w.IrisBook && IrisBook.lookup) {
      var book = IrisBook.lookup(text);
      if (book) return book;
    }
    return { grant: "MEASURE", kernel: VERSION, spoken: "Open /works.html. I will not invent a worker.", href: "/works.html", label: "What works" };
  }
  w.IrisLive = { version: VERSION, run: run };
})(window);
