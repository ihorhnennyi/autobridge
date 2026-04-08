(function () {
  "use strict";

  var KEY = "autobridge_scroll_y";

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  window.addEventListener(
    "pagehide",
    function () {
      try {
        sessionStorage.setItem(KEY, String(window.scrollY));
      } catch (e) {}
    },
    { capture: true }
  );

  window.addEventListener("load", function () {
    try {
      var raw = sessionStorage.getItem(KEY);
      if (raw === null) return;
      var y = parseInt(raw, 10);
      if (isNaN(y) || y < 0) return;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          window.scrollTo(0, y);
        });
      });
    } catch (e) {}
  });
})();
