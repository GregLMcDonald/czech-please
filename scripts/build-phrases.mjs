// Parses the Wikivoyage Czech phrasebook (CC BY-SA) wikitext into categorized
// phrase records: { en, cs, pronunciation, category }.
import { readFileSync } from 'node:fs'
import { download, writeJSON } from './lib.mjs'

const SRC =
  'https://en.wikivoyage.org/w/index.php?title=Czech_phrasebook&action=raw'

// Map raw section headers (lowercased) to the app's category slugs.
const CATEGORY = {
  basics: 'basics',
  problems: 'problems',
  numbers: 'numbers',
  time: 'time',
  'clock time': 'time',
  duration: 'time',
  days: 'days',
  months: 'months',
  colors: 'colors',
  transportation: 'transport',
  'bus and train': 'transport',
  directions: 'directions',
  taxi: 'taxi',
  lodging: 'lodging',
  money: 'money',
  eating: 'eating',
  bars: 'bars',
  shopping: 'shopping',
  driving: 'driving',
  authority: 'authority',
  'language barrier': 'problems',
  emergencies: 'emergencies',
}

// Strip wiki markup down to plain text.
function plain(s) {
  return s
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1') // [[a|b]] -> b
    .replace(/'''?/g, '') // bold/italic
    .replace(/\{\{[^}]*\}\}/g, '') // templates
    .replace(/<[^>]+>/g, '') // html
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  console.log('Phrases:')
  const file = await download(SRC, 'czech_phrasebook.wikitext')
  const text = readFileSync(file, 'utf8')
  const lines = text.split('\n')

  let inPhraseList = false
  let category = null
  const phrases = []

  for (const line of lines) {
    const header = line.match(/^=+\s*(.+?)\s*=+\s*$/)
    if (header) {
      const title = header[1].toLowerCase().trim()
      if (title === 'phrase list') {
        inPhraseList = true
        continue
      }
      if (inPhraseList) category = CATEGORY[title] ?? null
      continue
    }
    if (!inPhraseList || !category) continue

    // Phrase definition lines: "; English : Czech (''pron'') ...".
    let m = line.match(/^\s*;\s*(.+)$/)
    if (!m) continue
    let body = m[1]
    const colon = body.indexOf(':')
    if (colon === -1) continue
    const enRaw = body.slice(0, colon)
    let rest = body.slice(colon + 1)

    // Pronunciation is the first (''...'') group on the Czech side.
    const pronMatch = rest.match(/\(''([^']+)''\)/)
    const pronunciation = pronMatch ? plain(pronMatch[1]) : ''
    // Czech text is everything before that pronunciation marker.
    const csRaw = pronMatch ? rest.slice(0, rest.indexOf("(''")) : rest

    const en = plain(enRaw)
    const cs = plain(csRaw).replace(/[–-]\s*$/, '').trim()
    if (!en || !cs) continue
    phrases.push({ en, cs, pronunciation, category })
  }

  const cats = [...new Set(phrases.map((p) => p.category))]
  console.log(`  ${phrases.length} phrases across ${cats.length} categories: ${cats.join(', ')}`)
  await writeJSON('phrases.json', { phrases })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
