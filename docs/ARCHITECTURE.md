# Architecture

## Shape

A static, no-build site. `index.html` carries markup only; presentation and
behaviour are external and loaded in a fixed order.

```
index.html
├── assets/css/tokens.css        design tokens, reset, base typography
├── assets/css/components.css    every invitation section
├── assets/css/layout.css        music button, scroll reveal
├── assets/css/responsive.css    desktop + reduced motion   (always last)
│
├── assets/js/dom.js             namespace, helpers, scroll policy
├── assets/js/config.js          machine values (date, venue, email, audio)
├── assets/js/music.js           MP3 playback, fade, mute
├── assets/js/envelope.js        wax seal, body unlock, scroll cue
├── assets/js/petals.js          decorative petals
├── assets/js/scratch.js         canvas scratch + heart burst
├── assets/js/save-the-date.js   .ics generation
├── assets/js/countdown.js       1 s tick
├── assets/js/slideshow.js       gallery advance
├── assets/js/rsvp.js            FormSubmit + mailto fallback
├── assets/js/reveal.js          IntersectionObserver reveals
└── assets/js/main.js            boot — the only place order is expressed
```

## Why these choices

**Classic scripts, not ES modules.** The invitation must keep working when
opened directly from disk. ES modules and `fetch()` of local files are blocked
by CORS on `file://`. Classic scripts with `defer` execute in document order and
work everywhere.

**`config.js` is JavaScript, not JSON.** Same reason: a local `.json` cannot be
fetched from `file://`. It exposes a frozen `window.WEDDING` object.

**Visible copy stays in the HTML.** Headings, dates and venue text are not
injected at runtime, so the page still reads correctly without JavaScript, in
link previews, and when printed. Only values JavaScript must compute live in
`config.js`.

**Four stylesheets, not sixteen.** Splitting every documented section into its
own file would turn cascade order into sixteen load-order dependencies. Four
files keep ordering auditable.

**No cascade layers.** `@layer` would make ordering explicit in code, but it
also changes how specificity resolves against the existing reduced-motion and
desktop overrides. The current order is verified by the reference harness, so
layers are a deliberate non-goal until there is a reason to revisit.

**The SVG sprite stays inline.** `#heartClip` is referenced by `clip-path` from
both the scratch card and the burst particles. Externalising the sprite breaks
`objectBoundingBox` clip-path scaling in several browsers, so the symbol sheet
remains part of `index.html`.

## Boot order

`main.js` calls modules in this order:

```
music → envelope → petals → scratch → saveTheDate
      → countdown → slideshow → rsvp → reveal
```

- `music` must arm playback before the seal can trigger it.
- `envelope` unlocks `<body>` before layout-dependent modules measure anything.
- `reveal` runs last so it observes a stable document.

## CSS order

```
tokens → components → layout → responsive
```

`responsive.css` contains the desktop media query followed by the
reduced-motion block, matching the original cascade exactly.

## Contracts

These IDs are JavaScript hooks. Renaming one requires a code change:

`intro` · `openInvite` · `bgMusic` · `musicBtn` · `scratchCard` ·
`scratchCanvas` · `scratchBurst` · `scratchHint` · `saveDate` · `rsvpForm` ·
`rsvpSuccess` · `rsvpSuccessText` · `rsvpStatus` · `rsvpMailto` · `gallery` ·
`petals` · `scrollCue` · `invitation` · `cd-days` · `cd-hours` · `cd-minutes` ·
`cd-seconds` · `rsvpName` · `rsvpAttend` · `rsvpMessage` · `heartClip`

## Conventions

- Classes are section-prefixed and kebab-case; IDs are never styled.
- Colours, spacing and timing come from custom properties in `tokens.css`.
- No `!important` outside the reduced-motion block.
- One concern per module, one IIFE per file, `"use strict"` everywhere.
- No runtime dependencies. `package.json` exists only for tooling.

## Budgets

| Metric | Budget |
|---|---|
| `index.html` | < 900 lines |
| Any CSS file | < 1,400 lines |
| Any JS module | < 220 lines |
| Console errors | 0 |
| Horizontal overflow, 320–1440 | none |
| Interaction suite | 29/29 |

The reference harness (`npm run test:reference`) compares five viewports against
`tests/reference/baseline` on section geometry and a computed-style
fingerprint.
