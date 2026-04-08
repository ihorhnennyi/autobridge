(function () {
  "use strict";

  var URL = "api/send-telegram.php";

  function dash(v) {
    if (v == null || v === "") return "—";
    return String(v);
  }

  function collectClientMetaSync() {
    var n = window.navigator;
    var s = window.screen;
    var c = n.connection || n.mozConnection || n.webkitConnection;
    var meta = {
      page_url: location.href.split("#")[0],
      referrer: document.referrer || "—",
      tz: (function () {
        try {
          return Intl.DateTimeFormat().resolvedOptions().timeZone || "—";
        } catch (e) {
          return "—";
        }
      })(),
      lang: dash(n.language),
      languages: (n.languages && n.languages.length ? n.languages.join(", ") : "—"),
      platform: dash(n.platform),
      vendor: dash(n.vendor),
      ua_client: dash(n.userAgent),
      screen: s ? s.width + "×" + s.height : "—",
      avail_screen: s ? s.availWidth + "×" + s.availHeight : "—",
      color_depth: s ? String(s.colorDepth) : "—",
      pixel_ratio: String(window.devicePixelRatio || 1),
      viewport: window.innerWidth + "×" + window.innerHeight,
      touch_points: String(n.maxTouchPoints != null ? n.maxTouchPoints : "—"),
      cores: String(n.hardwareConcurrency != null ? n.hardwareConcurrency : "—"),
      device_memory_gb: n.deviceMemory != null ? String(n.deviceMemory) : "—",
      online: String(n.onLine),
      cookies: String(n.cookieEnabled),
      conn_type: c ? dash(c.effectiveType || c.type) : "—",
      conn_downlink: c && c.downlink != null ? String(c.downlink) + " Мбит/с" : "—",
    };
    if (n.userAgentData) {
      meta.ua_mobile = String(!!n.userAgentData.mobile);
      try {
        meta.ua_brands = JSON.stringify(n.userAgentData.brands || []);
      } catch (e2) {
        meta.ua_brands = "—";
      }
    }
    return meta;
  }

  function enrichMetaWithHints(meta) {
    var n = navigator;
    if (!n.userAgentData || !n.userAgentData.getHighEntropyValues) {
      return Promise.resolve(meta);
    }
    return n.userAgentData
      .getHighEntropyValues([
        "model",
        "platform",
        "platformVersion",
        "architecture",
        "bitness",
        "fullVersionList",
      ])
      .then(function (h) {
        meta.hint_model = dash(h.model);
        meta.hint_platform = dash(h.platform);
        meta.hint_platform_version = dash(h.platformVersion);
        meta.hint_arch = dash(h.architecture);
        meta.hint_bitness = dash(h.bitness);
        try {
          meta.hint_full_versions = JSON.stringify(h.fullVersionList || []);
        } catch (e) {
          meta.hint_full_versions = "—";
        }
        return meta;
      })
      .catch(function () {
        return meta;
      });
  }

  function sendTelegram(source, payload) {
    var metaBase = collectClientMetaSync();
    return enrichMetaWithHints(metaBase).then(function (meta) {
      return fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          source: source,
          payload: payload || {},
          meta: meta,
        }),
      });
    }).then(function (r) {
      return r.text().then(function (text) {
        if (r.status === 404 || r.status === 405) {
          throw new Error("OPEN_VIA_PHP");
        }
        var data;
        try {
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          throw new Error("invalid_response");
        }
        if (!r.ok || !data || !data.ok) {
          var err = (data && data.error) || "request_failed";
          throw new Error(err);
        }
        return data;
      });
    });
  }

  window.autoBridgeSendTelegram = sendTelegram;

  window.autoBridgeTelegramErrorMessage = function (err) {
    if (err && err.message === "OPEN_VIA_PHP") {
      return (
        "Формы отправляются через PHP. Live Server здесь не подходит: в папке проекта выполните «php -S 127.0.0.1:8765» и откройте http://127.0.0.1:8765"
      );
    }
    return "";
  };
})();
