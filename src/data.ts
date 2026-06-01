// Lazy data loading + search. Data files are dynamically imported so the app
// shell paints immediately; each dataset loads on first use and is then cached
// by the module + the service worker.
import type {
  DictData,
  PhrasesData,
  SentencesData,
  GrammarData,
  Entry,
  SearchResult,
  SentencePair,
} from './types'

export function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

const CZECH_DIACRITICS = /[áčďéěíňóřšťúůýž]/i

// --- Dictionary, with a lazily-built normalized search index ---------------
let dictPromise: Promise<DictIndex> | null = null

export interface DictIndex {
  entries: Entry[]
  normEn: string[]
  normCs: string[]
}

export function loadDict(): Promise<DictIndex> {
  if (!dictPromise) {
    dictPromise = import('./data/dict.json').then((m) => {
      const entries = (m.default as DictData).entries
      const normEn = new Array<string>(entries.length)
      const normCs = new Array<string>(entries.length)
      for (let i = 0; i < entries.length; i++) {
        normEn[i] = norm(entries[i][0])
        normCs[i] = norm(entries[i][1])
      }
      return { entries, normEn, normCs }
    })
  }
  return dictPromise
}

const MAX_RESULTS = 400

/**
 * Bidirectional, diacritic-insensitive, prefix+substring search.
 * Direction is auto-detected: Czech diacritics force CS→EN; otherwise both
 * sides are searched and ranked (prefix beats substring, shorter beats longer).
 */
export function search(idx: DictIndex, query: string): SearchResult[] {
  const q = norm(query)
  if (q.length < 1) return []
  const preferCs = CZECH_DIACRITICS.test(query)
  const { entries, normEn, normCs } = idx
  const hits: SearchResult[] = []

  for (let i = 0; i < entries.length; i++) {
    const en = normEn[i]
    const cs = normCs[i]
    const enPos = en.indexOf(q)
    const csPos = cs.indexOf(q)
    if (enPos === -1 && csPos === -1) continue

    // Rank: exact(0) < prefix(1) < word-start(2) < substring(3).
    const score = (hay: string, pos: number) =>
      pos === -1
        ? 99
        : hay === q
        ? 0
        : pos === 0
        ? 1
        : hay[pos - 1] === ' '
        ? 2
        : 3
    const enScore = score(en, enPos)
    const csScore = score(cs, csPos)

    // Pick the matching direction. Czech-diacritic queries prefer the CS side.
    let dir: 'en' | 'cs'
    let rank: number
    if (preferCs && csPos !== -1) {
      dir = 'cs'
      rank = csScore
    } else if (enScore <= csScore) {
      dir = 'en'
      rank = enScore
    } else {
      dir = 'cs'
      rank = csScore
    }

    const e = entries[i]
    hits.push({ i, en: e[0], cs: e[1], note: e[2], dir, rank })
  }

  hits.sort(
    (a, b) =>
      a.rank - b.rank ||
      (a.dir === 'en' ? a.en : a.cs).length - (b.dir === 'en' ? b.en : b.cs).length,
  )
  return hits.slice(0, MAX_RESULTS)
}

// --- Phrases ---------------------------------------------------------------
let phrasesPromise: Promise<PhrasesData> | null = null
export function loadPhrases(): Promise<PhrasesData> {
  if (!phrasesPromise)
    phrasesPromise = import('./data/phrases.json').then((m) => m.default as PhrasesData)
  return phrasesPromise
}

// --- Example sentences -----------------------------------------------------
let sentencesPromise: Promise<SentencesData> | null = null
export function loadSentences(): Promise<SentencesData> {
  if (!sentencesPromise)
    sentencesPromise = import('./data/sentences.json').then((m) => m.default as SentencesData)
  return sentencesPromise
}

/** Find example pairs whose given-language text contains the word as a token. */
export function findExamples(
  data: SentencesData,
  word: string,
  lang: 'cs' | 'en',
  limit = 4,
): SentencePair[] {
  const w = norm(word)
  if (!w) return []
  const out: SentencePair[] = []
  for (const p of data.pairs) {
    const hay = ' ' + norm(lang === 'cs' ? p.cs : p.en).replace(/[^a-z0-9\s]/g, ' ') + ' '
    if (hay.includes(' ' + w + ' ')) {
      out.push(p)
      if (out.length >= limit) break
    }
  }
  return out
}

// --- Grammar ---------------------------------------------------------------
let grammarPromise: Promise<GrammarData> | null = null
export function loadGrammar(): Promise<GrammarData> {
  if (!grammarPromise)
    grammarPromise = import('./data/grammar.json').then((m) => m.default as unknown as GrammarData)
  return grammarPromise
}
