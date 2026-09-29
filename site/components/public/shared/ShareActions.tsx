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
      <button type='button' className='article-share__button' onClick={handleShare} aria-label='Udostępnij artykuł'>
        Udostępnij
      </button>
      <span className='article-share__status' aria-live='polite'>{status}</span>
    </span>
  )
}
