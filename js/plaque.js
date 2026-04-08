(function () {
  "use strict";

  var SESSION_KEY = "autobridge_plaque_modal_shown";
  var DELAY_MS = 15000;
  var openTimer = null;

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

    var modalBody = document.getElementById("plaque-modal-body");
    if (modalBody) {
      modalBody.innerHTML = "";
      var headClone = head.cloneNode(true);
      var titleInModal = headClone.querySelector(".plaque__title");
      if (titleInModal) titleInModal.id = "plaque-modal-title";
      modalBody.appendChild(headClone);
      modalBody.appendChild(body.cloneNode(true));
    }
  }

  function openPlaqueModal(modal) {
    var modalBody = document.getElementById("plaque-modal-body");
    if (
      !modal ||
      !modalBody ||
      !modalBody.querySelector(".plaque__title")
    ) {
      return;
    }
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

  function clearOpenTimer() {
    if (openTimer !== null) {
      clearTimeout(openTimer);
      openTimer = null;
    }
  }

  window.addEventListener(
    "pagehide",
    function () {
      clearOpenTimer();
    },
    { capture: true }
  );

  function initPlaqueModal() {
    var modal = document.getElementById("plaque-modal");
    if (!modal) return;

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

    clearOpenTimer();
    openTimer = window.setTimeout(function () {
      openTimer = null;
      try {
        if (sessionStorage.getItem(SESSION_KEY) === "1") return;
      } catch (e) {}
      openPlaqueModal(modal);
    }, DELAY_MS);
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
      var modalBody = document.getElementById("plaque-modal-body");
      if (modalBody && modalBody.querySelector(".plaque__title")) {
        initPlaqueModal();
      }
    });
})();
