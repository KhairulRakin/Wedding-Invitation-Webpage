/* ============================================================
   rsvp.js — FormSubmit AJAX with a mailto fallback
   Every response is delivered to the couple's inbox.
   ============================================================ */
(function () {
  "use strict";

  var Wedding = window.Wedding;

  Wedding.modules.rsvp = function rsvp() {
    var RSVP_EMAIL = "sflshahed@gmail.com";
    var ENDPOINT = "https://formsubmit.co/ajax/" + RSVP_EMAIL;
    var form = Wedding.el("rsvpForm");
    var success = Wedding.el("rsvpSuccess");
    var text = Wedding.el("rsvpSuccessText");
    var status = Wedding.el("rsvpStatus");
    var mailto = Wedding.el("rsvpMailto");
    var submitBtn = form.querySelector('button[type="submit"]');
    var defaultBtnText = submitBtn.textContent;

    function mailtoHref(fullName, attending, note) {
      var subject =
        "RSVP — " +
        fullName +
        (attending === "yes" ? " (attending)" : " (cannot attend)");
      var body =
        "Name: " +
        fullName +
        "\nAttending: " +
        (attending === "yes" ? "Yes" : "No") +
        "\n\nMessage:\n" +
        (note || "—");
      return (
        "mailto:" +
        RSVP_EMAIL +
        "?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body)
      );
    }

    function showSuccess(firstName, attending) {
      text.textContent =
        attending === "yes"
          ? "Thank you, " +
            firstName +
            "! Your RSVP has been sent to the couple — we can't wait to celebrate with you."
          : "Thank you, " +
            firstName +
            ". We're sorry you can't make it, but we appreciate your message.";
      form.hidden = true;
      success.hidden = false;
      success.classList.add("in");
    }

    function showFallback(fullName, attending, note) {
      submitBtn.disabled = false;
      submitBtn.textContent = defaultBtnText;
      mailto.href = mailtoHref(fullName, attending, note);
      status.hidden = false;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = Wedding.el("rsvpName");
      var attend = Wedding.el("rsvpAttend");
      var message = Wedding.el("rsvpMessage");
      if (!name.value.trim()) {
        name.focus();
        name.reportValidity();
        return;
      }
      if (!attend.value) {
        attend.focus();
        attend.reportValidity();
        return;
      }

      var fullName = name.value.trim();
      var firstName = fullName.split(/\s+/)[0];
      var attending = attend.value;
      var note = message.value.trim();

      status.hidden = true;
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";

      fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          Name: fullName,
          Attending: attending === "yes" ? "Yes, attending" : "Cannot attend",
          Message: note || "—",
          _subject: "New RSVP — Md. Shahed & Ms. Priyanka Wedding",
          _template: "table",
          _captcha: "false",
          _honey: "",
        }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json().catch(function () {
            return {};
          });
        })
        .then(function (data) {
          if (data && String(data.success) === "false") {
            throw new Error("Rejected");
          }
          showSuccess(firstName, attending);
        })
        .catch(function () {
          showFallback(fullName, attending, note);
        });
    });
  };
})();
