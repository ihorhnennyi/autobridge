(function () {
  "use strict";

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

  function svgIcon(type) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "consult__icon-svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "currentColor");
    if (type === "email") {
      path.setAttribute(
        "d",
        "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"
      );
    } else {
      path.setAttribute(
        "d",
        "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
      );
    }
    svg.appendChild(path);
    return svg;
  }

  function svgCheck() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "consult__check-svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2.5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("d", "M20 6L9 17l-5-5");
    svg.appendChild(path);
    return svg;
  }

  function renderConsult(root, data) {
    root.innerHTML = "";

    var intro = el("header", "consult__intro");
    intro.appendChild(el("h2", "consult__title", { text: data.title || "" }));
    if (data.subtitle) {
      intro.appendChild(el("p", "consult__subtitle", { text: data.subtitle }));
    }
    root.appendChild(intro);

    var layout = el("div", "consult__layout");

    var f = data.form || {};
    var formWrap = el("div", "consult__form-wrap");

    var err = el("p", "consult__form-error");
    err.setAttribute("role", "alert");
    err.hidden = true;

    var success = el("div", "consult__success");
    success.hidden = true;
    success.appendChild(el("h3", "consult__success-title", { text: f.successTitle || "Готово" }));
    success.appendChild(el("p", "consult__success-text", { text: f.successText || "" }));

    var form = el("form", "consult__form");
    form.id = "consult-form";
    form.setAttribute("novalidate", "novalidate");
    form.setAttribute("autocomplete", "on");

    function field(id, labelText, inputType, placeholder, auto) {
      var row = el("div", "consult__field");
      row.appendChild(el("label", "consult__label", { for: id, text: labelText }));
      var inp = el("input", "consult__input");
      inp.id = id;
      inp.type = inputType;
      inp.name = id.replace("consult-", "");
      inp.placeholder = placeholder || "";
      inp.autocomplete = auto;
      if (inputType === "tel") inp.setAttribute("inputmode", "tel");
      if (inputType === "email") inp.setAttribute("inputmode", "email");
      row.appendChild(inp);
      return { row: row, input: inp };
    }

    var nameF = field("consult-name", f.nameLabel || "Имя", "text", f.namePlaceholder, "name");
    var phoneF = field("consult-phone", f.phoneLabel || "Телефон", "tel", f.phonePlaceholder, "tel");
    var emailF = field("consult-email", f.emailLabel || "Email", "email", f.emailPlaceholder, "email");

    if (typeof window.autoBridgeAttachRuPhoneMask === "function") {
      window.autoBridgeAttachRuPhoneMask(phoneF.input, {
        placeholder: f.phonePlaceholder || undefined,
      });
    }

    form.appendChild(nameF.row);
    form.appendChild(phoneF.row);
    form.appendChild(emailF.row);

    var submitBtn = el("button", "consult__submit", {
      type: "submit",
      text: f.submit || "Отправить"
    });
    form.appendChild(submitBtn);

    function showError(msg) {
      err.textContent = msg || "";
      err.hidden = !msg;
    }

    function simpleEmailOk(s) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      showError("");
      var name = nameF.input.value.trim();
      var phone = phoneF.input.value.trim();
      var email = emailF.input.value.trim();
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
      if (!simpleEmailOk(email)) {
        showError("Укажите корректный email.");
        emailF.input.focus();
        return;
      }
      var send = window.autoBridgeSendTelegram;
      if (typeof send !== "function") {
        showError("Ошибка загрузки. Обновите страницу.");
        return;
      }
      submitBtn.disabled = true;
      send("consult", {
        name: name,
        phone: phoneCheck.e164,
        email: email,
      })
        .then(function () {
          form.hidden = true;
          err.hidden = true;
          success.hidden = false;
          window.setTimeout(function () {
            if (typeof window.autoBridgeOpenCatalogModal === "function") {
              window.autoBridgeOpenCatalogModal();
            }
          }, 500);
        })
        .catch(function (err) {
          var hint =
            window.autoBridgeTelegramErrorMessage && window.autoBridgeTelegramErrorMessage(err);
          showError(
            hint || "Не удалось отправить заявку. Попробуйте ещё раз."
          );
          submitBtn.disabled = false;
        });
    });

    formWrap.appendChild(err);
    formWrap.appendChild(success);
    formWrap.appendChild(form);
    layout.appendChild(formWrap);

    var aside = el("div", "consult__aside");

    (data.contacts || []).forEach(function (c) {
      var block = el("article", "consult__contact");
      var iconWrap = el("div", "consult__contact-icon");
      iconWrap.appendChild(svgIcon(c.type === "email" ? "email" : "location"));
      var body = el("div", "consult__contact-body");
      body.appendChild(el("h3", "consult__contact-title", { text: c.title || "" }));
      var valP = el("p", "consult__contact-value");
      if (c.type === "email" && c.value) {
        var a = el("a", "consult__contact-link", {
          href: "mailto:" + c.value,
          text: c.value
        });
        valP.appendChild(a);
      } else {
        valP.textContent = c.value || "";
      }
      body.appendChild(valP);
      if (c.hint) {
        body.appendChild(el("p", "consult__contact-hint", { text: c.hint }));
      }
      block.appendChild(iconWrap);
      block.appendChild(body);
      aside.appendChild(block);
    });

    var g = data.guarantee || {};
    var guar = el("div", "consult__guarantee");
    guar.appendChild(el("h4", "consult__guarantee-title", { text: g.title || "" }));
    if (g.text) {
      guar.appendChild(el("p", "consult__guarantee-text", { text: g.text }));
    }
    var badge = el("div", "consult__guarantee-badge");
    var checkCircle = el("span", "consult__check-circle");
    checkCircle.appendChild(svgCheck());
    badge.appendChild(checkCircle);
    badge.appendChild(el("span", "consult__guarantee-badge-text", { text: g.badgeText || "" }));
    guar.appendChild(badge);
    aside.appendChild(guar);

    layout.appendChild(aside);
    root.appendChild(layout);
    if (typeof window.autoBridgeRevealOnScroll === "function") {
      window.autoBridgeRevealOnScroll(
        layout,
        ".consult__form-wrap, .consult__aside",
        "consult__panel--revealed"
      );
    }
  }

  var root = document.getElementById("consult-inner");
  if (!root) return;

  fetch("data/consult.json")
    .then(function (r) {
      if (!r.ok) throw new Error("consult.json");
      return r.json();
    })
    .then(function (data) {
      renderConsult(root, data);
    })
    .catch(function () {
      root.innerHTML =
        '<p class="consult__error">Не удалось загрузить блок. Проверьте подключение.</p>';
    });
})();
