/* ============================================================
   music.js — "Paulyudin" wedding track
   Fades in on the seal click, pauses and resumes from the
   fixed button, hides itself if the file cannot be loaded.
   ============================================================ */
(function () {
  "use strict";

  var Wedding = window.Wedding;
  var bgMusic = Wedding.el("bgMusic");
  var musicBtn = Wedding.el("musicBtn");
  var MUSIC_VOLUME = 0.55;
  var musicOn = false;
  var fadeTimer = null;

  function setMusicUi(on) {
    musicOn = on;
    musicBtn.classList.toggle("muted", !on);
    musicBtn.setAttribute("aria-pressed", String(on));
    musicBtn.setAttribute(
      "aria-label",
      on ? "Mute background music" : "Play background music",
    );
  }

  function fadeMusic(target, ms) {
    if (fadeTimer) clearInterval(fadeTimer);
    var start = bgMusic.volume;
    var t0 = performance.now();
    fadeTimer = setInterval(function () {
      var p = Math.min(1, (performance.now() - t0) / ms);
      bgMusic.volume = Math.max(0, Math.min(1, start + (target - start) * p));
      if (p >= 1) {
        clearInterval(fadeTimer);
        fadeTimer = null;
      }
    }, 40);
  }

  function playMusic() {
    bgMusic.volume = 0;
    var played = bgMusic.play();
    var onPlayed = function () {
      setMusicUi(true);
      fadeMusic(MUSIC_VOLUME, 1800);
    };
    if (played && typeof played.then === "function") {
      played.then(onPlayed).catch(function () {
        setMusicUi(false);
      });
    } else {
      onPlayed();
    }
  }

  function pauseMusic() {
    setMusicUi(false);
    fadeMusic(0, 320);
    window.setTimeout(function () {
      if (!musicOn) bgMusic.pause();
    }, 360);
  }

  Wedding.Music = {
    play: playMusic,
    pause: pauseMusic,
    isOn: function () {
      return musicOn;
    },
  };

  Wedding.modules.music = function music() {
    musicBtn.addEventListener("click", function () {
      if (musicOn) pauseMusic();
      else playMusic();
    });

    bgMusic.addEventListener("error", function () {
      musicBtn.style.display = "none";
    });
  };
})();
