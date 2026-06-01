import { useEffect, useMemo, useState } from 'react'
import { loadPhrases, norm } from '../data'
import type { Phrase } from '../types'
import CopyButton from './CopyButton'

const CATEGORY_LABELS: Record<string, string> = {
  basics: 'Basics',
  problems: 'Problems',
  numbers: 'Numbers',
  time: 'Time',
  days: 'Days',
  months: 'Months',
  colors: 'Colors',
  transport: 'Transport',
  directions: 'Directions',
  taxi: 'Taxi',
  lodging: 'Lodging',
  money: 'Money',
  eating: 'Eating',
  bars: 'Bars',
  shopping: 'Shopping',
  driving: 'Driving',
  authority: 'Authority',
  emergencies: 'Emergencies',
}

export default function Phrases() {
  const [phrases, setPhrases] = useState<Phrase[] | null>(null)
  const [filter, setFilter] = useState('')
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    loadPhrases().then((d) => setPhrases(d.phrases))
  }, [])

  const categories = useMemo(() => {
    if (!phrases) return []
    return [...new Set(phrases.map((p) => p.category))]
  }, [phrases])

  const shown = useMemo(() => {
    if (!phrases) return []
    const q = norm(filter)
    return phrases.filter((p) => {
      if (active && p.category !== active) return false
      if (!q) return true
      return (
        norm(p.en).includes(q) || norm(p.cs).includes(q) || norm(p.pronunciation).includes(q)
      )
    })
  }, [phrases, filter, active])

  if (!phrases) return <p className="hint">Loading phrases…</p>

  // Group shown phrases by category for display.
  const groups = categories
    .map((c) => ({ cat: c, items: shown.filter((p) => p.category === c) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="phrases">
      <div className="searchbar">
        <input
          className="search-input"
          type="search"
          placeholder="Filter phrases…"
          value={filter}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => setFilter(e.target.value)}
        />
        {filter && (
          <button className="clear-btn" aria-label="Clear" onClick={() => setFilter('')}>
            ✕
          </button>
        )}
      </div>

      <div className="chips">
        <button className={'chip' + (active === null ? ' active' : '')} onClick={() => setActive(null)}>
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={'chip' + (active === c ? ' active' : '')}
            onClick={() => setActive(active === c ? null : c)}
          >
            {CATEGORY_LABELS[c] || c}
          </button>
        ))}
      </div>

      {groups.length === 0 && <p className="hint">No phrases match “{filter}”.</p>}

      {groups.map((g) => (
        <section key={g.cat} className="phrase-group">
          <h3 className="group-title">{CATEGORY_LABELS[g.cat] || g.cat}</h3>
          <ul className="phrase-list">
            {g.items.map((p, i) => (
              <li key={i} className="phrase">
                <div className="phrase-text">
                  <span className="phrase-en">{p.en}</span>
                  <span className="phrase-cs">{p.cs}</span>
                  {p.pronunciation && <span className="phrase-pron">/{p.pronunciation}/</span>}
                </div>
                <CopyButton text={p.cs} label={`Copy "${p.cs}"`} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
