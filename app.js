/* Suitely — shared form handling */
// Set to the live intake endpoint once the business mailbox is active.
window.SUITELY_FORM_ENDPOINT = "";
window.SUITELY_CONTACT_EMAIL = "hello@suitely.ca";

(function () {
  "use strict";
  var themeKey = "suitely-theme";
  try {
    var saved = localStorage.getItem(themeKey);
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  } catch (e) {}
  document.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-theme-toggle]");
    if (!t) return;
    var cur = document.documentElement.getAttribute("data-theme");
    if (!cur) {
      cur = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    var next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(themeKey, next); } catch (e) {}
  });

  function serialize(form) {
    var out = {};
    new FormData(form).forEach(function (v, k) {
      if (out[k]) { out[k] = [].concat(out[k], v); } else { out[k] = v; }
    });
    out._page = location.pathname;
    out._submitted_at = new Date().toISOString();
    return out;
  }

  document.querySelectorAll("form[data-intake]").forEach(function (form) {
    var status = form.querySelector(".formstatus");
    var btn = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!form.reportValidity()) return;
      var data = serialize(form);
      var endpoint = window.SUITELY_FORM_ENDPOINT;
      function show(cls, msg) {
        if (!status) return;
        status.className = "formstatus " + cls;
        status.textContent = msg;
      }
      if (!endpoint) {
        // Mailbox not yet wired: hand the enquiry off without pretending it was filed.
        var subject = encodeURIComponent((form.dataset.intake || "Enquiry") + " — Suitely");
        var lines = Object.keys(data)
          .filter(function (k) { return k.charAt(0) !== "_" && data[k]; })
          .map(function (k) { return k.replace(/_/g, " ") + ": " + data[k]; });
        var href = "mailto:" + window.SUITELY_CONTACT_EMAIL +
          "?subject=" + subject + "&body=" + encodeURIComponent(lines.join("\n"));
        show("ok", "Opening your email app to send this to us — press send and we'll reply the same day.");
        window.location.href = href;
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error("bad status " + r.status);
        form.reset();
        show("ok", form.dataset.success || "Thanks — we've got it. You'll hear from us the same day.");
      }).catch(function () {
        show("err", "That didn't go through. Email us at " + window.SUITELY_CONTACT_EMAIL + " and we'll pick it up right away.");
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = form.dataset.cta || "Send"; }
      });
    });
  });
})();
