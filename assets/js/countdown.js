/* ============================================================
   countdown.js — days / hours / minutes / seconds to the ceremony
   ============================================================ */
(function () {
  "use strict";

  var Wedding = window.Wedding;

  Wedding.modules.countdown = function countdown() {
    var weddingTime = new Date(window.WEDDING.event.startLocal).getTime();
    var cd = {
      days: Wedding.el("cd-days"),
      hours: Wedding.el("cd-hours"),
      minutes: Wedding.el("cd-minutes"),
      seconds: Wedding.el("cd-seconds"),
    };

    function pad(n, size) {
      return String(Math.max(0, n)).padStart(size, "0");
    }

    function tick() {
      var diff = weddingTime - Date.now();
      if (diff <= 0) {
        cd.days.textContent = "00";
        cd.hours.textContent = "00";
        cd.minutes.textContent = "00";
        cd.seconds.textContent = "00";
        return;
      }
      cd.days.textContent = pad(Math.floor(diff / 86400000), 2);
      cd.hours.textContent = pad(Math.floor((diff % 86400000) / 3600000), 2);
      cd.minutes.textContent = pad(Math.floor((diff % 3600000) / 60000), 2);
      cd.seconds.textContent = pad(Math.floor((diff % 60000) / 1000), 2);
    }

    tick();
    setInterval(tick, 1000);
  };
})();
