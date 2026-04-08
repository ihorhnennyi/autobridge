(function () {
  "use strict";

  var callModalData = null;
  var callModalCloseWired = false;
  var callModalSuccessTimer = null;

  function clearSuccessTimer() {
    if (callModalSuccessTimer !== null) {
      clearTimeout(callModalSuccessTimer);
      callModalSuccessTimer = null;
    }
  }

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

  function appendDirectDial(stateBlock, err) {
    var btn = document.getElementById("call-float");
    var href = btn && btn.dataset && btn.dataset.phoneHref;
    if (!href) return;
    var text = (btn.dataset.phoneText || href || "").trim();
    var p = el("p", "call-modal__direct");
    p.appendChild(document.createTextNode("Или позвоните: "));
    var a = el("a", "call-modal__direct-link", { href: href, text: text });
    a.setAttribute("rel", "noopener noreferrer");
    p.appendChild(a);
    stateBlock.insertBefore(p, err);
  }

  function renderForm(body, data, modal) {
    clearSuccessTimer();
    if (modal) {
      modal.classList.remove("modal--catalog-thankyou");
      modal.setAttribute("aria-labelledby", "call-modal-title");
    }
    body.innerHTML = "";

    var h2 = el("h2", "catalog-modal__title", {
      id: "call-modal-title",
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
    appendDirectDial(stateBlock, err);
    stateBlock.appendChild(err);

    var success = el("div", "catalog-modal__success");
    success.setAttribute("role", "status");
    success.setAttribute("aria-live", "polite");
    success.hidden = true;
    success.appendChild(
      el("h3", "catalog-modal__success-title", {
        id: "call-modal-success-heading",
        text: data.successTitle || "Готово"
      })
    );
    success.appendChild(
      el("p", "catalog-modal__success-text", {
        text: data.successText || ""
      })
    );

    var form = el("form", "catalog-modal__form");
    form.id = "call-modal-form";
    form.setAttribute("novalidate", "novalidate");
    form.setAttribute("autocomplete", "on");

    function field(id, labelText, inputType, placeholder, auto) {
      var row = el("div", "consult__field");
      row.appendChild(el("label", "consult__label", { for: id, text: labelText }));
      var inp = el("input", "consult__input");
      inp.id = id;
      inp.type = inputType;
      inp.name = id.replace("call-modal-", "");
      inp.placeholder = placeholder || "";
      inp.autocomplete = auto;
      if (inputType === "tel") inp.setAttribute("inputmode", "tel");
      row.appendChild(inp);
      return { row: row, input: inp };
    }

    var nameF = field(
      "call-modal-name",
      data.nameLabel || "Имя",
      "text",
      data.namePlaceholder,
      "name"
    );
    var phoneF = field(
      "call-modal-phone",
      data.phoneLabel || "Телефон",
      "tel",
      data.phonePlaceholder,
      "tel"
    );

    form.appendChild(nameF.row);
    form.appendChild(phoneF.row);

    if (typeof window.autoBridgeAttachRuPhoneMask === "function") {
      window.autoBridgeAttachRuPhoneMask(phoneF.input, {
        placeholder: data.phonePlaceholder || undefined
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
      send("quick_call", { name: name, phone: phoneCheck.e164 })
        .then(function () {
          stateBlock.hidden = true;
          success.hidden = false;
          if (modal) {
            modal.classList.add("modal--catalog-thankyou");
            modal.setAttribute("aria-labelledby", "call-modal-success-heading");
          }
          clearSuccessTimer();
          callModalSuccessTimer = window.setTimeout(function () {
            callModalSuccessTimer = null;
            if (modal) closeModal(modal);
          }, 5000);
        })
        .catch(function (err) {
          var hint =
            window.autoBridgeTelegramErrorMessage &&
            window.autoBridgeTelegramErrorMessage(err);
          showError(hint || "Не удалось отправить. Попробуйте ещё раз.");
          submitBtn.disabled = false;
        });
    });

    stateBlock.appendChild(form);
    body.appendChild(stateBlock);
    body.appendChild(success);
  }

  function closeModal(modal) {
    if (!modal) return;
    clearSuccessTimer();
    var wasThank = modal.classList.contains("modal--catalog-thankyou");
    modal.classList.remove("modal--open");
    modal.classList.remove("modal--catalog-thankyou");
    modal.setAttribute("aria-labelledby", "call-modal-title");
    modal.hidden = true;
    document.body.style.overflow = "";
    if (wasThank && callModalData && bodyEl) {
      renderForm(bodyEl, callModalData, modal);
    }
  }

  function openModal(modal) {
    if (!modal) return;
    clearSuccessTimer();
    modal.hidden = false;
    modal.classList.add("modal--open");
    document.body.style.overflow = "hidden";
    var closeBtn = modal.querySelector(".modal__close");
    if (closeBtn) closeBtn.focus();
  }

  function wireClose(modal) {
    if (callModalCloseWired) return;
    callModalCloseWired = true;

    function onClose() {
      closeModal(modal);
    }

    modal.querySelectorAll("[data-call-modal-close]").forEach(function (el) {
      el.addEventListener("click", onClose);
    });
    document.addEventListener("keydown", function callModalEsc(ev) {
      if (ev.key !== "Escape" || modal.hidden) return;
      onClose();
    });
  }

  function bindHeaderPhone() {
    var hp = document.getElementById("header-phone");
    if (!hp || hp.getAttribute("data-call-modal-bound") === "1") return;
    hp.setAttribute("data-call-modal-bound", "1");
    hp.addEventListener("click", function (e) {
      var open = window.autoBridgeOpenCallModal;
      if (typeof open === "function" && open()) {
        e.preventDefault();
      }
    });
  }

  var bodyEl = document.getElementById("call-modal-body");
  var modal = document.getElementById("call-modal");

  window.autoBridgeOpenCallModal = function () {
    if (!bodyEl || !modal || !callModalData) return false;
    renderForm(bodyEl, callModalData, modal);
    openModal(modal);
    return true;
  };

  if (!bodyEl || !modal) return;

  var callModalJsonUrl = new URL("data/call-modal.json", window.location.href).toString();

  fetch(callModalJsonUrl)
    .then(function (r) {
      if (!r.ok) throw new Error("call-modal.json");
      return r.json();
    })
    .then(function (data) {
      callModalData = data;
      renderForm(bodyEl, data, modal);
      wireClose(modal);
      bindHeaderPhone();
    })
    .catch(function () {
      bodyEl.innerHTML =
        '<p class="catalog-modal__error">Не удалось загрузить форму.</p>';
    });
})();
