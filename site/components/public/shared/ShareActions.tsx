'use client'

import { useEffect, useState } from 'react'

/** Przycisk udostępniania o tej samej wysokości co pozostałe akcje; wynik pojawia się w etykiecie i regionie live. */
export function ShareActions() {
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!status) return
    const timer = window.setTimeout(() => setStatus(''), 2500)
    return () => window.clearTimeout(timer)
  }, [status])

  async function handleShare() {
    const url = window.location.href
    const title = document.title
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        setStatus('Udostępniono')
        return
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const input = document.createElement('input')
        input.value = url
        input.setAttribute('readonly', '')
        input.style.position = 'fixed'
        input.style.opacity = '0'
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        input.remove()
      }
      setStatus('Skopiowano link')
    } catch {
      setStatus('Nie udało się udostępnić')
    }
  }

  return (
    <button type="button" className="btn btn--secondary share" onClick={handleShare}>
      <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
        <path d="M12 3v12M7 8l5-5 5 5M5 13v8h14v-8" />
      </svg>
      <span>{status || 'Udostępnij'}</span>
      <span className="sr-only" aria-live="polite">
        {status}
      </span>
    </button>
  )
}
