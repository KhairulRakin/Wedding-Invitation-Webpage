/* ============================================================
   config.js — the single source of truth for machine-read values.

   Visible copy (headings, dates on the page, button labels) stays in
   index.html on purpose: it keeps the invitation readable without
   JavaScript, in link previews, and in print.

   Anything JavaScript must *compute* — countdown target, calendar
   file, RSVP endpoint, audio file — is defined here exactly once.
   ============================================================ */
(function () {
  "use strict";

  window.WEDDING = Object.freeze({
    couple: {
      groom: "Md. Shahed",
      bride: "Ms. Priyanka",
    },
    event: {
      /* Wall-clock time at the venue (Asia/Dhaka, UTC+6). No offset:
         it matches how the printed invitation states the time. */
      startLocal: "2027-01-27T20:00:00",
      endLocal: "2027-01-27T23:00:00",
      venueName: "Kara Convention Center",
      venueAddress: "30/3 Umesh, Nandakumar Dutta Rd, Dhaka 1211",
      venue: "Kara Convention Center, 30/3 Umesh, Nandakumar Dutta Rd, Dhaka 1211",
      summary: "Md. Shahed & Ms. Priyanka — Wedding Ceremony",
      prodid: "-//Md. Shahed and Ms. Priyanka//Wedding//EN",
      uid: "md-shahed-ms-priyanka-wedding-20270127@invitation",
      dtstamp: "20261102T000000Z",
      description:
        "Join us as we celebrate the wedding of Md. Shahed & Ms. Priyanka. Guest arrival 7:30 PM, ceremony 8:00 PM.",
    },
    rsvp: {
      email: "sflshahed@gmail.com",
      endpoint: "https://formsubmit.co/ajax/sflshahed@gmail.com",
      subject: "New RSVP — Md. Shahed & Ms. Priyanka Wedding",
    },
    music: {
      src: "assets/audio/paulyudin-wedding-wedding-music-574002.mp3",
      volume: 0.55,
    },
  });
})();
