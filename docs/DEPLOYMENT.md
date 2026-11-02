# Deployment

## Hosting

The site is fully static. Upload the repository root to any static host
(Netlify, Cloudflare Pages, GitHub Pages, S3, nginx). There is no build step and
no server-side code.

Files that must ship:

```
index.html
assets/
robots.txt
_headers        (Netlify / Cloudflare Pages only)
```

Do not ship `tests/`, `docs/`, `package.json` or `.git/`.

## FormSubmit activation (required once)

RSVP posts to `https://formsubmit.co/ajax/sflshahed@gmail.com`.

FormSubmit holds responses until the inbox owner activates the address:

1. Submit the form once from the deployed site.
2. Open the activation email sent to `sflshahed@gmail.com`.
3. Click the activation link.

Until then, the form still fails over to the `mailto:` link, so no guest is
blocked — but nothing reaches the inbox automatically.

### Hardening the endpoint

After activation, FormSubmit can issue a hashed endpoint that hides the address
from page source. When that is available, replace `rsvp.endpoint` in
`assets/js/config.js` with the hashed URL and run `npm test`. The mailto
fallback still uses `rsvp.email`, which remains visible by design.

## Cache headers

`_headers` (Netlify / Cloudflare Pages format) sets:

- one-year immutable caching for `/assets/*`
- always-revalidate for `index.html`
- `nosniff`, `SAMEORIGIN`, strict referrer policy, and a permissions policy

If the host does not read `_headers`, reproduce the same rules in its
configuration. The important one is that `index.html` is **not** cached
long-term, otherwise guests keep an old invitation after an edit.

## Content-Security-Policy

Not enabled. The page needs `'unsafe-inline'` for `style="--d: …"` attributes
and relies on Google Fonts and FormSubmit. A workable starting point, to be
tested on the real host before enabling:

```
default-src 'self';
img-src 'self' data:;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src https://fonts.gstatic.com;
script-src 'self';
connect-src https://formsubmit.co;
media-src 'self';
frame-ancestors 'self'
```

## Custom domain / link preview

`index.html` sets `og:title` and `og:description` but no `og:image`, because a
relative image is ignored by most scrapers and the deployment domain is not
fixed. Once the domain is known, add:

```html
<meta property="og:url" content="https://example.com/" />
<meta property="og:image" content="https://example.com/assets/img/gallery/slide-1.jpg" />
<meta property="og:image:alt" content="Md. Shahed and Ms. Priyanka" />
```

## Pre-release checklist

1. `npm test` → 29/29.
2. `npm run test:reference` → PASS.
3. Open the deployed URL on a phone and a desktop.
4. Confirm music starts on the seal and the mute button works.
5. Submit one real RSVP and confirm the email arrives.
6. Check the `.ics` opens in a calendar app with the correct date and venue.
