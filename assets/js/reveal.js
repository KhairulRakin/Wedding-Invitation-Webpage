/* ============================================================
   reveal.js — scroll-triggered reveal, no-op under reduce-motion
   ============================================================ */
(function () {
  "use strict";

  var Wedding = window.Wedding;

  Wedding.modules.reveal = function revealOnScroll() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || Wedding.reduceMotion) {
      items.forEach(function (el) {
        el.classList.add("in");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    items.forEach(function (el) {
      io.observe(el);
    });
  };
})();
