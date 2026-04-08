(function () {
  "use strict";

  var SESSION_KEY = "autobridge_catalog_modal_shown";
  var DELAY_MS = 15000;
  var RETRY_DELAY_MS = 2500;

  var timerSite = null;
  var timerAfterClose = null;
  var catalogModalData = null;
  var catalogModalCloseWired = false;
  var catalogModalSuccessCloseTimer = null;

  var quizInteractionBlocksCatalogModal = false;
  var quizSectionInView = false;
  var consultSectionInView = false;
  var focusInQuizOrConsult = false;

  function isCatalogModalAutoshowBlocked() {
    if (quizInteractionBlocksCatalogModal) return true;
    if (quizSectionInView) return true;
    if (consultSectionInView) return true;
    if (focusInQuizOrConsult) return true;
    return false;
  }

  function setupCatalogModalBlockListeners() {
    document.addEventListener(
      "focusin",
      function (e) {
        var t = e.target;
        if (!t || !t.closest) return;
        focusInQuizOrConsult = !!(
          t.closest("#quiz-root") || t.closest("#consult-inner")
        );
      },
      true
    );
    document.addEventListener(
      "focusout",
      function () {
        window.setTimeout(function () {
          var a = document.activeElement;
          if (!a || !a.closest) {
            focusInQuizOrConsult = false;
            return;
          }
          focusInQuizOrConsult = !!(
            a.closest("#quiz-root") || a.closest("#consult-inner")
          );
        }, 0);
      },
      true
    );

    if (typeof IntersectionObserver === "undefined") return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.target.id === "quiz") {
            quizSectionInView = entry.isIntersecting;
          }
          if (entry.target.id === "consult") {
            consultSectionInView = entry.isIntersecting;
          }
        });
      },
      { threshold: 0, rootMargin: "-2% 0px -2% 0px" }
    );
    var quizSec = document.getElementById("quiz");
    var consultSec = document.getElementById("consult");
    if (quizSec) io.observe(quizSec);
    if (consultSec) io.observe(consultSec);
  }

  window.autoBridgeSetQuizBlockingCatalogModal = function (blocked) {
    quizInteractionBlocksCatalogModal = !!blocked;
  };

  function clearCatalogModalSuccessTimer() {
    if (catalogModalSuccessCloseTimer !== null) {
      clearTimeout(catalogModalSuccessCloseTimer);
      catalogModalSuccessCloseTimer = null;
    }
  }

  function clearSiteTimer() {
    if (timerSite !== null) {
      clearTimeout(timerSite);
      timerSite = null;
    }
  }

  function clearAfterCloseTimer() {
    if (timerAfterClose !== null) {
      clearTimeout(timerAfterClose);
      timerAfterClose = null;
    }
  }

  window.addEventListener(
    "pagehide",
    function () {
      clearSiteTimer();
      clearAfterCloseTimer();
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch (e) {}
    },
    { capture: true }
  );

  function el(tag, cls, attrs) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    return node;
  }

  function renderForm(body, data) {
    clearCatalogModalSuccessTimer();
    if (modal) {
      modal.classList.remove("modal--catalog-thankyou");
      modal.setAttribute("aria-labelledby", "catalog-modal-title");
    }
    body.innerHTML = "";

    var h2 = el("h2", "catalog-modal__title", {
      id: "catalog-modal-title",
      text: data.title || ""
    });

    var stateBlock = el("div", "catalog-modal__state");
    stateBlock.appendChild(h2);

    if (data.subtitle) {
      stateBlock.appendChild(el("p", "catalog-modal__lead", { text: data.subtitle }));
    }

    var err = el("p", "consult__form-error catalog-modal__error");
    err.setAttribute("role", "alert");
    err.hidden = true;
    stateBlock.appendChild(err);

    var success = el("div", "catalog-modal__success");
    success.setAttribute("role", "status");
    success.setAttribute("aria-live", "polite");
    success.hidden = true;
    success.appendChild(
      el("h3", "catalog-modal__success-title", {
        id: "catalog-modal-success-heading",
        text: data.successTitle || "Спасибо!"
      })
    );
    success.appendChild(
      el("p", "catalog-modal__success-text", {
        text: data.successText || "Заявка отправлена. Мы свяжемся с вами в ближайшее время."
      })
    );

    var form = el("form", "catalog-modal__form");
    form.id = "catalog-modal-form";
    form.setAttribute("novalidate", "novalidate");
    form.setAttribute("autocomplete", "on");

    function field(id, labelText, inputType, placeholder, auto) {
      var row = el("div", "consult__field");
      row.appendChild(el("label", "consult__label", { for: id, text: labelText }));
      var inp = el("input", "consult__input");
      inp.id = id;
      inp.type = inputType;
      inp.name = id.replace("catalog-modal-", "");
      inp.placeholder = placeholder || "";
      inp.autocomplete = auto;
      if (inputType === "tel") inp.setAttribute("inputmode", "tel");
      row.appendChild(inp);
      return { row: row, input: inp };
    }

    var nameF = field(
      "catalog-modal-name",
      data.nameLabel || "Имя",
      "text",
      data.namePlaceholder,
      "name"
    );
    var phoneF = field(
      "catalog-modal-phone",
      data.phoneLabel || "Телефон",
      "tel",
      data.phonePlaceholder,
      "tel"
    );

    form.appendChild(nameF.row);
    form.appendChild(phoneF.row);

    if (typeof window.autoBridgeAttachRuPhoneMask === "function") {
      window.autoBridgeAttachRuPhoneMask(phoneF.input, {
        placeholder: data.phonePlaceholder || undefined,
      });
    }

    var submitBtn = el("button", "catalog-modal__submit", {
      type: "submit",
      text: data.submit || "Отправить"
    });
    form.appendChild(submitBtn);

    function showError(msg) {
      err.textContent = msg || "";
      err.hidden = !msg;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      showError("");
      var name = nameF.input.value.trim();
      var phone = phoneF.input.value.trim();
      if (name.length < 2) {
        showError("Укажите имя.");
        nameF.input.focus();
        return;
      }
      var phoneCheck =
        typeof window.autoBridgeValidateRuPhone === "function"
          ? window.autoBridgeValidateRuPhone(phone)
          : null;
      if (phoneCheck && !phoneCheck.ok) {
        showError(phoneCheck.error || "Укажите корректный телефон.");
        phoneF.input.focus();
        return;
      }
      if (!phoneCheck) {
        showError("Ошибка загрузки маски телефона. Обновите страницу.");
        return;
      }
      var send = window.autoBridgeSendTelegram;
      if (typeof send !== "function") {
        showError("Ошибка загрузки. Обновите страницу.");
        return;
      }
      submitBtn.disabled = true;
      send("catalog_modal", { name: name, phone: phoneCheck.e164 })
        .then(function () {
          stateBlock.hidden = true;
          success.hidden = false;
          if (modal) {
            modal.classList.add("modal--catalog-thankyou");
            modal.setAttribute("aria-labelledby", "catalog-modal-success-heading");
          }
          clearCatalogModalSuccessTimer();
          catalogModalSuccessCloseTimer = window.setTimeout(function () {
            catalogModalSuccessCloseTimer = null;
            if (modal) {
              closeModal(modal);
              scheduleAfterClose(modal);
            }
          }, 5000);
        })
        .catch(function (err) {
          var hint =
            window.autoBridgeTelegramErrorMessage && window.autoBridgeTelegramErrorMessage(err);
          showError(
            hint || "Не удалось отправить. Попробуйте ещё раз."
          );
          submitBtn.disabled = false;
        });
    });

    stateBlock.appendChild(form);
    body.appendChild(stateBlock);
    body.appendChild(success);
  }

  function openModal(modal) {
    if (!modal || !modal.hidden) return;
    clearSiteTimer();
    clearAfterCloseTimer();
    clearCatalogModalSuccessTimer();
    modal.hidden = false;
    modal.classList.add("modal--open");
    document.body.style.overflow = "hidden";
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch (err) {}
    var closeBtn = modal.querySelector(".modal__close");
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(modal) {
    if (!modal) return;
    clearCatalogModalSuccessTimer();
    var wasThankYou = modal.classList.contains("modal--catalog-thankyou");
    modal.classList.remove("modal--open");
    modal.classList.remove("modal--catalog-thankyou");
    modal.setAttribute("aria-labelledby", "catalog-modal-title");
    modal.hidden = true;
    document.body.style.overflow = "";
    if (wasThankYou && catalogModalData && bodyEl) {
      renderForm(bodyEl, catalogModalData);
    }
  }

  function attemptAutoOpenFromSiteTimer(modal) {
    if (!modal || !modal.hidden) return;
    if (isCatalogModalAutoshowBlocked()) {
      timerSite = window.setTimeout(function () {
        timerSite = null;
        attemptAutoOpenFromSiteTimer(modal);
      }, RETRY_DELAY_MS);
      return;
    }
    openModal(modal);
  }

  function scheduleSiteTimer(modal) {
    clearSiteTimer();
    timerSite = window.setTimeout(function () {
      timerSite = null;
      attemptAutoOpenFromSiteTimer(modal);
    }, DELAY_MS);
  }

  function attemptAutoOpenAfterClose(modal) {
    if (!modal || !modal.hidden) return;
    if (isCatalogModalAutoshowBlocked()) {
      timerAfterClose = window.setTimeout(function () {
        timerAfterClose = null;
        attemptAutoOpenAfterClose(modal);
      }, RETRY_DELAY_MS);
      return;
    }
    openModal(modal);
  }

  function scheduleAfterClose(modal) {
    clearAfterCloseTimer();
    timerAfterClose = window.setTimeout(function () {
      timerAfterClose = null;
      attemptAutoOpenAfterClose(modal);
    }, DELAY_MS);
  }

  function headingIsInView(heading) {
    var rect = heading.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    return rect.top < vh * 0.88 && rect.bottom > vh * 0.06;
  }

  function tryOpenFromHeading(modal, heading, obs) {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return false;
    } catch (e) {}
    if (!heading || !headingIsInView(heading)) return false;
    if (isCatalogModalAutoshowBlocked()) return false;
    if (obs) obs.disconnect();
    openModal(modal);
    return true;
  }

  function wireCatalogModalClose(modal) {
    if (catalogModalCloseWired) return;
    catalogModalCloseWired = true;

    function onClose() {
      closeModal(modal);
      scheduleAfterClose(modal);
    }

    modal.querySelectorAll("[data-catalog-modal-close]").forEach(function (el) {
      el.addEventListener("click", onClose);
    });
    document.addEventListener("keydown", function catalogModalEsc(ev) {
      if (ev.key !== "Escape" || modal.hidden) return;
      onClose();
    });
  }

  function initObserver(modal) {
    var heading = document.getElementById("cars-title");
    if (!heading) return;

    wireCatalogModalClose(modal);

    var skipAutoOpen = false;
    try {
      skipAutoOpen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch (e) {}

    if (typeof IntersectionObserver === "undefined") {
      if (skipAutoOpen) return;
      window.addEventListener(
        "scroll",
        function onScroll() {
          if (tryOpenFromHeading(modal, heading, null)) {
            window.removeEventListener("scroll", onScroll);
          }
        },
        { passive: true }
      );
      tryOpenFromHeading(modal, heading, null);
      return;
    }

    if (skipAutoOpen) return;

    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          if (isCatalogModalAutoshowBlocked()) return;
          obs.disconnect();
          openModal(modal);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(heading);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        tryOpenFromHeading(modal, heading, obs);
      });
    });
  }

  function scheduleInit(modal) {
    function run() {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          initObserver(modal);
        });
      });
    }
    if (document.readyState === "complete") {
      run();
    } else {
      window.addEventListener("load", run);
    }
  }

  var bodyEl = document.getElementById("catalog-modal-body");
  var modal = document.getElementById("catalog-modal");
  if (!bodyEl || !modal) return;

  window.autoBridgeOpenCatalogModal = function () {
    if (!catalogModalData) return;
    renderForm(bodyEl, catalogModalData);
    openModal(modal);
  };

  fetch("data/catalog-modal.json")
    .then(function (r) {
      if (!r.ok) throw new Error("catalog-modal.json");
      return r.json();
    })
    .then(function (data) {
      catalogModalData = data;
      setupCatalogModalBlockListeners();
      renderForm(bodyEl, data);
      scheduleSiteTimer(modal);
      scheduleInit(modal);
    })
    .catch(function () {
      bodyEl.innerHTML =
        '<p class="catalog-modal__error">Не удалось загрузить форму.</p>';
    });
})();
