# J Cut — Website v2 (liquid / glass / morph)

Same content as the live site, redesigned. Plain HTML/CSS/JS, no build step,
deploys to GitHub Pages exactly like v1.

```
index.html
assets/
  css/style.css
  js/liquid.js     WebGL background (soft morphing blobs, palette per section)
  js/main.js       cursor, glass, tilt, filters, footer dots, easter eggs, form
  img/             favicon + team photos
  media/           slots for hero portrait + showreel (see README.txt there)
```

## Preview locally

```bash
npx serve .
```

Open `index.html?slots` to see every media slot outlined.

## What's in it

- Full-screen WebGL liquid background; colours shift per section, blobs follow
  the cursor, stretch with scroll speed and ripple on click. Falls back to a
  CSS gradient if WebGL is unavailable; calmer with reduced-motion.
- Gooey blob cursor (desktop only) that grows into labels ("Play", "Send"...).
- Glass panels with a highlight that follows the cursor, 3D tilt on cards,
  magnetic buttons, floating glass pill nav with a sliding highlight.
- Dot-matrix headline/number font (Doto) that scrambles into place.
- Work grid keeps the bento layout, filters, FLIP morph and grayscale-to-colour
  hover; filter pill is now a liquid indicator.
- Hero: a dotted "J CUT" sits inside a ring and a liquid-glass orb. The dots assemble on load and scatter from the cursor. Four white dots orbit the ring, each carrying a word (Strategy, Scripts, Editing, Scheduling); hovering a dot pauses the ring. The orb refracts the dots in Chromium browsers; elsewhere it falls back to frosted glass.
- Contact form still posts to Web3Forms (same access key).

## Deploying

Replace the files in the GitHub repo with this folder's contents (same steps
as v1). The Web3Forms key and custom domain (CNAME file, if you added one)
must be kept — copy `CNAME` from the live repo into this folder first if it
exists there.
