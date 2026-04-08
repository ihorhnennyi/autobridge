(function () {
  "use strict";

  function renderAuctions(root, data) {
    root.innerHTML = "";

    var intro = document.createElement("header");
    intro.className = "auctions__intro";

    var h2 = document.createElement("h2");
    h2.className = "auctions__title";
    h2.textContent = data.title || "";
    intro.appendChild(h2);

    if (data.subtitle) {
      var sub = document.createElement("p");
      sub.className = "auctions__subtitle";
      sub.textContent = data.subtitle;
      intro.appendChild(sub);
    }

    root.appendChild(intro);

    var grid = document.createElement("div");
    grid.className = "auctions__grid";

    (data.items || []).forEach(function (item) {
      var card = document.createElement("article");
      card.className = "auctions__card";

      var head = document.createElement("div");
      head.className = "auctions__card-head";

      var h3 = document.createElement("h3");
      h3.className = "auctions__name";
      h3.textContent = item.name || "";

      var tag = document.createElement("span");
      tag.className = "auctions__tag";
      tag.textContent = item.region || "";

      head.appendChild(h3);
      head.appendChild(tag);

      var p = document.createElement("p");
      p.className = "auctions__desc";
      p.textContent = item.description || "";

      card.appendChild(head);
      card.appendChild(p);
      grid.appendChild(card);
    });

    root.appendChild(grid);
    if (typeof window.autoBridgeRevealOnScroll === "function") {
      window.autoBridgeRevealOnScroll(grid, ".auctions__card", "auctions__card--revealed");
    }
  }

  var root = document.getElementById("auctions-inner");
  if (!root) return;

  fetch("data/auctions.json")
    .then(function (r) {
      if (!r.ok) throw new Error("auctions.json");
      return r.json();
    })
    .then(function (data) {
      renderAuctions(root, data);
    })
    .catch(function () {
      root.setAttribute("data-auctions-error", "1");
    });
})();
