export function unityWallet(caller) {
  const src = caller && typeof caller === "object" && !Array.isArray(caller) ? caller : {};
  const identification = typeof src.identification === "string" ? src.identification : "";
  return {
    identification: identification,
    wallet: {
      identification: identification,
      holding: []
    },
    look: 0,
    joule: null,
    remember: false
  };
}

function paint(book) {
  const idLine = document.getElementById("id-line");
  const holdLine = document.getElementById("hold-line");
  const remember = document.getElementById("remember");
  if (idLine) idLine.textContent = book.identification === "" ? "You" : book.identification;
  if (holdLine) holdLine.textContent = book.wallet.holding.length === 0 ? "Empty" : book.wallet.holding.join(", ");
  if (remember) remember.textContent = "Nothing to remember.";
}

function boot() {
  const form = document.getElementById("wallet-form");
  if (!form) return;
  const input = document.getElementById("who");
  const draw = function () {
    paint(unityWallet({ identification: input ? input.value : "" }));
  };
  draw();
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    draw();
  });
}

if (typeof document !== "undefined") boot();
