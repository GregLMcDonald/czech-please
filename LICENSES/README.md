# Data sources & licenses

"Czech, Please" bundles data compiled from the following free sources. Each is
used under its own license; attribution is reproduced here and surfaced in the
app's About panel.

## 1. Dictionary — GNU/FDL English–Czech (svobodneslovniky)
- **Source:** the svobodneslovniky.cz community dictionary. The original
  `svobodneslovniky/svobodneslovniky` GitHub repo was removed; the identical data
  is obtained from the **easydict-gtk** project as clean JSON:
  https://github.com/jiri-one/easydict-gtk (`easydict_gtk/data/eng-cze.json`).
- **License:** GNU Free Documentation License (GNU/FDL) 1.1 or later.
- **Notes:** Trimmed at build time from ~217k to the ~60k most common entries
  using an English frequency list (see source 5).

## 2. Phrases — Wikivoyage Czech phrasebook
- **Source:** https://en.wikivoyage.org/wiki/Czech_phrasebook (raw wikitext).
- **License:** Creative Commons Attribution-ShareAlike (CC BY-SA).

## 3. Example sentences — Tatoeba
- **Source:** https://tatoeba.org (per-language exports: `ces_sentences`,
  `eng_sentences`, `ces-eng_links`).
- **License:** Creative Commons Attribution 2.0 France (CC BY 2.0 FR).
- **Notes:** Sentence IDs are retained in `sentences.json` for attribution.
  Capped at ~3,500 short/high-frequency pairs.

## 4. Grammar / inflection — kaikki.org (Wiktionary)
- **Source:** https://kaikki.org/dictionary/Czech/ (machine-readable Wiktionary
  extraction, JSONL with a `forms` array per word).
- **License:** Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0).
- **Prose reference** adapted from Wikipedia "Czech declension" and "Czech
  conjugation" articles (CC BY-SA 4.0).

## 5. English frequency list (build-time only, not shipped)
- **Source:** https://github.com/hermitdave/FrequencyWords
  (`content/2018/en/en_50k.txt`).
- **License:** CC BY-SA 4.0. Used only to rank/trim the dictionary; the list
  itself is not bundled in the app.
