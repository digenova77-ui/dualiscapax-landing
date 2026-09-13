(function (w) {
  w.dcStoreAnswer = function (q, a) {
    try {
      sessionStorage.setItem("dc.ask", String(q || ""));
      sessionStorage.setItem("dc.answer", String(a || ""));
    } catch (e) {}
  };
})(window);
