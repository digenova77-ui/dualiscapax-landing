/* Ground Zero — land acts. No engine. No photo swap. */
(function () {
  var look = document.getElementById("act-look");
  var rooms = document.getElementById("act-rooms");
  var leave = document.getElementById("act-leave");
  if (look) look.addEventListener("click", function () { location.href = "look.html"; });
  if (rooms) rooms.addEventListener("click", function () { location.href = "rooms.html"; });
  if (leave) leave.addEventListener("click", function () { location.href = "faq.html"; });
})();
