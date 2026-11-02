/* ============================================================
   envelope.js — wax seal, body unlock, scroll cue
   ============================================================ */
(function () {
  "use strict";

  var Wedding = window.Wedding;

  Wedding.modules.envelope = function envelope() {
    var intro = Wedding.el("intro");
    var openBtn = Wedding.el("openInvite");
    var opened = false;

    function openInvitation() {
      if (opened) return;
      opened = true;
      intro.classList.add("opening");
      document.body.classList.remove("locked");
      document.body.classList.add("opened");
      Wedding.Music.play();
      setTimeout(function () {
        intro.setAttribute("aria-hidden", "true");
        intro.style.visibility = "hidden";
      }, 1700);
    }

    openBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      openInvitation();
    });
    intro.addEventListener("click", openInvitation);
    intro.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openInvitation();
      }
    });

    Wedding.el("scrollCue").addEventListener("click", function () {
      Wedding.el("invitation").scrollIntoView({
        behavior: Wedding.reduceMotion ? "auto" : "smooth",
      });
    });
  };
})();
