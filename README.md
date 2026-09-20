# J Cut — Website

Single-page marketing site for J Cut, a social content agency in Dhaka.
Plain HTML/CSS/JS, no build step, deploys to GitHub Pages as-is.

```
index.html
assets/
  css/style.css
  js/liquid.js     WebGL background (soft morphing blobs, palette per section)
  js/main.js       cursor, glass effects, filters, dot wordmark, easter eggs, form
  img/             favicon + team photos
```

## Preview locally

```bash
npx serve .
```

## Deploying

Upload the changed files to the GitHub repo (Add file → Upload files, keeping the
`assets/…` folders). Keep the repo's `CNAME` file — it holds the custom domain.

## Performance notes

- Only 5 elements use `backdrop-filter` (nav pill, top-bar chips, glass orb, process meter).
  Content panels use a translucent fill instead, so the moving background isn't re-blurred
  under dozens of layers every frame.
- The background shader renders at reduced resolution (30% + 30fps cap on phones, 42% on
  desktop) and lowers its own resolution if frames run slow.
- The dot wordmark, the orbiting words, the process timeline and the cursor all stop doing
  work when nothing is moving or they're off-screen.
- No hover effects run for touch input; everything respects `prefers-reduced-motion`.

## Adding a hero portrait or showreel later

The hero currently shows the glass orb. To use a photo or video instead, ask for the
portrait/showreel slots to be added back and drop the files into `assets/media/`.

## Contact form

Posts to [Web3Forms](https://web3forms.com) (`assets/js/main.js`, "contact form" section). The
access key in `index.html` is public by design. The form's "Website URL" in the Web3Forms
dashboard should be `jcut.space`.
