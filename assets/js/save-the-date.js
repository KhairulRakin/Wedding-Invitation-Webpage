/* ============================================================
   save-the-date.js — builds the .ics download link from config
   ============================================================ */
(function () {
  "use strict";

  var Wedding = window.Wedding;

  /* "2027-01-27T20:00:00" -> "20270127T200000" (floating local time,
     which is how the printed invitation states it). */
  function icsLocal(iso) {
    return iso.replace(/[-:]/g, "").replace(/\.\d+/, "");
  }

  Wedding.modules.saveTheDate = function saveTheDate() {
    var event = window.WEDDING.event;
    var ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:" + event.prodid,
      "BEGIN:VEVENT",
      "UID:" + event.uid,
      "DTSTAMP:" + event.dtstamp,
      "DTSTART:" + icsLocal(event.startLocal),
      "DTEND:" + icsLocal(event.endLocal),
      "SUMMARY:" + event.summary,
      "LOCATION:" + event.venue.replace(/,/g, "\\,"),
      "DESCRIPTION:" + event.description,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    var url = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
    Wedding.el("saveDate").setAttribute("href", url);
  };
})();
