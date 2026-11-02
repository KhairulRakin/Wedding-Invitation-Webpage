# Deployment

## Hosting

The site is fully static — no server-side code, no runtime dependencies. Netlify
is the current host; any static host (Cloudflare Pages, GitHub Pages, S3, nginx)
works the same way.

## Netlify

`netlify.toml` pins the settings, so nothing needs to be typed into the dashboard
beyond authorising the repository:

```toml
[build]
  command = "node scripts/build.js"
  publish = "dist"
```

`scripts/build.js` copies only the guest-facing files into `dist/`:

```
index.html
assets/
robots.txt
_headers
```

That keeps `tests/` (about 10 MB of reference screenshots), `docs/`,
`package.json` and `node_modules/` off the CDN. A local build reports the
payload:

```powershell
npm run build     # dist/ · 27 files · 4.34 MB
```

`dist/` is generated and git-ignored; Netlify recreates it on every push.

### Connect the repository (continuous deploys)

1. <https://app.netlify.com/start> → **Import an existing project** → **GitHub**.
2. Authorise Netlify for the private repo `KhairulRakin/Wedding-Invitation-Webpage`.
3. Leave the build command and publish directory blank — `netlify.toml` supplies
   both. Click **Deploy**.

Every push to `main` then redeploys automatically.

### Netlify Drop (no repository link)

Drag the generated `dist` folder onto <https://app.netlify.com/drop>. This is the
fastest route to a live URL, but it does not redeploy on push until the site is
claimed and linked to Git under **Site configuration → Build & deploy**.

### Netlify CLI

```powershell
npm install -g netlify-cli
netlify login                      # opens the browser once
netlify init                       # link to the existing site
netlify deploy --prod --dir dist
```

`netlify deploy --prod --dir dist` also works without `netlify init` when a site
is already selected.

### Verify the headers took effect

```powershell
curl.exe -sI https://<site>.netlify.app/ | Select-String -Pattern 'cache-control|x-content|referrer'
curl.exe -sI https://<site>.netlify.app/assets/css/tokens.css | Select-String cache-control
```

`index.html` must revalidate (`max-age=0, must-revalidate`) and `/assets/*` must
be immutable. If those do not appear, `_headers` was not uploaded to the publish
root.

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

## Performance backlog

These are deliberate follow-ups, not oversights. The authoring environment has
no image or audio encoders (`ffmpeg`, `magick`, `cwebp`, `avifenc` are all
absent), so the binary conversions were left untouched rather than applied
blindly.

| Item | Current | Target | How |
|---|---|---|---|
| Backgrounds + gallery | JPEG, 134–202 KB each | WebP/AVIF ~40–70 KB | Encode once, wrap gallery in `<picture>` with JPEG fallback, keep the same filenames for the CSS backgrounds or update the four `url()` rules |
| Audio | 3.2 MB MP3, 103 s | ~1.4 MB mono 96–128 kbps | `ffmpeg -i in.mp3 -ac 1 -b:a 112k out.mp3` |
| Fonts | Google Fonts, 4 families | Self-hosted subset | Download the woff2 files, drop the `fonts.googleapis.com` links, add `font-display: swap` locally |
| RSVP endpoint | Plain address in config | Hashed FormSubmit endpoint | Activate the inbox first, then replace `rsvp.endpoint` |
| Link preview | No `og:image` | Absolute image URL | Add once the domain is fixed, per the section above |

After any of these, re-run `npm test` and `npm run test:reference`.

## Pre-release checklist

1. `npm test` → 29/29.
2. `npm run test:reference` → PASS.
3. Open the deployed URL on a phone and a desktop.
4. Confirm music starts on the seal and the mute button works.
5. Submit one real RSVP and confirm the email arrives.
6. Check the `.ics` opens in a calendar app with the correct date and venue.
