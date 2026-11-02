# Md. Shahed & Ms. Priyanka — Wedding Invitation

A single-page wedding invitation for **Wednesday, 27 January 2027** at
**Kara Convention Center, Dhaka**. Vanilla HTML, CSS and JavaScript — no build
step and no runtime dependencies.

## Open it

Double-click `index.html`. Every feature works from `file://`: the wax seal,
background music, scratch-to-reveal card, calendar download and RSVP.

For local development, or when you want real HTTP semantics:

```powershell
npx --yes serve . -l 4173
```

## Layout

```
index.html              markup only — no inline style or script
assets/css/             4 stylesheets, fixed load order
assets/js/              12 modules, fixed load order
assets/img/             backgrounds, gallery, brand
assets/audio/           background track
docs/                   architecture, content, deployment, QA
tests/                  interaction suite + visual reference harness
```

## Editing content

The names, date, venue and RSVP inbox are not all in one file yet — the visible
copy lives in `index.html` by design, and the machine-read values live in
`assets/js/config.js`. `docs/CONTENT.md` lists every location.

## Tests

```powershell
npm install            # once — installs playwright-core
npm test               # 29 interaction checks
npm run test:reference # capture + diff against the visual baseline
```

On Windows the suite drives the installed Edge browser. Set `PW_CHANNEL=chrome`
to use Chrome instead.

## Deployment

Any static host works. See `docs/DEPLOYMENT.md` for cache headers, the
FormSubmit activation step, and the pre-release checklist.

## Browser support

Current Edge, Chrome, Firefox and Safari. The page degrades gracefully: without
JavaScript the invitation copy, photos, venue and RSVP fallback are all still
readable.
