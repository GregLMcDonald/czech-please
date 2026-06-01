# Czech, Please 🇨🇿

An **offline-first PWA** that helps an English speaker *build* sentences in Czech —
translations, real example usage, ready-made travel phrases, and accurate
conjugation/declension tables. It works fully offline after the first load and
deploys as a static site to GitHub Pages.

## Features

- **Dictionary** — one search box, bidirectional EN↔CS with auto-detected
  direction, diacritic-insensitive, prefix + substring matching, debounced, and
  virtualized for smoothness over ~60k entries. Tap a result for translations,
  POS hints, matching example sentences, and a "conjugate/decline" link when the
  word is in the grammar set.
- **Phrases** — ~425 travel phrases in 18 categories (basics, problems, numbers,
  time, transport, lodging, money, eating, emergencies…), each with English,
  Czech, pronunciation, and a copy button. Filter across all phrases.
- **Grammar** — a prose reference (7 cases, gender, adjective agreement, the 5
  verb classes, aspect, negation) plus interactive conjugation tables for 32
  high-frequency/irregular verbs and full 7-case declensions for one model noun
  per gender.
- **Real PWA** — installable, with a service worker (Workbox via
  `vite-plugin-pwa`) that **precaches the app shell and every data file**, so the
  whole app runs with zero network after first load.

## Tech

Vite + React + TypeScript, plain CSS, mobile-first. No backend — GitHub Pages
serves static files only. `base` is set to the repo name (`/czech-please/`),
assets use relative paths, and a `404.html` SPA fallback keeps deep links working
on Pages (routing is hash-based, so it works even without the fallback).

## Project layout

```
scripts/        Build-time data pipeline (fetch raw sources → compact JSON)
raw/            Re-fetchable download cache (git-ignored)
LICENSES/       Source attributions & licenses
src/data/       Generated JSON, committed (dict, phrases, sentences, grammar)
src/components/ React UI
public/         Icons, favicon, 404.html
```

## Develop

```bash
npm install
npm run data     # (re)build src/data from upstream sources — needs network
npm run dev      # local dev server
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

`npm run data` is only needed to refresh the bundled data; the generated JSON is
committed, so `npm install && npm run build` works with no network.

## Deploy

Push to `main`. The included GitHub Actions workflow
(`.github/workflows/deploy.yml`) builds and publishes `dist/` to GitHub Pages.
Enable **Settings → Pages → Source: GitHub Actions** once. The app will be served
at `https://<user>.github.io/czech-please/`.

If your repo name differs, update `REPO_BASE` in `vite.config.ts` and the `base`
constant in `public/404.html`.

## Data sources & licenses

See [`LICENSES/`](LICENSES/README.md). In short: dictionary — GNU/FDL
(svobodneslovniky, via easydict-gtk); phrases — Wikivoyage (CC BY-SA); example
sentences — Tatoeba (CC BY 2.0 FR); grammar — kaikki.org / Wiktionary and
Wikipedia (CC BY-SA 4.0).
