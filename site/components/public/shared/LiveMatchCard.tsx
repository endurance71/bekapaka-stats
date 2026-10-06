'use client'
import { useEffect, useState, type ReactNode } from 'react'
import type { GameSummary } from '../../../lib/data/schemas'
import { MatchCard } from './MatchCard'
export function LiveMatchCard({
  game,
  hero,
  actions
}: {
  game: GameSummary
  hero?: boolean
  actions?: ReactNode
}) {
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
        setCurrent(gameSummarySchema.parse(await response.json()))
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
  }, [game.id, current.status])
  return (
    <>
      <MatchCard game={current} hero={hero} actions={actions} />
      {error && (
        <p role="status">Nie udało się odświeżyć wyniku. Wyświetlamy ostatnie dostępne dane.</p>
      )}
    </>
  )
}
