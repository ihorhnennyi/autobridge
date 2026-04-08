(function () {
  "use strict";

  var ICON_BASE = "assets/icon/";

  function renderServices(root, data) {
    root.innerHTML = "";

    var intro = document.createElement("div");
    intro.className = "services__intro";

    var h2 = document.createElement("h2");
    h2.className = "services__title";
    h2.textContent = data.title || "";
    intro.appendChild(h2);

    if (data.subtitle) {
      var sub = document.createElement("p");
      sub.className = "services__subtitle";
      sub.textContent = data.subtitle;
      intro.appendChild(sub);
    }

    root.appendChild(intro);

    var grid = document.createElement("div");
    grid.className = "services__grid";

    (data.items || []).forEach(function (item) {
      var card = document.createElement("article");
      card.className = "services__card";

      var iconWrap = document.createElement("div");
      iconWrap.className = "services__icon-wrap";
      var img = document.createElement("img");
      img.className = "services__icon";
      img.src = ICON_BASE + (item.icon || "");
      img.width = 40;
      img.height = 40;
      img.alt = "";
      img.decoding = "async";
      iconWrap.appendChild(img);

      var h3 = document.createElement("h3");
      h3.className = "services__card-title";
      h3.textContent = item.title || "";

      var p = document.createElement("p");
      p.className = "services__card-text";
      p.textContent = item.text || "";

      card.appendChild(iconWrap);
      card.appendChild(h3);
      card.appendChild(p);
      grid.appendChild(card);
    });

    root.appendChild(grid);
    if (typeof window.autoBridgeRevealOnScroll === "function") {
      window.autoBridgeRevealOnScroll(grid, ".services__card", "services__card--revealed");
    }
  }

  var root = document.getElementById("services-inner");
  if (!root) return;

  fetch("data/services.json")
    .then(function (r) {
      if (!r.ok) throw new Error("services.json");
      return r.json();
    })
    .then(function (data) {
      renderServices(root, data);
    })
    .catch(function () {
      root.setAttribute("data-services-error", "1");
    });
})();
