// Builds accurate inflection tables from the kaikki.org Czech extraction
// (Wiktionary data, CC BY-SA). We stream the 182MB JSONL line-by-line and keep
// only a curated set of high-frequency / irregular verbs and one model noun per
// gender, then map each word's `forms` array into clean conjugation/declension
// tables. Conjugations are NOT hand-typed — they come straight from the data.
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { join } from 'node:path'
import { writeJSON, RAW } from './lib.mjs'
import { REFERENCE } from './grammar-reference.mjs'

const SRC = join(RAW, 'kaikki-cs.jsonl')

// ~30 highest-frequency + irregular verbs (the required set is a subset).
const VERBS = new Set([
  'být', 'mít', 'jít', 'jet', 'jíst', 'vědět', 'chtít', 'moci', 'dělat',
  'mluvit', 'koupit', 'pracovat', 'číst', 'psát', 'vidět', 'dát', 'dávat',
  'stát', 'spát', 'brát', 'vzít', 'znát', 'myslet', 'žít', 'pít', 'hrát',
  'nést', 'říci', 'potřebovat', 'rozumět', 'bydlet', 'jmenovat',
])

// One model noun per gender (masculine animate/inanimate, feminine, neuter):
// the classic Czech paradigm models.
const NOUNS = {
  muž: { gender: 'masculine animate', label: 'muž (man)' },
  hrad: { gender: 'masculine inanimate', label: 'hrad (castle)' },
  žena: { gender: 'feminine', label: 'žena (woman)' },
  město: { gender: 'neuter', label: 'město (town)' },
}

const has = (f, ...tags) => tags.every((t) => (f.tags || []).includes(t))
const isReal = (f) => f && f.form && f.form !== '-' && f.form !== '—'

// First form matching all `need` tags, none of `avoid`, optional ending regex.
// Two-pass: prefer "clean" forms (skip colloquial/archaic/etc.), then fall back.
function pick(forms, need, { avoid = [], end = null } = {}) {
  const noise = ['colloquial', 'archaic', 'informal', 'alternative', 'rare', 'dialectal']
  const match = (f, allowNoise) =>
    isReal(f) &&
    need.every((t) => (f.tags || []).includes(t)) &&
    !avoid.some((t) => (f.tags || []).includes(t)) &&
    (!end || end.test(f.form)) &&
    (allowNoise || !noise.some((t) => (f.tags || []).includes(t)))
  return (
    forms.find((f) => match(f, false))?.form ||
    forms.find((f) => match(f, true))?.form ||
    ''
  )
}

function buildVerb(o) {
  const f = o.forms || []
  const aspect =
    (o.senses || [])
      .flatMap((s) => s.tags || [])
      .find((t) => t === 'perfective' || t === 'imperfective') || ''

  const present = {
    s1: pick(f, ['first-person', 'indicative', 'singular'], { avoid: ['imperative'] }),
    s2: pick(f, ['indicative', 'second-person', 'singular'], { avoid: ['imperative'] }),
    s3: pick(f, ['indicative', 'singular', 'third-person'], { avoid: ['imperative'] }),
    p1: pick(f, ['first-person', 'indicative', 'plural'], { avoid: ['imperative'] }),
    p2: pick(f, ['indicative', 'plural', 'second-person'], { avoid: ['imperative'] }),
    p3: pick(f, ['indicative', 'plural', 'third-person'], { avoid: ['imperative'] }),
  }
  const imperative = {
    s2: pick(f, ['imperative', 'second-person', 'singular']),
    p1: pick(f, ['first-person', 'imperative', 'plural']),
    p2: pick(f, ['imperative', 'plural', 'second-person']),
  }
  // l-participle (past): same tags as the passive participle, so disambiguate by
  // the -l / -la / -lo / -li / -ly ending.
  const past = {
    mascSg: pick(f, ['masculine', 'singular'], { avoid: ['feminine', 'neuter', 'plural'], end: /l$/ }),
    femSg: pick(f, ['feminine', 'singular'], { end: /la$/ }),
    neutSg: pick(f, ['neuter', 'singular'], { end: /lo$/ }),
    mascAnimPl: pick(f, ['masculine', 'animate', 'plural'], { end: /li$/ }),
    otherPl: pick(f, ['feminine', 'plural'], { end: /ly$/ }),
  }
  return {
    word: o.word,
    aspect,
    infinitive: pick(f, ['infinitive']) || o.word,
    present,
    imperative,
    past,
  }
}

function buildNoun(o, meta) {
  const f = o.forms || []
  const cs = ['nominative', 'genitive', 'dative', 'accusative', 'vocative', 'locative', 'instrumental']
  const cases = {}
  for (const c of cs) {
    cases[c] = {
      sg: pick(f, [c, 'singular']),
      pl: pick(f, [c, 'plural']),
    }
  }
  return { word: o.word, gender: meta.gender, label: meta.label, cases }
}

async function main() {
  console.log('Grammar (kaikki.org):')
  const verbs = {}
  const nouns = {}
  let futureAux = null // periphrastic future auxiliary (budu, budeš, ...) from "být"

  const rl = createInterface({
    input: createReadStream(SRC, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    if (!line) continue
    // Cheap pre-filter before parsing every line.
    if (!line.includes('"forms"')) continue
    let o
    try {
      o = JSON.parse(line)
    } catch {
      continue
    }
    if (!o.forms || o.forms.length < 6) continue

    if (o.pos === 'verb' && VERBS.has(o.word) && !verbs[o.word]) {
      verbs[o.word] = buildVerb(o)
      if (o.word === 'být') {
        // Future auxiliary = "být" forms starting with "bud", keyed by person/number.
        const aux = {}
        for (const fm of o.forms) {
          if (!isReal(fm) || !fm.form.startsWith('bud')) continue
          const t = fm.tags || []
          const num = t.includes('plural') ? 'p' : t.includes('singular') ? 's' : null
          const per = t.includes('first-person') ? '1' : t.includes('second-person') ? '2' : t.includes('third-person') ? '3' : null
          if (per && num) aux[num + per] = fm.form
        }
        if (Object.keys(aux).length >= 6) futureAux = aux
      }
    } else if (o.pos === 'noun' && NOUNS[o.word] && !nouns[o.word]) {
      // Require a full case table (skip defective/odd senses).
      const built = buildNoun(o, NOUNS[o.word])
      if (built.cases.nominative.sg && built.cases.genitive.sg) nouns[o.word] = built
    }
  }

  const foundV = Object.keys(verbs)
  const missV = [...VERBS].filter((w) => !verbs[w])
  const missN = Object.keys(NOUNS).filter((w) => !nouns[w])
  console.log(`  verbs: ${foundV.length}/${VERBS.size}${missV.length ? ' (missing: ' + missV.join(', ') + ')' : ''}`)
  console.log(`  nouns: ${Object.keys(nouns).length}/${Object.keys(NOUNS).length}${missN.length ? ' (missing: ' + missN.join(', ') + ')' : ''}`)
  console.log(`  futureAux: ${futureAux ? Object.values(futureAux).join(' ') : 'NOT FOUND'}`)

  await writeJSON('grammar.json', {
    reference: REFERENCE,
    futureAux,
    verbs,
    nouns,
    attribution:
      'Inflection tables extracted from kaikki.org (Wiktionary, CC BY-SA 4.0). Prose reference adapted from Wikipedia "Czech declension/conjugation" (CC BY-SA 4.0).',
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
