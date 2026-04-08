(function () {
  "use strict";

  var SESSION_KEY = "autobridge_plaque_modal_shown";

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

  function openPlaqueModal(modal) {
    if (!modal) return;
    modal.hidden = false;
    modal.classList.add("modal--open");
    document.body.style.overflow = "hidden";
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch (e) {}
    var closeBtn = modal.querySelector(".modal__close");
    if (closeBtn) closeBtn.focus();
  }

  function closePlaqueModal(modal) {
    if (!modal) return;
    modal.classList.remove("modal--open");
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  function initPlaqueModal() {
    var sentinel = document.getElementById("plaque-sentinel");
    var modal = document.getElementById("plaque-modal");
    if (!sentinel || !modal) return;

    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    } catch (e) {}

    function onClose() {
      closePlaqueModal(modal);
    }

    modal.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", onClose);
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !modal.hidden) {
        onClose();
      }
    });

    if (typeof IntersectionObserver === "undefined") return;

    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          obs.disconnect();
          openPlaqueModal(modal);
        });
      },
      { threshold: 0, rootMargin: "0px 0px 0px 0px" }
    );
    obs.observe(sentinel);
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
    })
    .finally(function () {
      initPlaqueModal();
    });
})();
