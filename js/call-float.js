(function () {
  "use strict";

  var SCROLL_SHOW_PX = 32;

  var wrap = document.getElementById("float-actions");
  var link = document.getElementById("call-float");
  var tgLink = document.getElementById("float-telegram");
  var scrollBtn = document.getElementById("scroll-top-btn");
  if (!wrap || !link) return;

  var labelEl = link.querySelector(".call-float__label");
  var hintEl = link.querySelector(".call-float__hint");

  function applyData(data) {
    var phone = data && data.phone;
    if (phone && phone.href) {
      link.dataset.phoneHref = phone.href;
      if (phone.text) link.dataset.phoneText = phone.text;
    }
    var tg = data && data.telegram;
    if (tgLink && tg && tg.href) {
      tgLink.href = tg.href;
      tgLink.setAttribute("aria-label", tg.label || "Telegram");
    }
    var cf = data && data.callFloat;
    var label = (cf && cf.label) || "Позвонить";
    var hint = (cf && cf.hint) || "";
    link.setAttribute("aria-label", hint ? label + " — " + hint : label);
    if (labelEl) labelEl.textContent = label;
    if (hintEl) {
      hintEl.textContent = hint;
      hintEl.hidden = !hint;
    }
  }

  function setVisible(show) {
    wrap.classList.toggle("float-actions--visible", show);
    wrap.setAttribute("aria-hidden", show ? "false" : "true");
    if (!show) {
      link.setAttribute("tabindex", "-1");
      if (tgLink) tgLink.setAttribute("tabindex", "-1");
      if (scrollBtn) scrollBtn.setAttribute("tabindex", "-1");
    } else {
      link.removeAttribute("tabindex");
      if (tgLink) tgLink.removeAttribute("tabindex");
      if (scrollBtn) scrollBtn.removeAttribute("tabindex");
    }
  }

  function prefersReducedMotion() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  if (scrollBtn) {
    scrollBtn.addEventListener("click", function () {
      if (prefersReducedMotion()) {
        window.scrollTo(0, 0);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  fetch(new URL("data/hero.json", window.location.href).toString())
    .then(function (r) {
      if (!r.ok) throw new Error("hero.json");
      return r.json();
    })
    .then(function (data) {
      applyData(data);
    })
    .catch(function () {});

  var firstScreen = document.querySelector(".first-screen");

  function effectiveScrollTop() {
    var doc =
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      0;
    var inner = firstScreen ? firstScreen.scrollTop || 0 : 0;
    return Math.max(doc, inner);
  }

  function onScroll() {
    setVisible(effectiveScrollTop() > SCROLL_SHOW_PX);
  }

  if (firstScreen) {
    firstScreen.addEventListener("scroll", onScroll, { passive: true });
  }

  link.addEventListener("click", function (e) {
    e.preventDefault();
    function tryOpen() {
      return (
        typeof window.autoBridgeOpenCallModal === "function" &&
        window.autoBridgeOpenCallModal()
      );
    }
    if (tryOpen()) return;
    window.setTimeout(function () {
      if (tryOpen()) return;
      if (link.dataset.phoneHref) {
        window.location.href = link.dataset.phoneHref;
      }
    }, 450);
  });

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();
