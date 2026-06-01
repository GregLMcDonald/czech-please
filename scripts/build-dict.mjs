// Builds the core dictionary from the GNU/FDL svobodneslovniky data.
//
// The original svobodneslovniky/svobodneslovniky GitHub repo was removed, so we
// pull the identical data from the easydict-gtk project, which ships it as clean
// JSON ({eng, cze, notes, special, author}) under the same GNU/FDL license.
//
// The raw set is ~217k entries. To keep the offline bundle light we trim to the
// most common ~60k by requiring every significant English token to fall within
// the top-K of a frequency list (hermitdave/FrequencyWords, CC BY-SA). This
// drops rare/technical/proper-noun entries while keeping all everyday + travel
// vocabulary.
//
// Output:
//   src/data/dict.json   -> { entries: [[en, cs, note], ...] }
// Search indexes (diacritic-stripped, lowercased) are built in the app at load
// time from this flat array, for both EN->CS and CS->EN directions.
import { readFileSync } from 'node:fs'
import { download, writeJSON, norm } from './lib.mjs'

const DICT_SRC =
  'https://raw.githubusercontent.com/jiri-one/easydict-gtk/main/easydict_gtk/data/eng-cze.json'
const FREQ_SRC =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt'

// Frequency rank cutoff calibrated to yield ~60k entries.
const TOP_K = 15000

function cleanNote(notes) {
  if (!notes) return ''
  return notes.replace(/\s+/g, ' ').trim()
}

async function main() {
  console.log('Dictionary:')
  const freqFile = await download(FREQ_SRC, 'en_50k.txt')
  const rank = new Map()
  readFileSync(freqFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .forEach((line, i) => {
      const w = line.split(' ')[0]
      if (!rank.has(w)) rank.set(w, i + 1)
    })

  const tokens = (en) =>
    norm(en)
      .replace(/\([^)]*\)/g, ' ')
      .split(/[^a-z]+/)
      .filter((t) => t.length >= 2)
  // Worst (highest) frequency rank among an entry's English tokens; Infinity if
  // any token is unknown/rare.
  const maxRank = (en) => {
    const t = tokens(en)
    if (!t.length) return Infinity
    let m = 0
    for (const tk of t) {
      const r = rank.get(tk)
      if (r == null) return Infinity
      if (r > m) m = r
    }
    return m
  }

  const file = await download(DICT_SRC, 'eng-cze.json')
  const raw = JSON.parse(readFileSync(file, 'utf8')).eng_cze
  const seen = new Set()
  const entries = []
  let dropped = 0
  for (const v of Object.values(raw)) {
    const en = (v.eng || '').trim()
    const cs = (v.cze || '').trim()
    if (!en || !cs) continue
    // Drop proper-noun (name) entries and anything with a rare/technical token.
    if (/\[jmén\.\]/.test(v.notes || '') || maxRank(en) > TOP_K) {
      dropped++
      continue
    }
    const key = en + '|' + cs
    if (seen.has(key)) continue
    seen.add(key)
    entries.push([en, cs, cleanNote(v.notes)])
  }
  entries.sort((a, b) => (norm(a[0]) < norm(b[0]) ? -1 : norm(a[0]) > norm(b[0]) ? 1 : 0))
  console.log(`  kept ${entries.length} common entries (dropped ${dropped} rare/technical/names)`)
  await writeJSON('dict.json', { entries })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
