// Minimal hash-based router. Hash routing needs no server-side rewrite, so deep
// links work on GitHub Pages out of the box (the 404.html fallback also feeds
// stray paths back in as a hash).
import { useEffect, useState } from 'react'

export interface Route {
  tab: 'dictionary' | 'phrases' | 'grammar'
  // Optional detail overlays:
  word?: { term: string; dir: 'en' | 'cs' } // dictionary word view
  conjugate?: string // grammar table for a specific word
}

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#\/?/, '')
  const [path, query] = h.split('?')
  const parts = path.split('/').filter(Boolean)
  const params = new URLSearchParams(query || '')

  if (parts[0] === 'word' && parts[1]) {
    return {
      tab: 'dictionary',
      word: { term: decodeURIComponent(parts[1]), dir: parts[2] === 'cs' ? 'cs' : 'en' },
    }
  }
  if (parts[0] === 'phrases') return { tab: 'phrases' }
  if (parts[0] === 'grammar')
    return { tab: 'grammar', conjugate: params.get('w') || undefined }
  return { tab: 'dictionary' }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function navigate(to: string) {
  window.location.hash = to
}

export function wordLink(term: string, dir: 'en' | 'cs') {
  return `#/word/${encodeURIComponent(term)}/${dir}`
}
export function conjugateLink(word: string) {
  return `#/grammar?w=${encodeURIComponent(word)}`
}
