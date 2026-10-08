'use client'

import React, { useState, useEffect, useMemo } from 'react'
import type { PlayByPlayData, PlayByPlayEvent, PlayByPlayPeriod } from '../../lib/data/play-by-play'

export type { PlayByPlayEvent, PlayByPlayPeriod }

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
      // „niecelny” zawiera „celny” — liczymy tylko rzuty zaczynające się od „Celny” i zdarzenia z wynikiem
      return hasScore || act.startsWith('celny') || act.includes('punkty')
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

/** Opis akcji bez powtarzania nazwiska; kod KALK „#-2” (wejście z ławki / pierwsza piątka) zamieniony na słowa. */
export function describeAction(action: string, player?: string | null): string {
  const entry = action.match(/^Zmiana:\s*#-?\d+\s*→\s*(.+?)(?:\s*\(#\d+\))?$/)
  if (entry && /#-\d/.test(action)) return 'Wchodzi na parkiet'
  const sub = action.match(/^Zmiana:\s*(.+?)\s*→\s*(.+)$/)
  if (sub) return `Zmiana: ${sub[1]} → ${sub[2]}`
  if (player && action.includes(player)) return action.replace(player, '').replace(/\s{2,}/g, ' ').trim()
  return action
}

function periodScore(events: PlayByPlayEvent[]): string | null {
  for (let i = events.length - 1; i >= 0; i--) if (events[i].score) return events[i].score as string
  return null
}

export function MatchPlayByPlay({ gameId, homeTeamName, awayTeamName }: MatchPlayByPlayProps) {
  const [periods, setPeriods] = useState<PlayByPlayPeriod[]>([])
  // Strony zdarzeń są wg KALK (gospodarz/gość), nie wg BeKaPaKa — nazwy bierzemy z odpowiedzi
  const [teams, setTeams] = useState<Pick<PlayByPlayData, 'home' | 'away'> | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<number | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('score')
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
      .then((data: PlayByPlayData) => {
        if (!active) return
        if (Array.isArray(data?.periods) && data.periods.length > 0) {
          setPeriods(data.periods)
          setTeams({ home: data.home, away: data.away })
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

  const sideName = {
    home: teams?.home.name || homeTeamName,
    away: teams?.away.name || awayTeamName
  }
  const shortName = (name: string) => name.replace(/\s+Bobolice$/i, '')
  const sides: { key: 'all' | 'home' | 'away'; label: string }[] = [
    { key: 'all', label: 'Obie' },
    { key: 'home', label: shortName(sideName.home) },
    { key: 'away', label: shortName(sideName.away) }
  ]

  return (
    <div className='pbp'>
      <div className='pbp-toolbar'>
        <div className='segmented pbp-toolbar__periods' role='tablist' aria-label='Kwarta'>
          <button type='button' role='tab' aria-selected={selectedPeriod === 'all'} className='segmented__btn' onClick={() => setSelectedPeriod('all')}>
            Mecz
          </button>
          {periods.map((period, idx) => (
            <button key={idx} type='button' role='tab' aria-selected={selectedPeriod === idx} className='segmented__btn' onClick={() => setSelectedPeriod(idx)}>
              {period.title.replace(/^Kwarta\s*/i, 'Q')}
            </button>
          ))}
        </div>
        <div className='segmented' role='tablist' aria-label='Drużyna'>
          {sides.map((side) => (
            <button key={side.key} type='button' role='tab' aria-selected={selectedSide === side.key} className='segmented__btn' onClick={() => setSelectedSide(side.key)}>
              {side.label}
            </button>
          ))}
        </div>
        <label className='select'>
          <span className='sr-only'>Rodzaj akcji</span>
          <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value as EventCategory)}>
            {FILTER_OPTIONS.map((opt) => {
              const count = categoryCounts[opt.key]
              if (count === 0 && opt.key !== 'all' && opt.key !== selectedCategory) return null
              return (
                <option key={opt.key} value={opt.key}>
                  {opt.label} ({count})
                </option>
              )
            })}
          </select>
        </label>
        {(selectedCategory !== 'score' || selectedSide !== 'all' || selectedPeriod !== 'all') && (
          <button
            type='button'
            className='btn btn--secondary'
            onClick={() => {
              setSelectedCategory('score')
              setSelectedSide('all')
              setSelectedPeriod('all')
            }}
          >
            Resetuj
          </button>
        )}
      </div>
      <p className='pbp-summary' aria-live='polite'>
        {totalDisplayedEvents} {totalDisplayedEvents === 1 ? 'zdarzenie' : 'zdarzeń'}
        {selectedCategory === 'score' ? ' — punkty i celne rzuty' : ''}
      </p>

      {totalDisplayedEvents === 0 ? (
        <p className='pbp-empty'>Brak zdarzeń dla wybranych filtrów.</p>
      ) : (
        <div className='pbp-timeline'>
          {filteredPeriods.map((period, pIdx) => {
            const full = selectedPeriod === 'all' ? periods[pIdx] : periods[selectedPeriod as number]
            const after = full ? periodScore(full.events) : null
            const events = period.events.filter((ev) => ev.side !== 'neutral')
            if (events.length === 0) return null
            return (
              <section key={pIdx} className='pbp-period' aria-label={period.title}>
                <header className='pbp-period__head'>
                  <h4 className='pbp-period__title'>{period.title}</h4>
                  {after && (
                    <span className='pbp-period__score'>
                      po kwarcie <strong>{after}</strong>
                    </span>
                  )}
                </header>
                <ol className='pbp-events zebra-list' role='list'>
                  {events.map((ev, eIdx) => (
                    <li key={eIdx} className={`pbp-event pbp-event--${ev.side}${ev.score ? ' is-score' : ''}`}>
                      <time className='pbp-event__time'>{ev.time}</time>
                      <span className='pbp-event__team' title={sideName[ev.side as 'home' | 'away']}>
                        {shortName(sideName[ev.side as 'home' | 'away'])}
                      </span>
                      <span className='pbp-event__text'>
                        {ev.player ? <strong>{ev.player}</strong> : null}
                        <span>{describeAction(ev.action, ev.player)}</span>
                      </span>
                      <span className='pbp-event__score'>{ev.score ?? ''}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
