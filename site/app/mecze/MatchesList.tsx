'use client'

import { useCallback, useState } from 'react'
import type { GameSummary } from '../../lib/data'
import { gameSummarySchema } from '../../lib/data/schemas'
import { formatDateTime } from '../../lib/format'
import { SlideoutPanel } from '../../components/public/shared/SlideoutPanel'
import { formatVenue } from '../../lib/venue'
import { MatchDrawerContent } from './MatchDrawerContent'
import {
  ArrowRightIcon,
  CalendarIcon,
  IconLabel,
  MapPinIcon,
  MetaWithIcons,
} from '../../components/public/shared/PublicIcons'

interface MatchesListProps {
  games: GameSummary[]
}

export function MatchesList({ games }: MatchesListProps) {
  const [activeTab, setActiveTab] = useState<'past' | 'upcoming'>('past')
  const [selectedGame, setSelectedGame] = useState<GameSummary | null>(null)
  const [detailGame, setDetailGame] = useState<GameSummary | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const pastGames = games.filter(
    (g) => g.result || (g.scoreUs !== null && g.scoreThem !== null)
  )
  const upcomingGames = games.filter(
    (g) => !g.result && g.scoreUs === null && g.scoreThem === null
  )

  const sortedUpcoming = [...upcomingGames].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const sortedPast = [...pastGames].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const handleOpenDrawer = useCallback(async (game: GameSummary) => {
    setSelectedGame(game)
    setDetailGame(null)
    setDetailError(null)
    setDetailLoading(true)
    setIsOpen(true)

    try {
      const response = await fetch(`/api/games/${encodeURIComponent(game.id)}`)
      if (!response.ok) {
        setDetailError('Nie udało się załadować statystyk meczu.')
        setDetailGame(game)
        return
      }
      const payload: unknown = await response.json()
      const parsed = gameSummarySchema.safeParse(payload)
      setDetailGame(parsed.success ? parsed.data : game)
    } catch {
      setDetailError('Nie udało się załadować statystyk meczu.')
      setDetailGame(game)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const handleCloseDrawer = () => {
    setIsOpen(false)
    setTimeout(() => {
      setSelectedGame(null)
      setDetailGame(null)
      setDetailError(null)
      setDetailLoading(false)
    }, 300)
  }

  return (
    <>
      <div className='match-tabs-premium' role='tablist' aria-label='Filtrowanie meczów'>
        <button
          type='button'
          role='tab'
          aria-selected={activeTab === 'past'}
          className={`match-tab-premium-btn ${activeTab === 'past' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Rozegrane spotkania ({sortedPast.length})
        </button>
        <button
          type='button'
          role='tab'
          aria-selected={activeTab === 'upcoming'}
          className={`match-tab-premium-btn ${activeTab === 'upcoming' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Terminarz / Nadchodzące ({sortedUpcoming.length})
        </button>
      </div>

      {activeTab === 'past' ? (
        <div className='stack-list-v2'>
          {sortedPast.map((game) => {
            const isWin = game.result === 'W' || (game.scoreUs || 0) > (game.scoreThem || 0)
            return (
              <button
                key={game.id}
                className='list-row-v2 list-row-v2--button premium-match-card'
                onClick={() => handleOpenDrawer(game)}
                type='button'
              >
                <div className='pm-card-left'>
                  <div className='pm-card-meta'>
                    <span className={`result-outcome-badge ${isWin ? 'is-win-badge' : 'is-loss-badge'}`}>
                      {isWin ? 'W' : 'L'}
                    </span>
                    <span className='pm-card-date'>{formatDateTime(game.date)}</span>
                  </div>
                  <h2 className='pm-card-opponent'>vs {game.opponent}</h2>
                  <span className='pm-card-location'>
                    KALK ·{' '}
                    <IconLabel icon={<MapPinIcon size={14} />}>{formatVenue(game.data?.venue)}</IconLabel>
                  </span>
                </div>
                
                <div className='pm-card-right'>
                  <div className='pm-card-score-box'>
                    <span className={isWin ? 'color-win' : undefined}>{game.scoreUs}</span>
                    <span className='score-separator'>:</span>
                    <span className={!isWin ? 'color-win' : undefined}>{game.scoreThem}</span>
                  </div>
                  <span className='pm-card-action-btn'>
                    Szczegóły
                    <ArrowRightIcon size={12} />
                  </span>
                </div>
              </button>
            )
          })}
          {sortedPast.length === 0 ? <p className='match-empty'>Brak rozegranych meczów w tym sezonie.</p> : null}
        </div>
      ) : (
        <div className='stack-list-v2'>
          {sortedUpcoming.map((game) => (
            <div key={game.id} className='list-row-v2 premium-match-card-upcoming'>
              <div className='pm-card-left'>
                <span className='upcoming-pill'>Termin</span>
                <h2 className='pm-card-opponent'>vs {game.opponent}</h2>
                <p className='muted pm-card-location'>
                  <MetaWithIcons>
                    <IconLabel icon={<CalendarIcon size={14} />}>{formatDateTime(game.date)}</IconLabel>
                    <span className='meta-with-icons__sep' aria-hidden>
                      ·
                    </span>
                    <IconLabel icon={<MapPinIcon size={14} />}>{formatVenue(game.data?.venue)}</IconLabel>
                  </MetaWithIcons>
                </p>
              </div>
              <div className='pm-card-right'>
                <span className='upcoming-venue-badge'>KALK</span>
              </div>
            </div>
          ))}
          {sortedUpcoming.length === 0 ? <p className='match-empty'>Brak zaplanowanych spotkań w najbliższym czasie.</p> : null}
        </div>
      )}

      <SlideoutPanel isOpen={isOpen} onClose={handleCloseDrawer} title='Szczegóły meczu'>
        {selectedGame ? (
          <MatchDrawerContent
            game={detailGame ?? selectedGame}
            loading={detailLoading}
            loadError={detailError}
          />
        ) : null}
      </SlideoutPanel>
    </>
  )
}
