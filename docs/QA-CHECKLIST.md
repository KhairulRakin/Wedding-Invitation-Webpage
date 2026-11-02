# QA checklist

## Automated (run before every release)

```powershell
npm test                 # 29 interaction checks
npm run test:reference   # geometry + computed-style diff vs baseline
```

Both must pass with zero failures and zero console errors.

## Manual — opening

- [ ] Page opens from `file://` **and** over HTTP.
- [ ] The wax seal is the only scrollable-stop at first load; the body does not
      scroll behind the intro.
- [ ] Tapping the seal (or pressing Enter/Space) opens the invitation.
- [ ] Music starts, fades in, and is audible but not loud.
- [ ] The mute button pauses; tapping again resumes from where it stopped.
- [ ] With the audio file missing, the music button hides itself.

## Manual — content

- [ ] Names read **Md. Shahed** and **Ms. Priyanka** everywhere.
- [ ] Date reads **Wednesday, 27 January 2027**.
- [ ] Guest arrival **7:30 PM**, ceremony **8:00 PM**.
- [ ] Reception **Thursday, 28 January 2027, 8:00 PM**.
- [ ] Venue reads **Kara Convention Center, 30/3 Umesh, Nandakumar Dutta Rd,
      Dhaka 1211**.
- [ ] "Open in Maps" opens the correct location.
- [ ] Gifts note reads exactly: *"Your love, blessings, and presence are the
      greatest gifts we could ever ask for."*
- [ ] Footer shows the date, venue and **Created by Khairul Rakin.**

## Manual — interaction

- [ ] Scratch card reveals on drag and on double-click.
- [ ] Heart particles fall once and disappear; the Save the Date button stays
      clickable during the burst.
- [ ] Save the Date downloads an `.ics` that opens on 27 Jan 2027, 8:00 PM.
- [ ] Gallery advances, dots switch, and tapping a dot jumps to that photo.
- [ ] RSVP validates name and attendance before sending.
- [ ] Successful RSVP swaps in the thank-you panel with the guest's first name.
- [ ] Failed RSVP shows the mailto fallback and re-enables the button.

## Manual — responsive

- [ ] 320 px: no horizontal scroll; footer venue wraps to its own line.
- [ ] 390 px: footer date and venue share a line.
- [ ] 768 px and 1440 px: letter column stays centred and readable.
- [ ] Photos are not distorted at any width.

## Manual — accessibility & preferences

- [ ] `prefers-reduced-motion: reduce` disables petals, reveals and heart burst.
- [ ] Keyboard: seal, music button, Save the Date and the form are reachable.
- [ ] Visible focus ring on every interactive control.
- [ ] Screen reader announces the countdown as a timer and the gallery dots as
      tabs with `aria-selected`.
- [ ] Colour contrast on body copy and small caps labels is comfortable.

## Manual — delivery

- [ ] One real RSVP submitted from the deployed URL.
- [ ] Activation email clicked (first deployment only).
- [ ] Confirmation email received at `sflshahed@gmail.com`.
- [ ] Link preview shows the correct title and description.
- [ ] `robots.txt` keeps the invitation out of search results.
