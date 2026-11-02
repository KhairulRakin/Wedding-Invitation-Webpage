/* ============================================================
   scratch.js — scratch-to-reveal heart card
   Canvas cover, pointer drawing, reveal + heart-drop burst.
   ============================================================ */
(function () {
  "use strict";

  var Wedding = window.Wedding;

  Wedding.modules.scratch = function scratch() {
    var card = Wedding.el("scratchCard");
    var canvas = Wedding.el("scratchCanvas");
    var hint = Wedding.el("scratchHint");
    var burst = Wedding.el("scratchBurst");
    var ctx = canvas.getContext("2d");
    var revealed = false,
      drawing = false,
      last = null,
      moves = 0;
    var cssW = 0,
      cssH = 0,
      dpr = 1;

    function paintCover() {
      if (revealed) return;
      var w = cssW,
        h = cssH;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);

      var grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#9d4a3c");
      grad.addColorStop(0.42, "#7c3128");
      grad.addColorStop(1, "#5d201b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // sparkle dust
      for (var i = 0; i < 170; i++) {
        var x = Math.random() * w;
        var y = Math.random() * h;
        var r = Math.random() * 1.5 + 0.25;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle =
          "rgba(255, 240, 222, " +
          (Math.random() * 0.65 + 0.15).toFixed(2) +
          ")";
        ctx.fill();
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // ornaments
      ctx.strokeStyle = "rgba(250, 235, 216, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.36);
      ctx.quadraticCurveTo(w * 0.5, h * 0.31, w * 0.7, h * 0.36);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.64);
      ctx.quadraticCurveTo(w * 0.5, h * 0.69, w * 0.7, h * 0.64);
      ctx.stroke();

      ctx.fillStyle = "rgba(250, 239, 223, 0.94)";
      ctx.font = "600 " + w * 0.074 + "px Lora, Georgia, serif";
      ctx.fillText("SCRATCH", w / 2, h * 0.44);
      ctx.font = "600 " + w * 0.074 + "px Lora, Georgia, serif";
      ctx.fillText("TO REVEAL", w / 2, h * 0.53);

      // center fleuron
      ctx.fillStyle = "rgba(250, 235, 216, 0.75)";
      ctx.font = w * 0.075 + "px Georgia, serif";
      ctx.fillText("✦", w / 2, h * 0.59);
    }

    function resize() {
      var rect = card.getBoundingClientRect();
      if (!rect.width) return;
      cssW = rect.width;
      cssH = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      paintCover();
    }

    function revealHearts() {
      if (Wedding.reduceMotion || !burst) return;
      var size = card.getBoundingClientRect().width || 220;
      for (var i = 0; i < 24; i++) {
        const heart = document.createElement("span");
        heart.className = "burst-heart";
        heart.style.setProperty("--s", (8 + Math.random() * 9).toFixed(1) + "px");
        heart.style.left = (18 + Math.random() * 64).toFixed(1) + "%";
        heart.style.top = (16 + Math.random() * 46).toFixed(1) + "%";
        heart.style.setProperty(
          "--dx",
          ((Math.random() - 0.5) * size * 0.9).toFixed(0) + "px",
        );
        heart.style.setProperty(
          "--dy",
          (size * (0.55 + Math.random() * 0.7)).toFixed(0) + "px",
        );
        heart.style.setProperty(
          "--rot",
          ((Math.random() - 0.5) * 260).toFixed(0) + "deg",
        );
        heart.style.setProperty("--sc", (0.65 + Math.random() * 0.55).toFixed(2));
        heart.style.setProperty(
          "--dur",
          (1.6 + Math.random() * 1.2).toFixed(2) + "s",
        );
        heart.style.setProperty("--delay", (Math.random() * 0.5).toFixed(2) + "s");
        burst.appendChild(heart);
        heart.addEventListener("animationend", function () {
          heart.remove();
        });
      }
    }

    function reveal() {
      if (revealed) return;
      revealed = true;
      card.classList.add("revealed");
      canvas.style.opacity = "0";
      hint.textContent = "See you there ❤";
      revealHearts();
      setTimeout(function () {
        canvas.style.display = "none";
      }, 900);
    }

    function pointFrom(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function scratchAt(x, y) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, Math.max(17, cssW * 0.075), 0, Math.PI * 2);
      ctx.fill();
      if (last) {
        ctx.lineWidth = Math.max(28, cssW * 0.13);
        ctx.lineCap = "round";
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      last = { x: x, y: y };
      moves++;
      if (moves > 26) reveal();
    }

    canvas.addEventListener("pointerdown", function (e) {
      if (revealed) return;
      drawing = true;
      last = null;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
      var p = pointFrom(e);
      scratchAt(p.x, p.y);
      e.preventDefault();
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!drawing || revealed) return;
      var p = pointFrom(e);
      scratchAt(p.x, p.y);
      e.preventDefault();
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (evt) {
      canvas.addEventListener(evt, function () {
        drawing = false;
        last = null;
      });
    });
    canvas.addEventListener("dblclick", reveal);
    card.addEventListener("dblclick", reveal);

    resize();
    window.addEventListener("resize", function () {
      if (!revealed) resize();
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (!revealed) resize();
      });
    }
    setTimeout(function () {
      if (!revealed && cssW) paintCover();
    }, 600);
  };
})();
