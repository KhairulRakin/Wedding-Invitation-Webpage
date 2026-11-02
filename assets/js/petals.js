/* ============================================================
   petals.js — decorative falling petals (skipped on reduce-motion)
   ============================================================ */
(function () {
  "use strict";

  var Wedding = window.Wedding;

  Wedding.modules.petals = function petals() {
    if (Wedding.reduceMotion) return;
    var layer = Wedding.el("petals");
    for (var i = 0; i < 18; i++) {
      var p = document.createElement("span");
      p.className = "petal";
      p.style.setProperty("--x", (Math.random() * 104 - 2).toFixed(2) + "%");
      p.style.setProperty("--s", (Math.random() * 8 + 6).toFixed(1) + "px");
      p.style.setProperty("--d", (Math.random() * 9 + 10).toFixed(1) + "s");
      p.style.setProperty("--delay", (-Math.random() * 16).toFixed(1) + "s");
      p.style.setProperty("--drift", (Math.random() * 120 - 60).toFixed(0) + "px");
      layer.appendChild(p);
    }
  };
})();
