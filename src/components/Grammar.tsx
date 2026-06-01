import { useEffect, useMemo, useRef, useState } from 'react'
import { loadGrammar } from '../data'
import type { GrammarData, VerbTable, NounTable } from '../types'

export default function Grammar({ conjugate }: { conjugate?: string }) {
  const [g, setG] = useState<GrammarData | null>(null)
  const tablesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadGrammar().then(setG)
  }, [])

  // Deep link from a word view (?w=word): preselect and scroll to tables.
  const [selected, setSelected] = useState<string | null>(conjugate || null)
  useEffect(() => {
    if (conjugate) {
      setSelected(conjugate)
      // Scroll the tables into view after data + layout settle.
      requestAnimationFrame(() => tablesRef.current?.scrollIntoView({ behavior: 'smooth' }))
    }
  }, [conjugate, g])

  if (!g) return <p className="hint">Loading grammar…</p>

  const verbWords = Object.keys(g.verbs).sort((a, b) => a.localeCompare(b, 'cs'))
  const nounWords = Object.keys(g.nouns)
  const isNoun = selected != null && !!g.nouns[selected]
  const isVerb = selected != null && !!g.verbs[selected]

  return (
    <div className="grammar">
      <section className="reference">
        <h2 className="section-title">Quick reference</h2>
        {g.reference.map((s) => (
          <details key={s.id} className="ref-section" open={s.id === 'cases'}>
            <summary>{s.title}</summary>
            <p>{s.body}</p>
            {s.list && (
              <ul className="ref-list">
                {s.list.map(([term, desc], i) => (
                  <li key={i}>
                    <strong>{term}</strong> — {desc}
                  </li>
                ))}
              </ul>
            )}
          </details>
        ))}
        <p className="attribution">{g.attribution}</p>
      </section>

      <section className="tables" ref={tablesRef}>
        <h2 className="section-title">Conjugation &amp; declension</h2>

        <div className="picker">
          <label>
            Verb
            <select
              value={isVerb ? selected! : ''}
              onChange={(e) => setSelected(e.target.value || null)}
            >
              <option value="">Choose a verb…</option>
              {verbWords.map((w) => (
                <option key={w} value={w}>
                  {w}
                  {g.verbs[w].aspect ? ` (${g.verbs[w].aspect === 'perfective' ? 'pf' : 'impf'})` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Noun
            <select
              value={isNoun ? selected! : ''}
              onChange={(e) => setSelected(e.target.value || null)}
            >
              <option value="">Choose a noun…</option>
              {nounWords.map((w) => (
                <option key={w} value={w}>
                  {g.nouns[w].label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selected && isVerb && <VerbTables verb={g.verbs[selected]} futureAux={g.futureAux} />}
        {selected && isNoun && <NounTableView noun={g.nouns[selected]} />}
        {!selected && <p className="hint">Pick a verb or noun to see its full table.</p>}
      </section>
    </div>
  )
}

const PERSONS: [keyof VerbTable['present'], string][] = [
  ['s1', 'já (I)'],
  ['s2', 'ty (you)'],
  ['s3', 'on/ona (he/she)'],
  ['p1', 'my (we)'],
  ['p2', 'vy (you pl.)'],
  ['p3', 'oni (they)'],
]

function VerbTables({
  verb,
  futureAux,
}: {
  verb: VerbTable
  futureAux: GrammarData['futureAux']
}) {
  const perfective = verb.aspect === 'perfective'
  const futureRows = useMemo(
    () =>
      PERSONS.map(([k, who]) => [who, `${futureAux[k]} ${verb.infinitive}`] as [string, string]),
    [verb, futureAux],
  )

  return (
    <div className="verb-tables">
      <div className="verb-head">
        <h3>{verb.word}</h3>
        {verb.aspect && (
          <span className={'aspect-badge ' + verb.aspect}>
            {verb.aspect === 'perfective' ? 'perfective' : 'imperfective'}
          </span>
        )}
      </div>

      <table className="gtable">
        <caption>
          {perfective ? 'Present-form (perfective → future meaning)' : 'Present tense'}
        </caption>
        <tbody>
          {PERSONS.map(([k, who]) => (
            <tr key={k}>
              <th>{who}</th>
              <td className="cz">{verb.present[k] || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="gtable">
        <caption>Past tense (l-participle + present of být)</caption>
        <tbody>
          <tr>
            <th>masculine sg.</th>
            <td className="cz">{verb.past.mascSg || '—'}</td>
          </tr>
          <tr>
            <th>feminine sg.</th>
            <td className="cz">{verb.past.femSg || '—'}</td>
          </tr>
          <tr>
            <th>neuter sg.</th>
            <td className="cz">{verb.past.neutSg || '—'}</td>
          </tr>
          <tr>
            <th>masc. animate pl.</th>
            <td className="cz">{verb.past.mascAnimPl || '—'}</td>
          </tr>
          <tr>
            <th>other pl.</th>
            <td className="cz">{verb.past.otherPl || '—'}</td>
          </tr>
        </tbody>
      </table>

      <table className="gtable">
        <caption>Imperative</caption>
        <tbody>
          <tr>
            <th>ty (you)</th>
            <td className="cz">{verb.imperative.s2 || '—'}</td>
          </tr>
          <tr>
            <th>my (let’s)</th>
            <td className="cz">{verb.imperative.p1 || '—'}</td>
          </tr>
          <tr>
            <th>vy (you pl.)</th>
            <td className="cz">{verb.imperative.p2 || '—'}</td>
          </tr>
        </tbody>
      </table>

      <table className="gtable">
        <caption>
          Future {perfective ? '(use the present forms above)' : '(budu + infinitive)'}
        </caption>
        <tbody>
          {perfective ? (
            <tr>
              <td className="note-cell">
                Perfective verbs have no separate future — the present forms above already mean the
                future (e.g. “{verb.present.s1}” = “I will …”).
              </td>
            </tr>
          ) : (
            futureRows.map(([who, form]) => (
              <tr key={who}>
                <th>{who}</th>
                <td className="cz">{form}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

const CASE_ROWS: [keyof NounTable['cases'], string, string][] = [
  ['nominative', 'Nominative', 'subject'],
  ['genitive', 'Genitive', 'of / from'],
  ['dative', 'Dative', 'to / for'],
  ['accusative', 'Accusative', 'object'],
  ['vocative', 'Vocative', 'addressing'],
  ['locative', 'Locative', 'in / about'],
  ['instrumental', 'Instrumental', 'by / with'],
]

function NounTableView({ noun }: { noun: NounTable }) {
  return (
    <div className="noun-tables">
      <div className="verb-head">
        <h3>{noun.word}</h3>
        <span className="aspect-badge gender">{noun.gender}</span>
      </div>
      <table className="gtable noun">
        <caption>{noun.label} — full declension</caption>
        <thead>
          <tr>
            <th>Case</th>
            <th>Singular</th>
            <th>Plural</th>
          </tr>
        </thead>
        <tbody>
          {CASE_ROWS.map(([c, label, hint]) => (
            <tr key={c}>
              <th className="case-label">
                {label}
                <span className="case-hint">{hint}</span>
              </th>
              <td className="cz">{noun.cases[c].sg || '—'}</td>
              <td className="cz">{noun.cases[c].pl || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
