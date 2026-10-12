# J Cut — Website (v3)

Single-page site for J Cut, a social content agency. Plain HTML/CSS/JS, no build step, served by GitHub Pages at **jcut.space** (keep the `CNAME` file).

```
index.html
assets/
  css/style.css
  js/main.js                 page: work grid, side ruler + flying section names, dotted wordmark,
                             client roll, services meter, cursor, contact form, easter eggs
  js/galaxy.js               hero spiral (three.js, a port of ArtCraft's galaxy)
  vendor/three.galaxy.min.js three.js r170 trimmed to the classes galaxy.js uses
  img/                       favicon + team photos (WebP)
```

The previous design is kept on the `v2-backup` branch.

## Updating

Edit the files, then bump the `?v=` number on the three asset links in `index.html` so returning visitors get the new files.

If `galaxy.js` starts using a `THREE.*` class that isn't in `assets/vendor/three.galaxy.min.js`, rebuild that file with esbuild from `three@0.170.0`, exporting the classes `galaxy.js` uses.

## Preview locally

```
npx serve .
```
