(function () {
  "use strict";

  function parseStatValue(valueStr) {
    var m = String(valueStr).match(/^(\d+)(.*)$/);
    if (!m) return { target: 0, suffix: "" };
    return { target: parseInt(m[1], 10), suffix: m[2] || "" };
  }

  function prefersReducedMotion() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function animateStatValue(el, target, suffix, duration, delayMs) {
    duration = duration || 1700;
    delayMs = delayMs || 0;
    var t0 = null;

    function tick(now) {
      if (t0 === null) t0 = now;
      var elapsed = now - t0;
      if (elapsed < delayMs) {
        requestAnimationFrame(tick);
        return;
      }
      var t = Math.min(1, (now - t0 - delayMs) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      var current = Math.round(eased * target);
      el.textContent = current + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }

    el.textContent = "0" + suffix;
    requestAnimationFrame(tick);
  }

  function initStatsCountUp(statsWrap, statsData) {
    if (!statsWrap || !statsData || !statsData.length) return;

    var values = statsWrap.querySelectorAll(".hero__stat-value");
    var run = function () {
      if (prefersReducedMotion()) {
        statsData.forEach(function (item, i) {
          if (values[i]) values[i].textContent = item.value;
        });
        return;
      }
      statsData.forEach(function (item, i) {
        if (!values[i]) return;
        var p = parseStatValue(item.value);
        animateStatValue(values[i], p.target, p.suffix, 1700, i * 100);
      });
    };

    if (typeof IntersectionObserver === "undefined") {
      run();
      return;
    }

    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          obs.disconnect();
          run();
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -5% 0px" }
    );
    obs.observe(statsWrap);
  }

  function renderPhone(data) {
    var el = document.getElementById("header-phone");
    if (!el || !data.phone) return;
    if (data.phone.href) el.href = data.phone.href;
    if (data.phone.text != null) el.textContent = data.phone.text;
  }

  function renderHero(root, data) {
    root.innerHTML = "";

    var h1 = document.createElement("h1");
    h1.className = "hero__title";
    h1.textContent = data.title;
    root.appendChild(h1);

    var lead = document.createElement("p");
    lead.className = "hero__lead";
    lead.textContent = data.lead;
    root.appendChild(lead);

    var cta = document.createElement("a");
    cta.className = "hero__cta";
    cta.href = data.cta && data.cta.href ? data.cta.href : "#";
    cta.textContent = (data.cta && data.cta.text) || "";
    root.appendChild(cta);

    var statsWrap = document.createElement("div");
    statsWrap.className = "hero__stats";
    (data.stats || []).forEach(function (item) {
      var stat = document.createElement("div");
      stat.className = "hero__stat";
      var val = document.createElement("span");
      val.className = "hero__stat-value";
      var p = parseStatValue(item.value);
      val.textContent = prefersReducedMotion() ? item.value : "0" + p.suffix;
      var lab = document.createElement("span");
      lab.className = "hero__stat-label";
      lab.textContent = item.label;
      stat.appendChild(val);
      stat.appendChild(lab);
      statsWrap.appendChild(stat);
    });
    root.appendChild(statsWrap);
    initStatsCountUp(statsWrap, data.stats || []);
  }

  var root = document.getElementById("hero-inner");
  if (!root) return;

  fetch("data/hero.json")
    .then(function (r) {
      if (!r.ok) throw new Error("hero.json");
      return r.json();
    })
    .then(function (data) {
      renderPhone(data);
      renderHero(root, data);
    })
    .catch(function () {
      root.setAttribute("data-hero-error", "1");
    });
})();
