(function () {
  "use strict";

  function renderPlaque(root, data) {
    root.innerHTML = "";

    var head = document.createElement("div");
    head.className = "plaque__head";

    var icon = document.createElement("img");
    icon.className = "plaque__icon";
    icon.src = "assets/icon/globe.svg";
    icon.alt = "";
    icon.width = 28;
    icon.height = 28;
    icon.decoding = "async";

    var h2 = document.createElement("h2");
    h2.className = "plaque__title";
    h2.textContent = data.title || "";

    head.appendChild(icon);
    head.appendChild(h2);

    var body = document.createElement("div");
    body.className = "plaque__body";

    (data.lines || []).forEach(function (line) {
      var p = document.createElement("p");
      p.className = "plaque__text";
      p.textContent = line;
      body.appendChild(p);
    });

    root.appendChild(head);
    root.appendChild(body);
  }

  var root = document.getElementById("plaque-inner");
  if (!root) return;

  fetch("data/plaque.json")
    .then(function (r) {
      if (!r.ok) throw new Error("plaque.json");
      return r.json();
    })
    .then(function (data) {
      renderPlaque(root, data);
    })
    .catch(function () {
      root.setAttribute("data-plaque-error", "1");
    });
})();
