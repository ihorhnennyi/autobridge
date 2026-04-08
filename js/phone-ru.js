(function () {
  "use strict";

  var PLACEHOLDER_DEFAULT = "+7 (900) 123-45-67";

  function onlyDigits(s) {
    return String(s).replace(/\D/g, "");
  }

  function toElevenDigits(value) {
    var d = onlyDigits(value);
    if (d.length === 0) return "7";
    if (d.charAt(0) === "8") d = "7" + d.slice(1);
    if (d.charAt(0) !== "7") d = "7" + d;
    return d.slice(0, 11);
  }

  function formatRu(d11) {
    if (!d11 || d11.charAt(0) !== "7") d11 = toElevenDigits(d11 || "");
    var r = d11.slice(1);
    if (r.length === 0) return "+7 ";
    if (r.length <= 3) return "+7 (" + r;
    var a = r.slice(0, 3);
    var b = r.slice(3, 6);
    var c = r.slice(6, 8);
    var e = r.slice(8, 10);
    var out = "+7 (" + a + ")";
    if (b.length) out += " " + b;
    if (c.length) out += "-" + c;
    if (e.length) out += "-" + e;
    return out;
  }

  function digitsCountBeforeCursor(value, cursorPos) {
    var chunk = value.slice(0, cursorPos);
    return onlyDigits(chunk).length;
  }

  function caretAfterDigitIndex(formatted, digitIndex) {
    if (digitIndex <= 0) {
      return Math.min(4, formatted.length);
    }
    var n = 0;
    for (var i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted.charAt(i))) {
        n++;
        if (n >= digitIndex) {
          return i + 1;
        }
      }
    }
    return formatted.length;
  }

  function applyMaskKeepCaret(input) {
    var raw = input.value;
    var pos = input.selectionStart;
    var end = input.selectionEnd;
    var targetDigits =
      pos === end
        ? digitsCountBeforeCursor(raw, pos)
        : onlyDigits(raw.slice(0, pos)).length;

    var d11 = toElevenDigits(raw);
    var formatted = formatRu(d11);
    input.value = formatted;

    var newPos = caretAfterDigitIndex(formatted, targetDigits);
    if (pos === end) {
      try {
        input.setSelectionRange(newPos, newPos);
      } catch (err) {}
    } else {
      try {
        input.setSelectionRange(newPos, formatted.length);
      } catch (err2) {}
    }
  }

  window.autoBridgeValidateRuPhone = function (value) {
    var d11 = toElevenDigits(value || "");
    if (d11.length !== 11) {
      return {
        ok: false,
        error: "Введите номер полностью: +7 и ещё 10 цифр.",
      };
    }
    var rest = d11.slice(1);
    if (rest.charAt(0) === "0") {
      return {
        ok: false,
        error: "После +7 номер не может начинаться с 0.",
      };
    }
    return { ok: true, digits: d11, e164: "+" + d11 };
  };

  window.autoBridgeAttachRuPhoneMask = function (input, opts) {
    if (!input || input.nodeName !== "INPUT") return;
    opts = opts || {};

    input.setAttribute("inputmode", "tel");
    input.setAttribute("autocomplete", "tel");
    input.placeholder = opts.placeholder || PLACEHOLDER_DEFAULT;
    input.type = "tel";

    input.addEventListener("focus", function () {
      if (onlyDigits(input.value).length <= 1) {
        input.value = "+7 ";
        try {
          input.setSelectionRange(4, 4);
        } catch (e) {}
      }
    });

    input.addEventListener("input", function () {
      applyMaskKeepCaret(input);
    });

    input.addEventListener("blur", function () {
      var d = onlyDigits(input.value);
      if (d.length <= 1) {
        input.value = "";
      }
    });

    if (onlyDigits(input.value).length > 0) {
      applyMaskKeepCaret(input);
    }
  };
})();
