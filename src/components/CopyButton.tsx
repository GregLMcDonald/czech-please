import { useState } from 'react'

/** Copy-to-clipboard button with a brief "copied" confirmation. */
export default function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className={'copy-btn' + (copied ? ' copied' : '')}
      aria-label={label || `Copy "${text}"`}
      onClick={async (e) => {
        e.stopPropagation()
        try {
          await navigator.clipboard.writeText(text)
        } catch {
          // Fallback for browsers without the async clipboard API.
          const ta = document.createElement('textarea')
          ta.value = text
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }}
    >
      {copied ? '✓' : '⧉'}
    </button>
  )
}
