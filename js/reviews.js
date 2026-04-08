(function () {
  "use strict";

  function renderStars() {
    var wrap = document.createElement("div");
    wrap.className = "reviews__stars";
    wrap.setAttribute("aria-label", "Оценка: 5 из 5");
    for (var i = 0; i < 5; i++) {
      var s = document.createElement("span");
      s.className = "reviews__star";
      s.setAttribute("aria-hidden", "true");
      s.textContent = "★";
      wrap.appendChild(s);
    }
    return wrap;
  }

  function renderReviews(root, data) {
    root.innerHTML = "";

    var intro = document.createElement("header");
    intro.className = "reviews__intro";

    var h2 = document.createElement("h2");
    h2.className = "reviews__title";
    h2.textContent = data.title || "";
    intro.appendChild(h2);

    if (data.subtitle) {
      var sub = document.createElement("p");
      sub.className = "reviews__subtitle";
      sub.textContent = data.subtitle;
      intro.appendChild(sub);
    }

    root.appendChild(intro);

    var grid = document.createElement("div");
    grid.className = "reviews__grid";

    (data.items || []).forEach(function (item) {
      var card = document.createElement("article");
      card.className = "reviews__card";

      card.appendChild(renderStars());

      var text = document.createElement("p");
      text.className = "reviews__text";
      text.textContent = "«" + (item.text || "") + "»";

      var divider = document.createElement("div");
      divider.className = "reviews__divider";
      divider.setAttribute("role", "presentation");

      var author = document.createElement("p");
      author.className = "reviews__author";
      author.textContent = item.author || "";

      var car = document.createElement("p");
      car.className = "reviews__car";
      car.textContent = item.car || "";

      card.appendChild(text);
      card.appendChild(divider);
      card.appendChild(author);
      card.appendChild(car);
      grid.appendChild(card);
    });

    root.appendChild(grid);
    if (typeof window.autoBridgeRevealOnScroll === "function") {
      window.autoBridgeRevealOnScroll(grid, ".reviews__card", "reviews__card--revealed");
    }
  }

  var root = document.getElementById("reviews-inner");
  if (!root) return;

  fetch("data/reviews.json")
    .then(function (r) {
      if (!r.ok) throw new Error("reviews.json");
      return r.json();
    })
    .then(function (data) {
      renderReviews(root, data);
    })
    .catch(function () {
      root.setAttribute("data-reviews-error", "1");
    });
})();
