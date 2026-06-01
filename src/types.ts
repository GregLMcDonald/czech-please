// Shared data shapes, mirroring the JSON produced by scripts/.

/** Flat dictionary entry: [english, czech, note]. */
export type Entry = [string, string, string]

export interface DictData {
  entries: Entry[]
}

export interface Phrase {
  en: string
  cs: string
  pronunciation: string
  category: string
}
export interface PhrasesData {
  phrases: Phrase[]
}

export interface SentencePair {
  cs: string
  en: string
  csId: number
  enId: number
}
export interface SentencesData {
  attribution: string
  pairs: SentencePair[]
}

export interface VerbTable {
  word: string
  aspect: 'perfective' | 'imperfective' | ''
  infinitive: string
  present: Record<'s1' | 's2' | 's3' | 'p1' | 'p2' | 'p3', string>
  imperative: Record<'s2' | 'p1' | 'p2', string>
  past: Record<'mascSg' | 'femSg' | 'neutSg' | 'mascAnimPl' | 'otherPl', string>
}

export type CaseName =
  | 'nominative'
  | 'genitive'
  | 'dative'
  | 'accusative'
  | 'vocative'
  | 'locative'
  | 'instrumental'

export interface NounTable {
  word: string
  gender: string
  label: string
  cases: Record<CaseName, { sg: string; pl: string }>
}

export interface ReferenceSection {
  id: string
  title: string
  body: string
  list?: [string, string][]
}

export interface GrammarData {
  reference: ReferenceSection[]
  futureAux: Record<'s1' | 's2' | 's3' | 'p1' | 'p2' | 'p3', string>
  verbs: Record<string, VerbTable>
  nouns: Record<string, NounTable>
  attribution: string
}

/** A dictionary search hit. */
export interface SearchResult {
  i: number // index into entries
  en: string
  cs: string
  note: string
  dir: 'en' | 'cs' // which side matched -> translation direction
  rank: number
}
