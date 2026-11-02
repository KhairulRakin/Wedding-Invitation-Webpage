/* ============================================================
   save-the-date.js — builds the .ics download link
   ============================================================ */
(function () {
  "use strict";

  var Wedding = window.Wedding;

  Wedding.modules.saveTheDate = function saveTheDate() {
    var start = "20270127T200000";
    var end = "20270127T230000";
    var ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Md. Shahed and Ms. Priyanka//Wedding//EN",
      "BEGIN:VEVENT",
      "UID:md-shahed-ms-priyanka-wedding-20270127@invitation",
      "DTSTAMP:20261102T000000Z",
      "DTSTART:" + start,
      "DTEND:" + end,
      "SUMMARY:Md. Shahed & Ms. Priyanka — Wedding Ceremony",
      "LOCATION:Kara Convention Center\\, 30/3 Umesh\\, Nandakumar Dutta Rd\\, Dhaka 1211",
      "DESCRIPTION:Join us as we celebrate the wedding of Md. Shahed & Ms. Priyanka. Guest arrival 7:30 PM, ceremony 8:00 PM.",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    var url = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
    Wedding.el("saveDate").setAttribute("href", url);
  };
})();
