/* Rooms — seat_deck order. Onboard is the goal of every seat. */
(function () {
  var ROOMS = [
    { id: "nation", title: "Nation", line: "Country first.", href: "onboard.html#nation" },
    { id: "province", title: "Province", line: "Ontario is this house. Other rooms as one card.", href: "onboard.html#province" },
    { id: "public", title: "Public desk", line: "School, hospital, grid, city.", href: "onboard.html#public" },
    { id: "house", title: "House that spends", line: "Bank, plant, lab, office.", href: "onboard.html#house" },
    { id: "people", title: "People", line: "Club, street, household.", href: "onboard.html#people" },
    { id: "one", title: "One person", line: "This device. Books stay here.", href: "playground.html" }
  ];
  var STREAMS = [
    { id: "bus", title: "Bus", href: "look.html" },
    { id: "care", title: "Care", href: "research/healthcare/locked.html" },
    { id: "sport", title: "Sport", href: "look.html" },
    { id: "office", title: "Office", href: "founding.html" },
    { id: "notes", title: "Notes", href: "field-notes.html" },
    { id: "one", title: "One", href: "playground.html" }
  ];
  var rooms = document.getElementById("rooms");
  var streams = document.getElementById("streams");
  if (rooms) {
    ROOMS.forEach(function (r) {
      var a = document.createElement("a");
      a.className = "door";
      a.href = r.href;
      a.innerHTML = "<strong>" + r.title + "</strong><span>" + r.line + "</span><em>Goal · onboard</em>";
      rooms.appendChild(a);
    });
  }
  if (streams) {
    STREAMS.forEach(function (s) {
      var a = document.createElement("a");
      a.className = "stream";
      a.href = s.href;
      a.textContent = s.title;
      streams.appendChild(a);
    });
  }
})();
