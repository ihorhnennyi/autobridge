(function () {
  "use strict";

  var ICON_PATHS = {
    mileage:
      '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    calendar:
      '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    fuel:
      '<path d="M3 22v-8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8"/><path d="M7 22V12"/><path d="M17 10h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"/><path d="M17 6V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>',
    engine:
      '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    drive:
      '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    gear:
      '<circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>'
  };

  function specIcon(type) {
    var span = document.createElement("span");
    span.className = "cars__spec-icon cars__spec-icon--" + type;
    span.setAttribute("aria-hidden", "true");
    span.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      ICON_PATHS[type] +
      "</svg>";
    return span;
  }

  function specCell(iconType, text) {
    var cell = document.createElement("div");
    cell.className = "cars__spec";
    cell.appendChild(specIcon(iconType));
    var label = document.createElement("span");
    label.className = "cars__spec-text";
    label.textContent = text;
    cell.appendChild(label);
    return cell;
  }

  function priceRow(left, right) {
    var row = document.createElement("div");
    row.className = "cars__price-row";
    var l = document.createElement("span");
    l.className = "cars__price-label";
    l.textContent = left;
    var r = document.createElement("span");
    r.className = "cars__price-value";
    r.textContent = right;
    row.appendChild(l);
    row.appendChild(r);
    return row;
  }

  function renderCar(car) {
    var article = document.createElement("article");
    article.className = "cars__card";
    article.setAttribute("role", "listitem");

    var media = document.createElement("div");
    media.className = "cars__media";
    var badge = document.createElement("span");
    badge.className = "cars__badge";
    badge.textContent = car.region;
    var img = document.createElement("img");
    img.className = "cars__img";
    img.src = car.image;
    img.alt = car.title;
    img.loading = "lazy";
    img.decoding = "async";
    media.appendChild(badge);
    media.appendChild(img);
    article.appendChild(media);

    var body = document.createElement("div");
    body.className = "cars__card-body";

    var head = document.createElement("div");
    head.className = "cars__card-head";
    var h3 = document.createElement("h3");
    h3.className = "cars__card-title";
    h3.textContent = car.title;
    var year = document.createElement("p");
    year.className = "cars__card-year";
    year.textContent = car.yearLabel || "";
    head.appendChild(h3);
    head.appendChild(year);
    body.appendChild(head);

    var s = car.specs || {};
    var specs = document.createElement("div");
    specs.className = "cars__specs";
    specs.appendChild(specCell("mileage", s.mileage || ""));
    specs.appendChild(specCell("calendar", s.year || ""));
    specs.appendChild(specCell("fuel", s.fuel || ""));
    specs.appendChild(specCell("engine", s.engine || ""));
    specs.appendChild(specCell("drive", s.drive || ""));
    specs.appendChild(specCell("gear", s.transmission || ""));
    body.appendChild(specs);

    var divider = document.createElement("div");
    divider.className = "cars__divider";
    divider.setAttribute("role", "presentation");
    body.appendChild(divider);

    var prices = document.createElement("div");
    prices.className = "cars__prices";
    prices.appendChild(
      priceRow(car.priceFromLabel || "Цена из", car.priceFrom || "")
    );
    prices.appendChild(
      priceRow(car.priceRuLabel || "Цена в России", car.priceRu || "")
    );
    body.appendChild(prices);

    var benefit = document.createElement("div");
    benefit.className = "cars__benefit";
    var bl = document.createElement("span");
    bl.className = "cars__benefit-label";
    bl.textContent = "Выгода:";
    var bv = document.createElement("span");
    bv.className = "cars__benefit-value";
    bv.textContent = car.benefit || "";
    benefit.appendChild(bl);
    benefit.appendChild(bv);
    body.appendChild(benefit);

    article.appendChild(body);
    return article;
  }

  function init() {
    var grid = document.getElementById("cars-grid");
    if (!grid) return;

    fetch("data/cars.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        var titleEl = document.getElementById("cars-title");
        var subEl = document.getElementById("cars-subtitle");
        if (titleEl && data.title) titleEl.textContent = data.title;
        if (subEl && data.subtitle) subEl.textContent = data.subtitle;

        grid.innerHTML = "";
        (data.cars || []).forEach(function (car) {
          grid.appendChild(renderCar(car));
        });
        if (typeof window.autoBridgeRevealOnScroll === "function") {
          window.autoBridgeRevealOnScroll(grid, ".cars__card", "cars__card--revealed");
        }
      })
      .catch(function () {
        grid.innerHTML =
          '<p class="cars__error">Не удалось загрузить каталог. Проверьте подключение.</p>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
