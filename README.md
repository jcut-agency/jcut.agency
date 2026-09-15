# J Cut — Agency Website

A single-page marketing site for J Cut, a social content agency based in
Dhaka, Bangladesh. Plain HTML/CSS/JS, no build step, no backend.

## Structure

```
index.html
assets/
  css/style.css
  js/main.js
  img/favicon.svg
```

## Local preview

Any static file server works, e.g.:

```bash
npx serve .
```

Then open the printed local URL.

## Deploying to GitHub Pages

1. Push this folder to a new GitHub repository.
2. In the repo, go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`.
4. Save — the site will be live at `https://<username>.github.io/<repo>/`
   within a minute or two.

## Content to fill in later

- Team section (`#team` in `index.html`): names, real photos, and bios for
  the Creative Director, Lead Video Editor, and Content Strategist. Replace
  the `.team-initial` placeholder with an `<img>` inside `.team-photo`.
- Stats in `#stats` are structural facts (client count, service count,
  languages) — swap in real performance numbers once you have them.
- `jcut.agency@gmail.com` and `@jcut.agency` are placeholders from the brief —
  update throughout (header nav, footer, contact section, `mailto:` links)
  if the real handles differ.

## Contact form

The form submits to [Web3Forms](https://web3forms.com) (`assets/js/main.js`,
"contact form -> Web3Forms" section) — no backend needed, works as-is once
deployed. The access key in `index.html`'s hidden `access_key` field is
public by design (Web3Forms' own docs say it's meant for client-side code).

The form's "Website URL" in the Web3Forms dashboard is currently set to
`localhost` (set during initial setup, before deployment). Once this site
has a real GitHub Pages URL, update it in the Web3Forms dashboard —
Settings → your form → Website URL — for their spam filtering to work
correctly against the real domain.
