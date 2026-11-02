# Wedding Invitation

A single-page wedding invitation with Vanilla HTML, CSS and JavaScript — no
runtime dependencies and nothing to compile. The only build step is the deploy
copy that keeps internal files off the CDN.

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
scripts/build.js        copies the guest-facing files into dist/
netlify.toml            Netlify build settings
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

Hosted on Netlify with continuous deploys from `main`:

```powershell
npm run build   # dist/ · 27 files · 4.34 MB
```

`netlify.toml` runs that build and publishes `dist/`. See
`docs/DEPLOYMENT.md` for the import steps, cache headers, the FormSubmit
activation step, and the pre-release checklist.

## Browser support

Current Edge, Chrome, Firefox and Safari. The page degrades gracefully: without
JavaScript the invitation copy, photos, venue and RSVP fallback are all still
readable.
