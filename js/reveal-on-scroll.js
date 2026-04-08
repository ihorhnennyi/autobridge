(function () {
  "use strict";

  function revealOnScroll(container, itemSelector, visibleClass) {
    if (!container) return;
    var items = container.querySelectorAll(itemSelector);
    if (!items.length) return;

    var staggerMs = 55;

    function revealAll() {
      items.forEach(function (el, i) {
        window.setTimeout(function () {
          el.classList.add(visibleClass);
        }, i * staggerMs);
      });
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach(function (el) {
        el.classList.add(visibleClass);
      });
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      revealAll();
      return;
    }

    var io = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          obs.unobserve(entry.target);
          revealAll();
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(container);
  }

  window.autoBridgeRevealOnScroll = revealOnScroll;
})();
