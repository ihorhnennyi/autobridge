(function () {
  "use strict";

  var data = null;
  var step = 0;
  var answers = {};
  var showContact = false;
  var completed = false;
  var contactName = "";
  var contactPhone = "";

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

  function svgChevron(dir) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "quiz__btn-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    if (dir === "left") {
      path.setAttribute("points", "15 18 9 12 15 6");
    } else {
      path.setAttribute("points", "9 18 15 12 9 6");
    }
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
  }

  function digitsOnly(s) {
    return String(s).replace(/\D/g, "");
  }

  function optionLabel(q, value) {
    var label = value || "—";
    (q.options || []).forEach(function (opt) {
      if (opt.value === value) label = opt.label || opt.value;
    });
    return label;
  }

  function formatQuizAnswersText() {
    var qlist = data.questions || [];
    var parts = [];
    qlist.forEach(function (q) {
      var line = (q.question || "") + "\n→ " + optionLabel(q, answers[q.id]);
      parts.push(line);
    });
    return parts.join("\n\n");
  }

  function syncCatalogModalBlock() {
    if (typeof window.autoBridgeSetQuizBlockingCatalogModal !== "function") return;
    var started =
      !completed &&
      (showContact || Object.keys(answers).length > 0);
    window.autoBridgeSetQuizBlockingCatalogModal(started);
  }

  function resetAll(root) {
    completed = false;
    showContact = false;
    step = 0;
    answers = {};
    contactName = "";
    contactPhone = "";
    render(root);
  }

  function renderCompletion(root) {
    root.innerHTML = "";
    var wrap = el("div", "quiz__inner quiz__inner--enter");
    var intro = el("header", "quiz__intro");
    intro.appendChild(el("h2", "quiz__title", { text: data.completion.title }));
    intro.appendChild(el("p", "quiz__subtitle", { text: data.completion.text }));
    wrap.appendChild(intro);

    var card = el("div", "quiz__card quiz__card--completion");
    var p = el("p", "quiz__completion-hint", {
      text: "Можно пройти квиз ещё раз и изменить ответы."
    });
    card.appendChild(p);

    var btn = el("button", "quiz__btn quiz__btn--primary quiz__btn--solo", {
      type: "button",
      text: "Пройти заново"
    });
    btn.addEventListener("click", function () {
      resetAll(root);
    });
    card.appendChild(btn);
    wrap.appendChild(card);
    root.appendChild(wrap);
  }

  function renderContact(root) {
    var c = data.contact || {};
    root.innerHTML = "";
    var wrap = el("div", "quiz__inner quiz__inner--enter");

    var intro = el("header", "quiz__intro");
    intro.appendChild(el("h2", "quiz__title", { text: data.title }));
    intro.appendChild(el("p", "quiz__subtitle", { text: data.subtitle }));
    wrap.appendChild(intro);

    var qs = data.questions || [];

    var progress = el("div", "quiz__progress");
    var progressTop = el("div", "quiz__progress-top");
    var labelLeft = el("span", "quiz__progress-label", {
      text: c.progressLabel || "Контакты"
    });
    var labelRight = el("span", "quiz__progress-pct", { text: "100%" });
    progressTop.appendChild(labelLeft);
    progressTop.appendChild(labelRight);
    progress.appendChild(progressTop);

    var track = el("div", "quiz__progress-track");
    var fill = el("div", "quiz__progress-fill");
    fill.style.width = "100%";
    track.appendChild(fill);
    progress.appendChild(track);
    wrap.appendChild(progress);

    var card = el("div", "quiz__card");
    var contactH = el("h3", "quiz__question", { text: c.title || "Контакты" });
    contactH.id = "quiz-contact-heading";
    card.appendChild(contactH);
    if (c.subtitle) {
      card.appendChild(el("p", "quiz__contact-lead", { text: c.subtitle }));
    }

    var errBox = el("p", "quiz__form-error");
    errBox.setAttribute("role", "alert");
    errBox.hidden = true;
    card.appendChild(errBox);

    var form = el("form", "quiz__form");
    form.id = "quiz-contact-form";
    form.setAttribute("novalidate", "novalidate");
    form.setAttribute("autocomplete", "on");

    var nameId = "quiz-contact-name";
    var phoneId = "quiz-contact-phone";

    var rowName = el("div", "quiz__field");
    rowName.appendChild(
      el("label", "quiz__field-label", { for: nameId, text: c.nameLabel || "Имя" })
    );
    var nameInput = el("input", "quiz__field-input");
    nameInput.type = "text";
    nameInput.id = nameId;
    nameInput.name = "name";
    nameInput.autocomplete = "name";
    nameInput.placeholder = c.namePlaceholder || "";
    nameInput.value = contactName;
    nameInput.required = true;
    rowName.appendChild(nameInput);
    form.appendChild(rowName);

    var rowPhone = el("div", "quiz__field");
    rowPhone.appendChild(
      el("label", "quiz__field-label", { for: phoneId, text: c.phoneLabel || "Телефон" })
    );
    var phoneInput = el("input", "quiz__field-input");
    phoneInput.type = "tel";
    phoneInput.id = phoneId;
    phoneInput.name = "phone";
    phoneInput.autocomplete = "tel";
    phoneInput.placeholder = c.phonePlaceholder || "";
    phoneInput.setAttribute("inputmode", "tel");
    phoneInput.value = contactPhone;
    phoneInput.required = true;
    rowPhone.appendChild(phoneInput);
    form.appendChild(rowPhone);

    if (typeof window.autoBridgeAttachRuPhoneMask === "function") {
      window.autoBridgeAttachRuPhoneMask(phoneInput, {
        placeholder: c.phonePlaceholder || undefined,
      });
    }

    card.appendChild(form);
    wrap.appendChild(card);

    var nav = el("div", "quiz__nav");
    var backBtn = el("button", "quiz__btn quiz__btn--ghost", { type: "button" });
    backBtn.appendChild(svgChevron("left"));
    backBtn.appendChild(document.createTextNode(" Назад"));
    backBtn.addEventListener("click", function () {
      showContact = false;
      step = qs.length - 1;
      render(root);
    });

    var submitBtn = el("button", "quiz__btn quiz__btn--primary", { type: "submit" });
    submitBtn.setAttribute("form", "quiz-contact-form");
    submitBtn.appendChild(document.createTextNode(c.submit || "Отправить"));

    function showError(msg) {
      errBox.textContent = msg || "";
      errBox.hidden = !msg;
    }

    var quizPhoneE164 = "";

    function validate() {
      contactName = nameInput.value.trim();
      contactPhone = phoneInput.value.trim();
      if (contactName.length < 2) {
        showError("Введите имя.");
        nameInput.focus();
        return false;
      }
      if (typeof window.autoBridgeValidateRuPhone === "function") {
        var pv = window.autoBridgeValidateRuPhone(contactPhone);
        if (!pv.ok) {
          showError(pv.error || "Введите российский номер телефона.");
          phoneInput.focus();
          return false;
        }
        quizPhoneE164 = pv.e164;
      } else {
        var d = digitsOnly(contactPhone);
        if (d.length < 11) {
          showError("Введите корректный номер телефона.");
          phoneInput.focus();
          return false;
        }
        quizPhoneE164 = contactPhone;
      }
      showError("");
      return true;
    }

    nameInput.addEventListener("input", function () {
      contactName = nameInput.value;
    });
    phoneInput.addEventListener("input", function () {
      contactPhone = phoneInput.value;
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;
      var send = window.autoBridgeSendTelegram;
      if (typeof send !== "function") {
        showError("Ошибка загрузки. Обновите страницу.");
        return;
      }
      submitBtn.disabled = true;
      send("quiz", {
        name: contactName,
        phone: quizPhoneE164 || contactPhone,
        answers: formatQuizAnswersText()
      })
        .then(function () {
          completed = true;
          showContact = false;
          render(root);
          requestAnimationFrame(function () {
            if (typeof window.autoBridgeOpenCatalogModal === "function") {
              window.autoBridgeOpenCatalogModal();
            }
          });
        })
        .catch(function (err) {
          var hint =
            window.autoBridgeTelegramErrorMessage && window.autoBridgeTelegramErrorMessage(err);
          showError(
            hint ||
              "Не удалось отправить. Проверьте соединение и попробуйте снова."
          );
          submitBtn.disabled = false;
        });
    });

    nav.appendChild(backBtn);
    nav.appendChild(submitBtn);
    wrap.appendChild(nav);

    root.appendChild(wrap);
    nameInput.focus();
  }

  function renderQuestion(root) {
    var qs = data.questions || [];
    var total = qs.length;
    var q = qs[step];
    if (!q) return;

    root.innerHTML = "";
    var wrap = el("div", "quiz__inner quiz__inner--enter");

    var intro = el("header", "quiz__intro");
    intro.appendChild(el("h2", "quiz__title", { text: data.title }));
    intro.appendChild(el("p", "quiz__subtitle", { text: data.subtitle }));
    wrap.appendChild(intro);

    var progress = el("div", "quiz__progress");
    var progressTop = el("div", "quiz__progress-top");
    var labelLeft = el("span", "quiz__progress-label", {
      text: "Вопрос " + (step + 1) + " из " + total
    });
    var pct = Math.round(((step + 1) / total) * 100);
    var labelRight = el("span", "quiz__progress-pct", { text: pct + "%" });
    progressTop.appendChild(labelLeft);
    progressTop.appendChild(labelRight);
    progress.appendChild(progressTop);

    var track = el("div", "quiz__progress-track");
    var fill = el("div", "quiz__progress-fill");
    fill.style.width = pct + "%";
    track.appendChild(fill);
    progress.appendChild(track);
    wrap.appendChild(progress);

    var card = el("div", "quiz__card");
    var h3 = el("h3", "quiz__question", { text: q.question });
    card.appendChild(h3);

    var fieldset = el("div", "quiz__options");
    fieldset.setAttribute("role", "radiogroup");
    fieldset.setAttribute("aria-labelledby", "quiz-q-heading-" + step);
    h3.id = "quiz-q-heading-" + step;

    var name = "quiz-q-" + q.id;
    var selected = answers[q.id];

    (q.options || []).forEach(function (opt) {
      var id = name + "-" + opt.value;
      var label = el("label", "quiz__option");
      label.setAttribute("for", id);

      var input = el("input", "quiz__input");
      input.type = "radio";
      input.name = name;
      input.value = opt.value;
      input.id = id;
      if (selected === opt.value) input.checked = true;

      input.addEventListener("change", function () {
        answers[q.id] = opt.value;
        updateNav();
        syncCatalogModalBlock();
      });

      var box = el("span", "quiz__option-box");
      box.appendChild(el("span", "quiz__radio", { "aria-hidden": "true" }));

      var body = el("span", "quiz__option-body");
      body.appendChild(el("span", "quiz__option-title", { text: opt.label }));
      if (opt.description) {
        body.appendChild(el("span", "quiz__option-desc", { text: opt.description }));
      }

      box.appendChild(body);
      label.appendChild(input);
      label.appendChild(box);
      fieldset.appendChild(label);
    });

    card.appendChild(fieldset);
    wrap.appendChild(card);

    var nav = el("div", "quiz__nav");
    var backBtn = el("button", "quiz__btn quiz__btn--ghost", { type: "button" });
    backBtn.appendChild(svgChevron("left"));
    backBtn.appendChild(document.createTextNode(" Назад"));
    backBtn.disabled = step === 0;
    backBtn.addEventListener("click", function () {
      if (step > 0) {
        step -= 1;
        render(root);
      }
    });

    var isLast = step === total - 1;
    var nextBtn = el("button", "quiz__btn quiz__btn--primary", { type: "button" });
    nextBtn.appendChild(document.createTextNode("Далее"));
    nextBtn.appendChild(svgChevron("right"));

    function updateNav() {
      var ok = !!answers[q.id];
      nextBtn.disabled = !ok;
    }

    nextBtn.addEventListener("click", function () {
      if (!answers[q.id]) return;
      if (isLast) {
        showContact = true;
        render(root);
      } else {
        step += 1;
        render(root);
      }
    });

    updateNav();

    nav.appendChild(backBtn);
    nav.appendChild(nextBtn);
    wrap.appendChild(nav);

    root.appendChild(wrap);
  }

  function render(root) {
    if (!data) return;
    if (completed) {
      renderCompletion(root);
    } else if (showContact) {
      renderContact(root);
    } else {
      renderQuestion(root);
    }
    syncCatalogModalBlock();
  }

  var root = document.getElementById("quiz-root");
  if (!root) return;

  fetch("data/quiz.json")
    .then(function (r) {
      if (!r.ok) throw new Error("quiz.json");
      return r.json();
    })
    .then(function (json) {
      data = json;
      render(root);
    })
    .catch(function () {
      root.innerHTML =
        '<p class="quiz__error">Не удалось загрузить квиз. Проверьте подключение.</p>';
    });
})();
