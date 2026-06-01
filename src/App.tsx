import { useState } from 'react'
import { useRoute, navigate } from './router'
import Dictionary from './components/Dictionary'
import Phrases from './components/Phrases'
import Grammar from './components/Grammar'
import About from './components/About'

const TABS = [
  { id: 'dictionary', label: 'Dictionary', icon: '🔍', hash: '#/' },
  { id: 'phrases', label: 'Phrases', icon: '💬', hash: '#/phrases' },
  { id: 'grammar', label: 'Grammar', icon: '📖', hash: '#/grammar' },
] as const

export default function App() {
  const route = useRoute()
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">
          Czech, <span className="brand-accent">Please</span>
        </h1>
        <button className="icon-btn" aria-label="About & licenses" onClick={() => setAboutOpen(true)}>
          ⓘ
        </button>
      </header>

      <main className="content">
        {route.tab === 'dictionary' && <Dictionary route={route} />}
        {route.tab === 'phrases' && <Phrases />}
        {route.tab === 'grammar' && <Grammar conjugate={route.conjugate} />}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={'tab' + (route.tab === t.id ? ' active' : '')}
            onClick={() => navigate(t.hash)}
            aria-current={route.tab === t.id}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      {aboutOpen && <About onClose={() => setAboutOpen(false)} />}
    </div>
  )
}
