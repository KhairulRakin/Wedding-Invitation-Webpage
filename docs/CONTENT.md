# Editing content

The visible copy is in `index.html`; the values JavaScript computes are in
`assets/js/config.js`. Nothing is generated at runtime from a CMS, so a content
change is a small, deliberate edit.

## Where each value lives

| What | Where | Notes |
|---|---|---|
| Couple's names | `index.html` | 9 occurrences each of `Shahed` and `Priyanka` — title, meta, hero, intro, letter, scratch card, closing |
| Wedding date (visible) | `index.html` | 7 occurrences of `2027` — title, meta description, hero, intro, scratch card, timeline, footer |
| Wedding date (computed) | `assets/js/config.js` → `event.startLocal` | Drives the countdown **and** the `.ics` `DTSTART` |
| Ceremony end | `config.js` → `event.endLocal` | `.ics` `DTEND` only |
| Arrival / ceremony times | `index.html` (timeline) and `config.js` → `event.description` | The calendar description repeats them |
| Reception | `index.html` (timeline) | Not part of the `.ics` |
| Venue name | `index.html` (5 occurrences) and `config.js` → `event.venueName` / `event.venue` | The `.ics` location is built from `event.venue` |
| Venue address | `index.html` (venue section, map link) and `config.js` → `event.venueAddress` / `event.venue` | Map link is a Google Maps query string |
| RSVP inbox | `config.js` → `rsvp.email` and `rsvp.endpoint` | Endpoint is FormSubmit's AJAX URL |
| RSVP subject line | `config.js` → `rsvp.subject` | Shown in the notification email |
| Calendar summary / UID | `config.js` → `event.summary`, `event.uid`, `event.prodid`, `event.dtstamp` | |
| Background music | `config.js` → `music.src` | The `<audio>` element has no `src` in the HTML |
| Music volume | `config.js` → `music.volume` | Target volume after the fade-in |
| Gallery photos | `assets/img/gallery/slide-2.jpg` … `slide-4.jpg` + `index.html` alt text | Order follows the markup |
| Hero photo | `assets/css/components.css` → `.hero-bg` `url("../img/gallery/slide-1.jpg")` | |
| Page backgrounds | `assets/css/components.css` → three `url("../img/backgrounds/…")` rules | |
| Gift note | `index.html` (Gifts section) | |
| Footer credit | `index.html` (`footer-credit`) | |

## Changing the date

1. Edit `event.startLocal` and `event.endLocal` in `assets/js/config.js`.
2. Update the visible date everywhere `2027` appears — run:

   ```powershell
   Select-String -Path index.html -Pattern '2027'
   ```

3. Update `event.description` if the times changed.
4. Run `npm test` — the suite asserts the `.ics` `DTSTART`.

The hero, intro, scratch card, timeline and footer are plain HTML on purpose.
They are not hydrated from `config.js`, so they must be edited directly.

## Changing the couple's names

Names appear in `index.html`, in `config.js` (`couple`, `event.summary`,
`event.prodid`, `event.uid`), and in the page `<title>` / meta tags. Search both
files:

```powershell
Select-String -Path index.html,assets/js/config.js -Pattern 'Shahed|Priyanka'
```

## Replacing photos

Keep the filenames (`slide-2.jpg` … `slide-4.jpg`, `slide-1.jpg`) and overwrite
the files. The gallery frame is `aspect-ratio: 3 / 2` with `object-fit: cover`,
so any photo is cropped to that shape.

## Rules of thumb

- Do not rename an ID listed in `docs/ARCHITECTURE.md`; JavaScript uses them.
- Do not change the load order of the CSS or JS files.
- Keep the guest-facing tone consistent: no exclamation marks except the
  existing "You're Invited!".
- After any content change, run the interaction suite and the visual reference
  check.
