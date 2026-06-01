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

## Data sources & how they're processed

All data is built at install-time by the scripts in `scripts/` (orchestrated by
`build-data.mjs`). Each script downloads a raw upstream source into `raw/` (a
re-fetchable cache, git-ignored), transforms it into compact JSON in
`src/data/`, and that JSON is what ships in the app. License attributions live in
[`LICENSES/`](LICENSES/README.md) and are surfaced in the app's About panel.

The numbers below reflect the data currently committed in `src/data/`.

### 1. Dictionary → `src/data/dict.json` ([`build-dict.mjs`](scripts/build-dict.mjs))

- **Upstream:** the GNU/FDL English–Czech dictionary from the
  [svobodneslovniky.cz](https://www.svobodneslovniky.cz) community. The original
  `svobodneslovniky/svobodneslovniky` GitHub repo was removed, so the *identical*
  data is pulled from the [easydict-gtk](https://github.com/jiri-one/easydict-gtk)
  project, which ships it as clean JSON (`eng-cze.json`, ~217k records of
  `{eng, cze, notes, special, author}`). **License: GNU/FDL.**
- **Frequency list (build-time only):**
  [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords)
  `en_50k.txt` — 50k English words ranked by frequency. **License: CC BY-SA 4.0.**
  Used only to rank/trim the dictionary; not shipped.
- **Processing:**
  1. Parse each record into `[en, cs, note]`, keeping the POS/domain hint from
     `notes` (e.g. `n:`, `adj:`, `v:`, `[med.]`).
  2. **Trim ~217k → ~63k** to keep the offline bundle light: drop proper-noun
     entries (`[jmén.]`) and any entry whose *least-frequent* English token falls
     outside the top **15,000** of the frequency list. This keeps everyday and
     travel vocabulary while dropping rare/technical terms. (Cutoff is the
     `TOP_K` constant — raise it for a larger dictionary.)
  3. De-duplicate on `en|cs` and sort by diacritic-stripped headword.
- **Output:** `{ entries: [[en, cs, note], ...] }` — **63,453 entries, ~2.0 MB**
  (~535 KB gzipped over the wire).
- **Search index:** built in the browser at load time, not baked into the file —
  the app computes diacritic-stripped, lowercased forms of both the English and
  Czech sides into parallel arrays, enabling bidirectional, accent-insensitive,
  prefix + substring search with no extra payload.

### 2. Phrases → `src/data/phrases.json` ([`build-phrases.mjs`](scripts/build-phrases.mjs))

- **Upstream:** the [Wikivoyage Czech phrasebook](https://en.wikivoyage.org/wiki/Czech_phrasebook)
  raw wikitext. **License: CC BY-SA.**
- **Processing:**
  1. Walk the wikitext, ignoring everything before the `== Phrase list ==`
     section.
  2. Track the current category from `===`/`====` headers, mapping them onto 18
     app categories (e.g. *Clock time* and *Duration* → `time`; *Bus and train*
     → `transport`).
  3. Parse each `; English : Czech (''pronunciation'')` line: split on the first
     colon, pull the pronunciation from the first `(''...'')` group, and take the
     Czech text as everything before it.
  4. Strip wiki markup (`[[links]]`, `'''bold'''`, `{{templates}}`, HTML).
- **Output:** `{ phrases: [{ en, cs, pronunciation, category }] }` —
  **425 phrases across 18 categories**.

### 3. Example sentences → `src/data/sentences.json` ([`build-sentences.mjs`](scripts/build-sentences.mjs))

- **Upstream:** [Tatoeba](https://tatoeba.org) per-language exports —
  `ces_sentences.tsv.bz2`, `eng_sentences.tsv.bz2`, and the `ces-eng_links.tsv.bz2`
  link file. **License: CC BY 2.0 FR.**
- **Processing:**
  1. Decompress with `bunzip2` and load each sentence file into an `id → text`
     map (~89k Czech, ~2M English sentences).
  2. Join via the links file into Czech↔English pairs (~68k), keeping one English
     translation per Czech sentence and **retaining both sentence IDs** for
     attribution.
  3. As a "high-frequency" proxy, keep only short sentences (Czech 6–70 chars,
     English ≤ 80), sort by length so the simplest surface first, and **cap at
     3,500 pairs** to keep the bundle small.
- **Output:** `{ attribution, pairs: [{ cs, en, csId, enId }] }` —
  **3,500 pairs**.
- **Linking to headwords:** done in the browser — a word view tokenizes the
  Czech translation and surfaces example pairs whose Czech text contains that
  token, so real usage shows up next to the dictionary entry.

### 4. Grammar / inflection → `src/data/grammar.json` ([`build-grammar.mjs`](scripts/build-grammar.mjs))

- **Upstream:** the [kaikki.org Czech extraction](https://kaikki.org/dictionary/Czech/)
  — a machine-readable Wiktionary dump (~182 MB JSONL, one word per line, each
  with a `forms` array). **License: CC BY-SA 4.0.** The prose reference is adapted
  from the Wikipedia *Czech declension/conjugation* articles (**CC BY-SA 4.0**).
- **Processing:** the 182 MB file is **streamed line-by-line** (never fully loaded
  into memory) and filtered down to a curated set, then each word's raw `forms`
  array is mapped into clean tables. Conjugations are **not hand-typed** — they're
  read straight from the data:
  - **32 high-frequency / irregular verbs** (být, mít, jít, jet, jíst, vědět,
    chtít, moci, dělat, mluvit, koupit, pracovat, číst, psát, vidět, …). Per verb
    we extract the present indicative (all 6 persons), the imperative, the past
    *l*-participle, the infinitive, and the aspect (perfective/imperfective, taken
    from the word's senses). The *l*-participle shares Wiktionary tags with the
    passive participle, so the two are disambiguated by the `-l / -la / -lo / -li
    / -ly` ending.
  - The **periphrastic future auxiliary** (budu, budeš, bude, …) is extracted
    from `být`'s own forms, so the app can render "budu + infinitive" for
    imperfective verbs.
  - **One model noun per gender** (muž — masc. animate, hrad — masc. inanimate,
    žena — feminine, město — neuter), each with the full **7 cases × singular +
    plural**.
  - A short **prose reference** ([`grammar-reference.mjs`](scripts/grammar-reference.mjs)):
    the 7 cases and what each is for, noun gender, adjective agreement, the 5 verb
    classes, aspect, and negation.
- **Output:** `{ reference, futureAux, verbs, nouns, attribution }` —
  **32 verbs + 4 model nouns**.

> To refresh any dataset, run `npm run data` (or a single step like
> `npm run data:grammar`). It only re-downloads sources missing from `raw/`, so
> reruns are fast. The generated `src/data/*.json` is committed, so a plain
> `npm install && npm run build` needs no network.
