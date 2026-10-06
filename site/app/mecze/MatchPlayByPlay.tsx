'use client'

import React, { useState, useEffect, useMemo } from 'react'

export interface PlayByPlayEvent {
  time: string
  side: 'home' | 'away' | 'neutral'
  player?: string | null
  action: string
  score?: string | null
}

export interface PlayByPlayPeriod {
  title: string
  events: PlayByPlayEvent[]
}

interface MatchPlayByPlayProps {
  gameId: string
  homeTeamName: string
  awayTeamName: string
}

type EventCategory =
  | 'all'
  | 'score'
  | 'miss'
  | 'rebound'
  | 'assist'
  | 'turnover'
  | 'steal'
  | 'foul'
  | 'sub'
  | 'block'

interface FilterOption {
  key: EventCategory
  label: string
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'all', label: 'Wszystkie akcje' },
  { key: 'score', label: 'Punkty i celne rzuty' },
  { key: 'rebound', label: 'Zbiórki' },
  { key: 'assist', label: 'Asysty' },
  { key: 'turnover', label: 'Straty' },
  { key: 'steal', label: 'Przechwyty' },
  { key: 'block', label: 'Bloki' },
  { key: 'foul', label: 'Faule' },
  { key: 'sub', label: 'Zmiany' },
  { key: 'miss', label: 'Niecelne rzuty' }
]

function matchesCategory(action: string, category: EventCategory, hasScore: boolean): boolean {
  if (category === 'all') return true
  const act = action.toLowerCase()
  switch (category) {
    case 'score':
      return hasScore || act.includes('celny') || act.includes('punkty')
    case 'rebound':
      return act.includes('zbiórka') || act.includes('zbiorka')
    case 'assist':
      return act.includes('asysta')
    case 'turnover':
      return act.includes('strata')
    case 'steal':
      return act.includes('przechwyt')
    case 'block':
      return act.includes('blok')
    case 'foul':
      return act.includes('faul')
    case 'sub':
      return act.includes('zmiana')
    case 'miss':
      return act.includes('niecelny') || act.includes('zablokowany')
    default:
      return true
  }
}

export function MatchPlayByPlay({ gameId, homeTeamName, awayTeamName }: MatchPlayByPlayProps) {
  const [periods, setPeriods] = useState<PlayByPlayPeriod[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<number | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('all')
  const [selectedSide, setSelectedSide] = useState<'all' | 'home' | 'away'>('all')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    fetch(`/api/games/${encodeURIComponent(gameId)}/play-by-play`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Przebieg meczu (akcja po akcji) nie jest jeszcze dostępny dla tego spotkania.')
        }
        return res.json()
      })
      .then((data: PlayByPlayPeriod[]) => {
        if (!active) return
        if (Array.isArray(data) && data.length > 0) {
          setPeriods(data)
        } else {
          setError('Brak zarejestrowanych akcji dla tego spotkania.')
        }
      })
      .catch((err: Error) => {
        if (!active) return
        setError(err.message || 'Nie udało się wczytać przebiegu meczu.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [gameId])

  // Count actions per category for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<EventCategory, number> = {
      all: 0,
      score: 0,
      rebound: 0,
      assist: 0,
      turnover: 0,
      steal: 0,
      block: 0,
      foul: 0,
      sub: 0,
      miss: 0
    }

    const activePeriods = selectedPeriod === 'all'
      ? periods
      : [periods[selectedPeriod]].filter(Boolean)

    for (const p of activePeriods) {
      for (const ev of p.events) {
        if (selectedSide !== 'all' && ev.side !== selectedSide && ev.side !== 'neutral') {
          continue
        }
        counts.all += 1
        const hasScore = Boolean(ev.score)
        if (matchesCategory(ev.action, 'score', hasScore)) counts.score += 1
        if (matchesCategory(ev.action, 'rebound', hasScore)) counts.rebound += 1
        if (matchesCategory(ev.action, 'assist', hasScore)) counts.assist += 1
        if (matchesCategory(ev.action, 'turnover', hasScore)) counts.turnover += 1
        if (matchesCategory(ev.action, 'steal', hasScore)) counts.steal += 1
        if (matchesCategory(ev.action, 'block', hasScore)) counts.block += 1
        if (matchesCategory(ev.action, 'foul', hasScore)) counts.foul += 1
        if (matchesCategory(ev.action, 'sub', hasScore)) counts.sub += 1
        if (matchesCategory(ev.action, 'miss', hasScore)) counts.miss += 1
      }
    }
    return counts
  }, [periods, selectedPeriod, selectedSide])

  // Filter periods & events
  const filteredPeriods = useMemo(() => {
    const activePeriods = selectedPeriod === 'all'
      ? periods
      : [periods[selectedPeriod]].filter(Boolean)

    return activePeriods.map(p => {
      const filteredEvents = p.events.filter(ev => {
        // Team filter
        if (selectedSide !== 'all' && ev.side !== selectedSide && ev.side !== 'neutral') {
          return false
        }
        // Action category filter
        return matchesCategory(ev.action, selectedCategory, Boolean(ev.score))
      })
      return {
        ...p,
        events: filteredEvents
      }
    })
  }, [periods, selectedPeriod, selectedCategory, selectedSide])

  if (loading) {
    return (
      <div className='pbp-loading-box'>
        <p className='muted'>Ładowanie zapisu akcja po akcji z protokołu KALK…</p>
      </div>
    )
  }

  if (error || periods.length === 0) {
    return (
      <div className='pbp-empty-box'>
        <p className='muted'>{error || 'Przebieg akcja po akcji jest niedostępny.'}</p>
      </div>
    )
  }

  const totalDisplayedEvents = filteredPeriods.reduce((sum, p) => sum + p.events.length, 0)

  return (
    <div className='pbp-container'>
      {/* 1. Quarter filter buttons */}
      <div className='pbp-filter-group'>
        <span className='pbp-filter-label text-xs muted font-bold'>KWARTY:</span>
        <div className='pbp-period-tabs' role='tablist' aria-label='Wybór kwarty'>
          <button
            type='button'
            role='tab'
            aria-selected={selectedPeriod === 'all'}
            className={`boxscore-team-tab ${selectedPeriod === 'all' ? 'boxscore-team-tab--active' : ''}`}
            onClick={() => setSelectedPeriod('all')}
          >
            Cały mecz
          </button>
          {periods.map((period, idx) => (
            <button
              key={idx}
              type='button'
              role='tab'
              aria-selected={selectedPeriod === idx}
              className={`boxscore-team-tab ${selectedPeriod === idx ? 'boxscore-team-tab--active' : ''}`}
              onClick={() => setSelectedPeriod(idx)}
            >
              {period.title}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Team filter (Wszystkie, BeKaPaKa, Rywal) */}
      <div className='pbp-filter-group'>
        <span className='pbp-filter-label text-xs muted font-bold'>DRUŻYNA:</span>
        <div className='pbp-team-filter-tabs' role='tablist' aria-label='Filtr drużyny'>
          <button
            type='button'
            role='tab'
            aria-selected={selectedSide === 'all'}
            className={`boxscore-team-tab ${selectedSide === 'all' ? 'boxscore-team-tab--active' : ''}`}
            onClick={() => setSelectedSide('all')}
          >
            Obie drużyny
          </button>
          <button
            type='button'
            role='tab'
            aria-selected={selectedSide === 'home'}
            className={`boxscore-team-tab ${selectedSide === 'home' ? 'boxscore-team-tab--active' : ''}`}
            onClick={() => setSelectedSide('home')}
          >
            {homeTeamName}
          </button>
          <button
            type='button'
            role='tab'
            aria-selected={selectedSide === 'away'}
            className={`boxscore-team-tab ${selectedSide === 'away' ? 'boxscore-team-tab--active' : ''}`}
            onClick={() => setSelectedSide('away')}
          >
            {awayTeamName}
          </button>
        </div>
      </div>

      {/* 3. Specific Action Event Filter Buttons */}
      <div className='pbp-filter-group'>
        <span className='pbp-filter-label text-xs muted font-bold'>RODZAJ AKCJI:</span>
        <div className='pbp-action-filter-pills' role='tablist' aria-label='Filtr rodzaju akcji'>
          {FILTER_OPTIONS.map((opt) => {
            const count = categoryCounts[opt.key]
            if (count === 0 && opt.key !== 'all') return null
            const isActive = selectedCategory === opt.key
            return (
              <button
                key={opt.key}
                type='button'
                role='tab'
                aria-selected={isActive}
                className={`pbp-action-pill ${isActive ? 'pbp-action-pill--active' : ''}`}
                onClick={() => setSelectedCategory(opt.key)}
              >
                <span>{opt.label}</span>
                <span className='pbp-pill-count'>{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Summary indicator */}
      {selectedCategory !== 'all' || selectedSide !== 'all' ? (
        <div className='pbp-active-filter-bar'>
          <span className='text-xs'>
            Wyniki filtrowania: <strong>{totalDisplayedEvents}</strong> akcji
          </span>
          <button
            type='button'
            className='pbp-reset-btn text-xs'
            onClick={() => {
              setSelectedCategory('all')
              setSelectedSide('all')
            }}
          >
            ✕ Resetuj filtry
          </button>
        </div>
      ) : null}

      {/* Timeline of events */}
      {totalDisplayedEvents === 0 ? (
        <div className='pbp-empty-box'>
          <p className='muted'>Brak zdarzeń spełniających wybrane kryteria filtrów.</p>
        </div>
      ) : (
        <div className='pbp-timeline'>
          {filteredPeriods.map((period, pIdx) => {
            if (period.events.length === 0) return null
            return (
              <div key={pIdx} className='pbp-period-block'>
                <div className='pbp-period-header'>
                  <h4 className='pbp-period-title'>{period.title}</h4>
                  <span className='pbp-period-badge'>{period.events.length} zdarzeń</span>
                </div>

                <div className='pbp-events-list'>
                  {period.events.map((ev, eIdx) => {
                    const isHome = ev.side === 'home'
                    const isAway = ev.side === 'away'
                    const isScoreEvent = Boolean(ev.score)
                    const isCelny = ev.action.toLowerCase().includes('celny') || isScoreEvent
                    const isZbiorka = ev.action.toLowerCase().includes('zbiórka') || ev.action.toLowerCase().includes('zbiorka')
                    const isAsysta = ev.action.toLowerCase().includes('asysta')
                    const isStrata = ev.action.toLowerCase().includes('strata')
                    const isPrzechwyt = ev.action.toLowerCase().includes('przechwyt')
                    const isBlok = ev.action.toLowerCase().includes('blok')
                    const isFaul = ev.action.toLowerCase().includes('faul')
                    const isZmiana = ev.action.toLowerCase().includes('zmiana')

                    let actionBadgeCls = ''
                    if (isCelny) actionBadgeCls = 'pbp-badge--score'
                    else if (isZbiorka) actionBadgeCls = 'pbp-badge--rebound'
                    else if (isAsysta) actionBadgeCls = 'pbp-badge--assist'
                    else if (isStrata) actionBadgeCls = 'pbp-badge--tov'
                    else if (isPrzechwyt) actionBadgeCls = 'pbp-badge--stl'
                    else if (isBlok) actionBadgeCls = 'pbp-badge--blk'
                    else if (isFaul) actionBadgeCls = 'pbp-badge--foul'
                    else if (isZmiana) actionBadgeCls = 'pbp-badge--sub'

                    return (
                      <div
                        key={eIdx}
                        className={`pbp-event-row pbp-event-row--${ev.side} ${isScoreEvent ? 'pbp-event-row--scoring' : ''}`}
                      >
                        {/* Home Side Action (Left) */}
                        <div className='pbp-cell pbp-cell--home'>
                          {isHome && (
                            <div className='pbp-action-content'>
                              {ev.player && <span className='pbp-player-name font-bold'>{ev.player}</span>}
                              <span className={`pbp-action-desc ${actionBadgeCls}`}>
                                {ev.action}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Center Timestamp & Score Indicator */}
                        <div className='pbp-cell-center'>
                          <span className='pbp-timestamp font-mono'>{ev.time}</span>
                          {ev.score && (
                            <span className='pbp-score-badge font-mono font-bold highlight-gold'>
                              {ev.score}
                            </span>
                          )}
                        </div>

                        {/* Away Side Action (Right) */}
                        <div className='pbp-cell pbp-cell--away'>
                          {isAway && (
                            <div className='pbp-action-content'>
                              {ev.player && <span className='pbp-player-name font-bold'>{ev.player}</span>}
                              <span className={`pbp-action-desc ${actionBadgeCls}`}>
                                {ev.action}
                              </span>
                            </div>
                          )}
                          {ev.side === 'neutral' && (
                            <div className='pbp-action-content pbp-action-content--neutral'>
                              <span className='pbp-action-desc muted'>{ev.action}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
