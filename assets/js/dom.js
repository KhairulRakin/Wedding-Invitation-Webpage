/* ============================================================
   dom.js — shared namespace, tiny helpers, scroll policy
   Loaded first. Never contains feature logic.
   ============================================================ */
(function () {
  "use strict";

  var Wedding = window.Wedding || (window.Wedding = {});

  Wedding.modules = Wedding.modules || {};
  Wedding.reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  Wedding.el = function (id) {
    return document.getElementById(id);
  };

  Wedding.on = function (el, type, handler, options) {
    if (el) el.addEventListener(type, handler, options);
  };

  /* The invitation always starts at the wax seal. */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
})();
