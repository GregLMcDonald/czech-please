// Builds example sentence pairs from Tatoeba (CC BY 2.0 FR).
// Joins Czech + English sentences via the ces-eng links file, keeps attribution
// (sentence IDs), and caps at a few thousand short/high-frequency pairs.
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { download, writeJSON, RAW } from './lib.mjs'

const BASE = 'https://downloads.tatoeba.org/exports/per_language'
const CES_SENT = `${BASE}/ces/ces_sentences.tsv.bz2`
const ENG_SENT = `${BASE}/eng/eng_sentences.tsv.bz2`
const LINKS = `${BASE}/ces/ces-eng_links.tsv.bz2`

const CAP = 3500

function bunzip(bz2Name) {
  const tsv = bz2Name.replace(/\.bz2$/, '')
  const tsvPath = join(RAW, tsv)
  if (existsSync(tsvPath) && statSync(tsvPath).size > 0) return tsvPath
  // bunzip2 -k keeps the .bz2; -c writes to stdout which we capture.
  const out = execFileSync('bunzip2', ['-c', join(RAW, bz2Name)], {
    maxBuffer: 1 << 30,
  })
  writeFileSync(tsvPath, out)
  return tsvPath
}

// id\tlang\ttext  ->  Map<id, text>
function loadSentences(path) {
  const map = new Map()
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const tab1 = line.indexOf('\t')
    if (tab1 === -1) continue
    const id = line.slice(0, tab1)
    const tab2 = line.indexOf('\t', tab1 + 1)
    if (tab2 === -1) continue
    map.set(id, line.slice(tab2 + 1).trim())
  }
  return map
}

async function main() {
  console.log('Sentences (Tatoeba):')
  const csBz = await download(CES_SENT, 'ces_sentences.tsv.bz2')
  const enBz = await download(ENG_SENT, 'eng_sentences.tsv.bz2')
  const lnBz = await download(LINKS, 'ces-eng_links.tsv.bz2')

  const cs = loadSentences(bunzip(csBz.split('/').pop()))
  const en = loadSentences(bunzip(enBz.split('/').pop()))
  const linksPath = bunzip(lnBz.split('/').pop())
  console.log(`  ${cs.size} cs, ${en.size} en sentences`)

  const pairs = []
  const seen = new Set()
  for (const line of readFileSync(linksPath, 'utf8').split('\n')) {
    const tab = line.indexOf('\t')
    if (tab === -1) continue
    const csId = line.slice(0, tab).trim()
    const enId = line.slice(tab + 1).trim()
    const csText = cs.get(csId)
    const enText = en.get(enId)
    if (!csText || !enText) continue
    if (seen.has(csId)) continue // one English per Czech sentence
    seen.add(csId)
    pairs.push({ cs: csText, en: enText, csId: +csId, enId: +enId })
  }
  console.log(`  ${pairs.length} joined pairs`)

  // "High frequency" proxy: prefer short, simple sentences and cap the count.
  const filtered = pairs
    .filter((p) => p.cs.length >= 6 && p.cs.length <= 70 && p.en.length <= 80)
    .sort((a, b) => a.cs.length - b.cs.length)
    .slice(0, CAP)

  console.log(`  kept ${filtered.length} (cap ${CAP})`)
  await writeJSON('sentences.json', {
    attribution:
      'Example sentences from the Tatoeba Project (https://tatoeba.org), released under CC BY 2.0 FR. Sentence IDs retained for attribution.',
    pairs: filtered,
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
