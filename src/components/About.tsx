/** Modal listing data sources and licenses. */
export default function About({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>About</h2>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <p>
          <strong>Czech, Please</strong> is an offline-first English↔Czech travel reference. It
          works with no network after the first load, and installs as an app.
        </p>
        <h3>Data &amp; licenses</h3>
        <ul className="about-list">
          <li>
            <strong>Dictionary</strong> — GNU/FDL English–Czech dictionary (svobodneslovniky
            community, via the easydict-gtk project), trimmed to ~60k common entries.{' '}
            <em>GNU/FDL.</em>
          </li>
          <li>
            <strong>Phrases</strong> — Wikivoyage Czech phrasebook. <em>CC BY-SA.</em>
          </li>
          <li>
            <strong>Example sentences</strong> — the Tatoeba Project (sentence IDs retained).{' '}
            <em>CC BY 2.0 FR.</em>
          </li>
          <li>
            <strong>Grammar / inflection</strong> — kaikki.org (Wiktionary) extraction; prose
            adapted from Wikipedia. <em>CC BY-SA 4.0.</em>
          </li>
        </ul>
        <p className="hint">
          This app redistributes the above under their respective licenses. Full attribution lives
          in the repository’s LICENSES/ folder.
        </p>
      </div>
    </div>
  )
}
