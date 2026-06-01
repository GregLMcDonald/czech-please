import { useEffect, useMemo, useRef, useState } from 'react'
import { loadDict, search, type DictIndex } from '../data'
import type { SearchResult } from '../types'
import { navigate, wordLink, type Route } from '../router'
import VirtualList from './VirtualList'
import WordView from './WordView'

export default function Dictionary({ route }: { route: Route }) {
  const [idx, setIdx] = useState<DictIndex | null>(null)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadDict().then(setIdx)
  }, [])

  // Debounce input to keep typing smooth over 60k entries.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 180)
    return () => clearTimeout(t)
  }, [query])

  const results = useMemo<SearchResult[]>(
    () => (idx && debounced ? search(idx, debounced) : []),
    [idx, debounced],
  )

  // Word view overlay (deep-linkable).
  if (route.word) {
    return <WordView term={route.word.term} dir={route.word.dir} />
  }

  return (
    <div className="dict">
      <div className="searchbar">
        <input
          ref={inputRef}
          className="search-input"
          type="search"
          inputMode="search"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Search English or Czech…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button className="clear-btn" aria-label="Clear" onClick={() => { setQuery(''); inputRef.current?.focus() }}>
            ✕
          </button>
        )}
      </div>

      {!idx && <p className="hint">Loading dictionary…</p>}

      {idx && !debounced && (
        <div className="empty-state">
          <p className="empty-emoji">🇨🇿</p>
          <p>Type an English or Czech word.</p>
          <p className="hint">
            Search ignores accents and matches anywhere in the word. {idx.entries.length.toLocaleString()} entries,
            both directions.
          </p>
        </div>
      )}

      {idx && debounced && results.length === 0 && (
        <p className="hint">No matches for “{debounced}”.</p>
      )}

      {results.length > 0 && (
        <>
          <p className="result-count">{results.length === 400 ? '400+' : results.length} results</p>
          <VirtualList
            items={results}
            rowHeight={64}
            className="results"
            render={(r) => (
              <button
                className="result-row"
                onClick={() => navigate(wordLink(r.dir === 'en' ? r.en : r.cs, r.dir))}
              >
                <div className="result-main">
                  <span className="result-headword">{r.dir === 'en' ? r.en : r.cs}</span>
                  <span className="result-arrow">→</span>
                  <span className="result-trans">{r.dir === 'en' ? r.cs : r.en}</span>
                </div>
                <div className="result-sub">
                  <span className={'dir-badge ' + r.dir}>{r.dir === 'en' ? 'EN→CS' : 'CS→EN'}</span>
                  {r.note && <span className="note">{r.note}</span>}
                </div>
              </button>
            )}
          />
        </>
      )}
    </div>
  )
}
