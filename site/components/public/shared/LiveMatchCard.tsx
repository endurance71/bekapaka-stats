'use client'
import { useEffect, useState, type ComponentProps } from 'react'
import { MatchHero } from '../match/MatchHero'

/** Hero meczu z odświeżaniem co 30 s, gdy mecz trwa (LIVE / przerwa). Wynik zmienia się bez animacji liczb. */
export function LiveMatchCard({ game, ...props }: ComponentProps<typeof MatchHero>) {
  const [current, setCurrent] = useState(game)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!['LIVE', 'BREAK'].includes(current.status || '')) return
    const controller = new AbortController()
    const refresh = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const response = await fetch(`/api/games/${encodeURIComponent(game.id)}?fresh=1`, {
          signal: controller.signal
        })
        if (!response.ok) throw new Error()
        const { gameSummarySchema } = await import('../../../lib/data/schemas')
        setCurrent({ ...gameSummarySchema.parse(await response.json()), opponentLogoUrl: game.opponentLogoUrl })
        setError(false)
      } catch {
        if (!controller.signal.aborted) setError(true)
      }
    }
    const timer = setInterval(() => void refresh(), 30000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      controller.abort()
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [game.id, game.opponentLogoUrl, current.status])
  return (
    <>
      <MatchHero game={current} {...props} />
      {error && (
        <p className="container live-error" role="status">
          Nie udało się odświeżyć wyniku. Wyświetlamy ostatnie dostępne dane.
        </p>
      )}
    </>
  )
}
