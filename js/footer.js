(function () {
  "use strict";

  function renderFooter(root, data) {
    root.innerHTML = "";

    var grid = document.createElement("div");
    grid.className = "footer__grid";

    var col1 = document.createElement("div");
    col1.className = "footer__col";
    var h1 = document.createElement("h2");
    h1.className = "footer__heading";
    h1.textContent = data.aboutTitle || "";
    var p1 = document.createElement("p");
    p1.className = "footer__text";
    p1.textContent = data.aboutText || "";
    col1.appendChild(h1);
    col1.appendChild(p1);

    var col2 = document.createElement("div");
    col2.className = "footer__col";
    var h2 = document.createElement("h2");
    h2.className = "footer__heading";
    h2.textContent = data.contactsTitle || "";
    var email = data.email || "";
    var p2 = document.createElement("p");
    p2.className = "footer__text";
    if (email) {
      var a = document.createElement("a");
      a.className = "footer__link";
      a.href = "mailto:" + email;
      a.textContent = email;
      p2.appendChild(a);
    }
    col2.appendChild(h2);
    col2.appendChild(p2);

    var col3 = document.createElement("div");
    col3.className = "footer__col";
    var h3 = document.createElement("h2");
    h3.className = "footer__heading";
    h3.textContent = data.hoursTitle || "";
    col3.appendChild(h3);
    (data.hours || []).forEach(function (line) {
      var pl = document.createElement("p");
      pl.className = "footer__text footer__text--line";
      pl.textContent = line;
      col3.appendChild(pl);
    });

    grid.appendChild(col1);
    grid.appendChild(col2);
    grid.appendChild(col3);
    root.appendChild(grid);
  }

  var root = document.getElementById("footer-inner");
  if (!root) return;

  fetch("data/footer.json")
    .then(function (r) {
      if (!r.ok) throw new Error("footer.json");
      return r.json();
    })
    .then(function (data) {
      renderFooter(root, data);
    })
    .catch(function () {
      root.setAttribute("data-footer-error", "1");
    });
})();
