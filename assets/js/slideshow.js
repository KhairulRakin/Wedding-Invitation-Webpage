/* ============================================================
   slideshow.js — gallery auto-advance, dots, reduce-motion aware
   ============================================================ */
(function () {
  "use strict";

  var Wedding = window.Wedding;

  Wedding.modules.slideshow = function slideshow() {
    var imgs = Array.from(
      document.querySelectorAll("#gallery .gallery-frame img"),
    );
    var dots = Array.from(document.querySelectorAll("#gallery .gallery-dot"));
    var current = 0,
      timer = null;

    function show(index) {
      current = index;
      imgs.forEach(function (img, i) {
        img.classList.toggle("active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
        dot.setAttribute("aria-selected", String(i === index));
      });
    }

    function next() {
      show((current + 1) % imgs.length);
    }

    function play() {
      if (Wedding.reduceMotion) return;
      stop();
      timer = setInterval(next, 5200);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        play();
      });
    });

    if (imgs.length > 1) play();
  };
})();
