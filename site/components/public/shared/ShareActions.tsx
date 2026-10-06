'use client'

import { useState } from 'react'

export function ShareActions() {
  const [status, setStatus] = useState('')

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
    <span className='article-share'>
      <button type='button' className='btn btn--secondary btn--sm' onClick={handleShare} aria-label='Udostępnij stronę'>
        <svg
          className='ico'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='square'
          strokeLinejoin='miter'
          aria-hidden='true'
        >
          <path d='M12 3v12M7 8l5-5 5 5M5 13v8h14v-8' />
        </svg>
        Udostępnij
      </button>
      {status ? <span className='article-share__status' aria-live='polite'>{status}</span> : null}
    </span>
  )
}
