'use client'

import { useEffect } from 'react'

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug || typeof window === 'undefined') return

    try {
      const sessionKey = `bkpk_view_${slug}`
      if (sessionStorage.getItem(sessionKey)) return

      sessionStorage.setItem(sessionKey, '1')
      fetch(`/api/views/${encodeURIComponent(slug)}`, {
        method: 'POST',
        keepalive: true
      }).catch(() => {})
    } catch {
      // In case private mode / storage restrictions throw
    }
  }, [slug])

  return null
}
