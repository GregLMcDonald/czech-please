import { useEffect, useState } from 'react'
import { loadDict, loadSentences, loadGrammar, norm, findExamples } from '../data'
import type { Entry, SentencePair, GrammarData } from '../types'
import { navigate, conjugateLink } from '../router'
import CopyButton from './CopyButton'

interface Sense {
  translation: string
  note: string
}

export default function WordView({ term, dir }: { term: string; dir: 'en' | 'cs' }) {
  const [senses, setSenses] = useState<Sense[] | null>(null)
  const [examples, setExamples] = useState<SentencePair[]>([])
  const [grammar, setGrammar] = useState<GrammarData | null>(null)
  const [grammarKey, setGrammarKey] = useState<string | null>(null)

  const headword = term
  // The Czech word(s) — used for examples and grammar lookups.
  const [czechForms, setCzechForms] = useState<string[]>([])

  useEffect(() => {
    let alive = true
    loadDict().then((idx) => {
      if (!alive) return
      const want = norm(term)
      const matchSide = (e: Entry) => (dir === 'en' ? norm(e[0]) : norm(e[1]))
      // Exact headword group first; fall back to substring if nothing exact.
      let group = idx.entries.filter((e) => matchSide(e) === want)
      if (group.length === 0) group = idx.entries.filter((e) => matchSide(e).includes(want)).slice(0, 30)

      const seen = new Set<string>()
      const out: Sense[] = []
      const cz: string[] = []
      for (const e of group) {
        const translation = dir === 'en' ? e[1] : e[0]
        const key = translation + '|' + e[2]
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ translation, note: e[2] })
        cz.push(dir === 'en' ? e[1] : e[0])
      }
      setSenses(out)
      setCzechForms([...new Set(cz)])
    })
    return () => {
      alive = false
    }
  }, [term, dir])

  // Examples: match the Czech side of the entry against Tatoeba sentences.
  useEffect(() => {
    if (czechForms.length === 0 && dir === 'cs') return
    const csWord = dir === 'cs' ? term : czechForms[0]
    if (!csWord) return
    let alive = true
    loadSentences().then((s) => {
      if (!alive) return
      // Prefer Czech-side matches; fall back to English-side for breadth.
      let ex = findExamples(s, csWord, 'cs', 4)
      if (ex.length === 0 && dir === 'en') ex = findExamples(s, term, 'en', 4)
      setExamples(ex)
    })
    return () => {
      alive = false
    }
  }, [term, dir, czechForms])

  // Conjugation/declension link if a Czech form is in the curated grammar set.
  useEffect(() => {
    let alive = true
    loadGrammar().then((g) => {
      if (!alive) return
      setGrammar(g)
      const candidates = dir === 'cs' ? [term, ...czechForms] : czechForms
      for (const c of candidates) {
        const w = c.trim()
        if (g.verbs[w] || g.nouns[w]) {
          setGrammarKey(w)
          break
        }
      }
    })
    return () => {
      alive = false
    }
  }, [term, dir, czechForms])

  return (
    <div className="wordview">
      <button className="back-btn" onClick={() => navigate(dir === 'cs' ? '#/' : '#/')}>
        ‹ Back to search
      </button>

      <div className="wordview-head">
        <h2 className="wordview-term">
          {headword}
          <CopyButton text={headword} />
        </h2>
        <span className={'dir-badge ' + dir}>{dir === 'en' ? 'English → Czech' : 'Czech → English'}</span>
      </div>

      {senses === null && <p className="hint">Loading…</p>}

      {senses && senses.length > 0 && (
        <section className="card">
          <h3 className="card-title">Translations</h3>
          <ul className="sense-list">
            {senses.map((s, i) => (
              <li key={i} className="sense">
                <span className="sense-trans">{s.translation}</span>
                {s.note && <span className="note">{s.note}</span>}
                <CopyButton text={s.translation} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {grammar && grammarKey && (
        <button className="grammar-link" onClick={() => navigate(conjugateLink(grammarKey))}>
          {grammar.verbs[grammarKey] ? '📖 Conjugate' : '📖 Decline'} “{grammarKey}” →
        </button>
      )}

      {examples.length > 0 && (
        <section className="card">
          <h3 className="card-title">Example sentences</h3>
          <ul className="example-list">
            {examples.map((p, i) => (
              <li key={i} className="example">
                <span className="example-cs">{p.cs}</span>
                <span className="example-en">{p.en}</span>
                <span className="example-attr">Tatoeba #{p.csId}/#{p.enId}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
