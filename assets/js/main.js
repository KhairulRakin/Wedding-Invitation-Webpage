/* ============================================================
   main.js — boot. The only place init order is expressed.

   Order matters:
     music      arms playback before the seal can start it
     envelope   unlocks the body before layout-dependent modules
     petals     decorative, reduced-motion aware
     scratch    sizes the canvas after the body is unlocked
     saveTheDate  fills the calendar link
     countdown  starts the 1s tick
     slideshow  starts the 5.2s advance
     rsvp       binds the form
     reveal     observes last, once the document is stable
   ============================================================ */
(function () {
  "use strict";

  var Wedding = window.Wedding;
  var order = [
    "music",
    "envelope",
    "petals",
    "scratch",
    "saveTheDate",
    "countdown",
    "slideshow",
    "rsvp",
    "reveal",
  ];

  for (var i = 0; i < order.length; i++) {
    var init = Wedding.modules[order[i]];
    if (typeof init === "function") init();
  }
})();
