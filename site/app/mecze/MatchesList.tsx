'use client'

import React, { useState, useEffect } from 'react'
import type { GameSummary } from '../../lib/data'
import { formatDateTime } from '../../lib/format'

interface MatchesListProps {
  games: GameSummary[]
}

export function MatchesList({ games }: MatchesListProps) {
  const [activeTab, setActiveTab] = useState<'past' | 'upcoming'>('past')
  const [selectedGame, setSelectedGame] = useState<GameSummary | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Split into past and upcoming
  // Past matches: have a result ('W' | 'L') OR have a final score (scoreUs and scoreThem are not null)
  // Upcoming matches: result is null and scores are null
  const pastGames = games.filter(
    (g) => g.result || (g.scoreUs !== null && g.scoreThem !== null)
  )
  const upcomingGames = games.filter(
    (g) => !g.result && g.scoreUs === null && g.scoreThem === null
  )

  // Sort upcoming games so the closest upcoming is first (date ascending)
  const sortedUpcoming = [...upcomingGames].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Sort past games descending (newest first)
  const sortedPast = [...pastGames].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const handleOpenDrawer = (game: GameSummary) => {
    setSelectedGame(game)
    setIsOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsOpen(false)
    setTimeout(() => {
      setSelectedGame(null)
    }, 400)
  }

  // Prevent scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  function parseMarkdown(md?: string | null) {
    if (!md) return null
    const lines = md.split('\n')
    return lines.map((line, idx) => {
      let text = line.trim()
      if (!text) return <div key={idx} style={{ height: '8px' }} />

      // Headers
      if (text.startsWith('###')) {
        return (
          <h5 key={idx} style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '16px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {text.replace('###', '').trim()}
          </h5>
        )
      }
      if (text.startsWith('##') || text.startsWith('#')) {
        return (
          <h4 key={idx} style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--bkp-gold)', marginTop: '20px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {text.replace(/^#+\s*/, '').trim()}
          </h4>
        )
      }

      // List items
      let isListItem = false
      if (text.startsWith('-') || text.startsWith('*')) {
        isListItem = true
        text = text.substring(1).trim()
      }

      // Bold formatting: **text**
      const parts = text.split('**')
      const content = parts.map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i} style={{ fontWeight: '700', color: 'var(--text-main)' }}>{part}</strong>
        }
        return part
      })

      if (isListItem) {
        return (
          <li key={idx} style={{ marginLeft: '20px', listStyleType: 'disc', fontSize: '0.85rem', color: '#d1d1d1', marginBottom: '6px', lineHeight: '1.5' }}>
            {content}
          </li>
        )
      }

      return (
        <p key={idx} style={{ fontSize: '0.85rem', color: '#d1d1d1', marginBottom: '10px', lineHeight: '1.5' }}>
          {content}
        </p>
      )
    })
  }

  // Find BeKaPaKa team stats and opponent team stats in a game
  const getTeamsFromGame = (game: GameSummary) => {
    const teams = game.teams || game.data?.teams
    if (!Array.isArray(teams)) return null
    const us = teams.find(
      (t) =>
        t.isBekapaka ||
        t.name?.toLowerCase().includes('bekapaka') ||
        t.name?.toLowerCase().includes('bobolice')
    )
    const them = teams.find((t) => t !== us)
    return { us, them }
  }

  return (
    <>
      {/* Navigation tabs */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1px' }}>
        <button
          onClick={() => setActiveTab('past')}
          style={{
            fontFamily: 'var(--font-bebas-neue), sans-serif',
            fontSize: '1.4rem',
            background: 'none',
            border: 'none',
            color: activeTab === 'past' ? 'var(--bkp-gold)' : 'var(--text-muted)',
            padding: '10px 5px',
            cursor: 'pointer',
            borderBottom: activeTab === 'past' ? '2px solid var(--bkp-gold)' : '2px solid transparent',
            letterSpacing: '0.04em',
            transition: 'color 0.2s ease, border-color 0.2s ease'
          }}
        >
          Rozegrane mecze ({sortedPast.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          style={{
            fontFamily: 'var(--font-bebas-neue), sans-serif',
            fontSize: '1.4rem',
            background: 'none',
            border: 'none',
            color: activeTab === 'upcoming' ? 'var(--bkp-gold)' : 'var(--text-muted)',
            padding: '10px 5px',
            cursor: 'pointer',
            borderBottom: activeTab === 'upcoming' ? '2px solid var(--bkp-gold)' : '2px solid transparent',
            letterSpacing: '0.04em',
            transition: 'color 0.2s ease, border-color 0.2s ease'
          }}
        >
          Terminarz ({sortedUpcoming.length})
        </button>
      </div>

      {/* Renders current tab */}
      {activeTab === 'past' ? (
        <div className='stack-list'>
          {sortedPast.map((game) => {
            const isWin = game.result === 'W' || (game.scoreUs || 0) > (game.scoreThem || 0)
            return (
              <article
                key={game.id}
                className='list-row'
                onClick={() => handleOpenDrawer(game)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      className='pill'
                      style={{
                        background: isWin ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isWin ? '#10b981' : '#ef4444',
                        border: isWin ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 700
                      }}
                    >
                      {isWin ? 'Wygrana' : 'Przegrana'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatDateTime(game.date)}
                    </span>
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '1.8rem', margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                    vs {game.opponent}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {game.homeAway === 'home' ? 'Mecz u siebie' : 'Mecz wyjazdowy'}
                  </span>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <div style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '2.2rem', color: 'var(--text-main)', letterSpacing: '0.02em', lineHeight: 1 }}>
                    <span style={{ color: isWin ? 'var(--bkp-gold)' : 'var(--text-main)' }}>{game.scoreUs}</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>:</span>
                    <span style={{ color: !isWin ? 'var(--bkp-gold)' : 'var(--text-main)' }}>{game.scoreThem}</span>
                  </div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--bkp-gold)', letterSpacing: '0.05em' }}>
                    Szczegóły ➔
                  </span>
                </div>
              </article>
            )
          })}
          {sortedPast.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Brak rozegranych meczów.</p>
          )}
        </div>
      ) : (
        <div className='stack-list'>
          {sortedUpcoming.map((game) => (
            <article key={game.id} className='list-row' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className='pill' style={{ background: 'var(--bkp-slate)', fontSize: '10px', textTransform: 'uppercase', marginBottom: '6px', display: 'inline-block' }}>
                  Nadchodzący
                </span>
                <h2 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '1.8rem', margin: '4px 0 6px 0', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                  vs {game.opponent}
                </h2>
                <p className='muted' style={{ margin: 0, fontSize: '0.9rem' }}>
                  📅 {formatDateTime(game.date)} {game.data?.venue ? ` | 📍 ${game.data.venue}` : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    color: 'var(--text-main)'
                  }}
                >
                  {game.homeAway === 'home' ? 'Dom' : 'Wyjazd'}
                </span>
              </div>
            </article>
          ))}
          {sortedUpcoming.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Brak zaplanowanych spotkań.</p>
          )}
        </div>
      )}

      {/* Match Details Drawer */}
      <div className={`stats-drawer ${isOpen ? 'is-open' : ''}`}>
        <div className='stats-drawer__backdrop' onClick={handleCloseDrawer} />
        <div className='stats-drawer__panel'>
          <button className='stats-drawer__close' onClick={handleCloseDrawer} aria-label='Close drawer'>
            ✕
          </button>

          {selectedGame && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
              {/* Header */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {formatDateTime(selectedGame.date)} {selectedGame.data?.venue ? `| 📍 ${selectedGame.data.venue}` : ''}
                </span>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '2.2rem', color: 'var(--text-main)', margin: 0, lineHeight: 1 }}>
                      BeKaPaKa
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gospodarz</span>
                  </div>

                  <div style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '3rem', color: 'var(--bkp-gold)', letterSpacing: '0.02em', padding: '0 20px', display: 'flex', alignItems: 'center' }}>
                    <span>{selectedGame.scoreUs}</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 8px', fontSize: '2rem' }}>:</span>
                    <span>{selectedGame.scoreThem}</span>
                  </div>

                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <h2 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '2.2rem', color: 'var(--text-main)', margin: 0, lineHeight: 1, textTransform: 'uppercase' }}>
                      {selectedGame.opponent}
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gość</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <span
                    style={{
                      background: (selectedGame.scoreUs || 0) > (selectedGame.scoreThem || 0) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: (selectedGame.scoreUs || 0) > (selectedGame.scoreThem || 0) ? '#10b981' : '#ef4444',
                      border: (selectedGame.scoreUs || 0) > (selectedGame.scoreThem || 0) ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                      padding: '4px 14px',
                      borderRadius: '99px',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      letterSpacing: '0.05em'
                    }}
                  >
                    {(selectedGame.scoreUs || 0) > (selectedGame.scoreThem || 0) ? 'Zwycięstwo BeKaPaKa' : 'Porażka'}
                  </span>
                </div>
              </div>

              {/* Quarters Details */}
              {selectedGame.data?.quarters && Array.isArray(selectedGame.data.quarters) && (
                <div>
                  <h3 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Kwarty
                  </h3>
                  <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '15px' }}>
                    {selectedGame.data.quarters.map((q: { label: string; home: number; away: number }, idx: number) => (
                      <div key={idx} style={{ flex: 1, textAlign: 'center', borderRight: idx < selectedGame.data.quarters.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                          {q.label || `Q${idx + 1}`}
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '4px', color: q.home > q.away ? 'var(--bkp-gold)' : 'var(--text-main)' }}>
                          {q.home}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: q.away > q.home ? 'var(--bkp-gold)' : 'var(--text-muted)', fontWeight: 600 }}>
                          {q.away}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Stats Comparison */}
              {(() => {
                const comparisonStats = selectedGame.data?.teamStats
                if (!comparisonStats || typeof comparisonStats !== 'object') return null

                // Labels mapping
                const statKeys = [
                  { key: 'Punkty spod kosza', label: 'Punkty z pomalowanego' },
                  { key: 'Punkty po szybkim ataku', label: 'Punkty z szybkiego ataku' },
                  { key: 'Punkty po stratach', label: 'Punkty po stratach rywala' },
                  { key: 'Punkty drugiej szansy', label: 'Punkty 2. szansy' },
                  { key: 'Punkty zmiennikow', label: 'Punkty rezerwowych' },
                  { key: 'Punkty zmienników', label: 'Punkty rezerwowych' }
                ]

                // Filter out non-existent keys
                const availableStats = statKeys
                  .map((sk) => {
                    const val = comparisonStats[sk.key]
                    if (!val) return null
                    return { label: sk.label, home: val.home || 0, away: val.away || 0 }
                  })
                  .filter(Boolean) as { label: string; home: number; away: number }[]

                if (availableStats.length === 0) return null

                return (
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Porównanie zespołowe
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '15px' }}>
                      {availableStats.map((stat, idx) => {
                        const total = stat.home + stat.away
                        const homePct = total > 0 ? (stat.home / total) * 100 : 50
                        return (
                          <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                              <span style={{ color: 'var(--bkp-gold)', fontWeight: 'bold' }}>{stat.home}</span>
                              <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 600 }}>{stat.label}</span>
                              <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{stat.away}</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', display: 'flex', overflow: 'hidden' }}>
                              <div style={{ width: `${homePct}%`, background: 'var(--bkp-gold)', height: '100%' }} />
                              <div style={{ flex: 1, background: 'rgba(255,255,255,0.2)', height: '100%' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* AI Game Recap Summary */}
              {selectedGame.aiSummary && (
                <div className='ai-editorial-block'>
                  <h4>
                    <span>✨</span> Raport meczowy AI
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {parseMarkdown(selectedGame.aiSummary)}
                  </div>
                </div>
              )}

              {/* Coach Notes */}
              {selectedGame.coachNotes && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '1.25rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Notatki sztabu
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#b9bbbe', lineHeight: '1.5' }}>
                    {selectedGame.coachNotes}
                  </p>
                </div>
              )}

              {/* Player Box Score Stats */}
              {(() => {
                const teams = getTeamsFromGame(selectedGame)
                if (!teams || !teams.us || !Array.isArray(teams.us.players)) return null

                // Filter out empty player rows (usually totals or invalid scraps)
                const players = teams.us.players
                  .filter((p: { name?: string; min?: string }) => p.name && p.min)
                  .sort((a: { pts: number }, b: { pts: number }) => (b.pts || 0) - (a.pts || 0))

                if (players.length === 0) return null

                return (
                  <div style={{ marginTop: '10px' }}>
                    <h3 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Statystyki zawodników BeKaPaKa
                    </h3>
                    <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.01)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '400px' }}>
                        <thead>
                          <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)' }}>Zawodnik</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>MIN</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--bkp-gold)' }}>PTS</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>AST</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>STL</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>BLK</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>+/-</th>
                          </tr>
                        </thead>
                        <tbody>
                          {players.map((p: { name: string; number: string; min: string; pts: number; ast: number; stl?: number; blk?: number; plusMinus: number }, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                              <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                                {p.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: '4px' }}>#{p.number}</span>
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>{p.min}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-main)' }}>{p.pts}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>{p.ast}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>{p.stl ?? 0}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>{p.blk ?? 0}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: (p.plusMinus || 0) > 0 ? '#10b981' : (p.plusMinus || 0) < 0 ? '#ef4444' : 'inherit' }}>
                                {p.plusMinus > 0 ? `+${p.plusMinus}` : p.plusMinus}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })()}

              {/* Video URL Link */}
              {selectedGame.videoUrl && (
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <a
                    href={selectedGame.videoUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='button button--ghost'
                    style={{ width: '100%', display: 'inline-flex', justifyContent: 'center', gap: '8px' }}
                  >
                    📺 Oglądaj skrót meczu wideo
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
