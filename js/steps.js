(function () {
  "use strict";

  var ICON_BASE = "assets/icon/";

  function padNum(i) {
    return String(i + 1).padStart(2, "0");
  }

  function renderProcess(root, data) {
    root.innerHTML = "";

    var intro = document.createElement("div");
    intro.className = "process__intro";

    var h2 = document.createElement("h2");
    h2.className = "process__title";
    h2.textContent = data.title || "";
    intro.appendChild(h2);

    if (data.subtitle) {
      var sub = document.createElement("p");
      sub.className = "process__subtitle";
      sub.textContent = data.subtitle;
      intro.appendChild(sub);
    }
    root.appendChild(intro);

    var grid = document.createElement("div");
    grid.className = "process__grid";

    (data.steps || []).forEach(function (step, index) {
      var art = document.createElement("article");
      art.className = "process__step";
      art.setAttribute("data-step-index", String(index));

      var head = document.createElement("div");
      head.className = "process__head";

      var iconWrap = document.createElement("div");
      iconWrap.className = "process__icon-wrap";
      var img = document.createElement("img");
      img.className = "process__icon";
      img.src = ICON_BASE + (step.icon || "");
      img.alt = "";
      img.width = 24;
      img.height = 24;
      img.decoding = "async";
      iconWrap.appendChild(img);

      var num = document.createElement("span");
      num.className = "process__num";
      num.setAttribute("aria-hidden", "true");
      num.textContent = padNum(index);

      head.appendChild(iconWrap);

      var body = document.createElement("div");
      body.className = "process__step-body";

      var h3 = document.createElement("h3");
      h3.className = "process__step-title";
      h3.textContent = step.title || "";

      var p = document.createElement("p");
      p.className = "process__step-text";
      p.textContent = step.text || "";

      body.appendChild(head);
      body.appendChild(h3);
      body.appendChild(p);

      art.appendChild(num);
      art.appendChild(body);
      grid.appendChild(art);
    });

    root.appendChild(grid);
    initStepReveal(grid);
  }

  function initStepReveal(grid) {
    if (typeof IntersectionObserver === "undefined") return;
    var items = grid.querySelectorAll(".process__step");
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("process__step--visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach(function (el) {
      obs.observe(el);
    });
  }

  var root = document.getElementById("process-inner");
  if (!root) return;

  fetch("data/steps.json")
    .then(function (r) {
      if (!r.ok) throw new Error("steps.json");
      return r.json();
    })
    .then(function (data) {
      renderProcess(root, data);
    })
    .catch(function () {
      root.setAttribute("data-process-error", "1");
    });
})();
