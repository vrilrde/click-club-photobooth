# click-club-photobooth

Click Club is an online photobooth. Pick an album-era booth, step inside, take photos with your camera, and save the printed strip.

## Run it

No build step or install needed. Serve the folder and open the address it prints:

```
npx serve .
```

Opening `index.html` straight from disk also works, but browsers never remember camera permission for local files, so they ask on every booth. On `localhost` or the live site, "Allow while visiting the site" is remembered.

## Files

- `index.html`: the booth library (hero) and how-it-works section
- `inside-photobooth.html`: the booth, camera, strip cuts, printing and saving
- `vercel.json`: clean addresses (`/`, `/inside-photobooth`, `/inside-photobooth/strip`)
- `css/`: styles for each page
- `js/eras.js`: the eight era themes both pages read
- `js/landing.js`, `js/booth.js`: the page scripts
- `assets/music/`: one song per booth, set by `song` in `js/eras.js` (`start` is the second it starts at, just before the singing)
- `robots.txt`, `sitemap.xml`, `site.webmanifest`, `assets/og/`: search and share previews

Themes are fan-made tributes. Click Club is not affiliated with or endorsed by any artist or label.
