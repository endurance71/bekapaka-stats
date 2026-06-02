'use client'

import React, { useState, useEffect } from 'react'
import type { RosterPlayer } from '../../lib/data'
import { resolvePlayerPhoto, getPositionLabel } from '../../lib/data/utils'

interface RosterListProps {
  roster: RosterPlayer[]
}

export function RosterList({ roster }: RosterListProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [animateBars, setAnimateBars] = useState(false)

  const handleOpenDrawer = (player: RosterPlayer) => {
    setSelectedPlayer(player)
    setIsOpen(true)
    // Small delay to trigger progress bar animation after drawer slides in
    setTimeout(() => {
      setAnimateBars(true)
    }, 300)
  }

  const handleCloseDrawer = () => {
    setIsOpen(false)
    setAnimateBars(false)
    // Clear selected player after slide animation finishes
    setTimeout(() => {
      setSelectedPlayer(null)
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

  return (
    <>
      <div className='card-grid'>
        {roster.map((player) => (
          <article
            key={player.id}
            className='player-card'
            onClick={() => handleOpenDrawer(player)}
            style={{ cursor: 'pointer', transition: 'transform 0.2s ease, border-color 0.2s ease' }}
          >
            <div className='player-card__image-wrap'>
              <img
                src={resolvePlayerPhoto(player)}
                alt={`${player.firstName} ${player.lastName}`}
                className='player-card__image'
              />
              <div className='player-card__overlay' />
              <div className='player-card__number'>{player.number}</div>
            </div>
            <div className='player-card__info'>
              <h2 className='player-card__name'>{player.firstName} {player.lastName}</h2>
              <p className='player-card__position'>{getPositionLabel(player.position)}</p>
              {player.ppg !== undefined && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>PPG: <strong style={{ color: 'var(--bkp-gold)' }}>{player.ppg.toFixed(1)}</strong></span>
                  <span>RPG: <strong style={{ color: 'var(--text-main)' }}>{player.rpg?.toFixed(1) || '0'}</strong></span>
                  <span>APG: <strong style={{ color: 'var(--text-main)' }}>{player.apg?.toFixed(1) || '0'}</strong></span>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Roster Stats Drawer */}
      <div className={`stats-drawer ${isOpen ? 'is-open' : ''}`}>
        <div className='stats-drawer__backdrop' onClick={handleCloseDrawer} />
        <div className='stats-drawer__panel'>
          <button className='stats-drawer__close' onClick={handleCloseDrawer} aria-label='Close drawer'>
            ✕
          </button>

          {selectedPlayer && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
              {/* Profile Header */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px' }}>
                <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--bkp-gold)', background: '#141822', flexShrink: 0 }}>
                  <img
                    src={resolvePlayerPhoto(selectedPlayer)}
                    alt={`${selectedPlayer.firstName} ${selectedPlayer.lastName}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '2rem', color: 'var(--bkp-gold)' }}>
                      #{selectedPlayer.number}
                    </span>
                    <h2 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '2.2rem', color: 'var(--text-main)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1 }}>
                      {selectedPlayer.firstName} <span style={{ color: 'var(--bkp-gold)' }}>{selectedPlayer.lastName}</span>
                    </h2>
                  </div>
                  <p style={{ margin: '4px 0 0 0', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {getPositionLabel(selectedPlayer.position)}
                  </p>
                  <div style={{ display: 'flex', gap: '15px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {selectedPlayer.heightCm && <span>Wzrost: <strong style={{ color: 'var(--text-main)' }}>{selectedPlayer.heightCm} cm</strong></span>}
                    {selectedPlayer.birthDate && <span>Urodzony: <strong style={{ color: 'var(--text-main)' }}>{selectedPlayer.birthDate}</strong></span>}
                  </div>
                </div>
              </div>

              {/* Core Stats Overview */}
              <div>
                <h3 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Średnie meczowe
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--bkp-gold)' }}>
                      {selectedPlayer.ppg?.toFixed(1) || '0.0'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginTop: '2px' }}>
                      PTS
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {selectedPlayer.rpg?.toFixed(1) || '0.0'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginTop: '2px' }}>
                      REB
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {selectedPlayer.apg?.toFixed(1) || '0.0'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginTop: '2px' }}>
                      AST
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: (selectedPlayer.plusMinus || 0) > 0 ? '#10b981' : (selectedPlayer.plusMinus || 0) < 0 ? '#ef4444' : 'var(--text-main)' }}>
                      {selectedPlayer.plusMinus !== undefined ? (selectedPlayer.plusMinus > 0 ? `+${selectedPlayer.plusMinus.toFixed(1)}` : selectedPlayer.plusMinus.toFixed(1)) : '0.0'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginTop: '2px' }}>
                      +/-
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', padding: '0 4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Rozegrane mecze: <strong style={{ color: 'var(--text-main)' }}>{selectedPlayer.gamesPlayed || 0}</strong></span>
                  {selectedPlayer.eval !== null && selectedPlayer.eval !== undefined && (
                    <span>Średni EVAL: <strong style={{ color: 'var(--bkp-gold)' }}>{selectedPlayer.eval.toFixed(1)}</strong></span>
                  )}
                </div>
              </div>

              {/* Shooting Percentages */}
              <div>
                <h3 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Skuteczność rzutowa
                </h3>
                
                {/* FG% */}
                <div className='stat-bar'>
                  <div className='stat-bar__label-group'>
                    <span className='stat-bar__label'>Rzuty z gry (FG%)</span>
                    <span className='stat-bar__val'>{selectedPlayer.fgPercentage?.toFixed(1) || '0.0'}%</span>
                  </div>
                  <div className='stat-bar__track'>
                    <div
                      className='stat-bar__fill'
                      style={{ width: animateBars ? `${selectedPlayer.fgPercentage || 0}%` : '0%' }}
                    />
                  </div>
                </div>

                {/* 3P% */}
                <div className='stat-bar'>
                  <div className='stat-bar__label-group'>
                    <span className='stat-bar__label'>Rzuty za 3 punkty (3P%)</span>
                    <span className='stat-bar__val'>{selectedPlayer.threePercentage?.toFixed(1) || '0.0'}%</span>
                  </div>
                  <div className='stat-bar__track'>
                    <div
                      className='stat-bar__fill'
                      style={{
                        width: animateBars ? `${selectedPlayer.threePercentage || 0}%` : '0%',
                        background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)' // blue for 3 pointers
                      }}
                    />
                  </div>
                </div>

                {/* FT% */}
                <div className='stat-bar'>
                  <div className='stat-bar__label-group'>
                    <span className='stat-bar__label'>Rzuty wolne (FT%)</span>
                    <span className='stat-bar__val'>{selectedPlayer.ftPercentage?.toFixed(1) || '0.0'}%</span>
                  </div>
                  <div className='stat-bar__track'>
                    <div
                      className='stat-bar__fill'
                      style={{
                        width: animateBars ? `${selectedPlayer.ftPercentage || 0}%` : '0%',
                        background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' // green for free throws
                      }}
                    />
                  </div>
                </div>

                {/* TS% & eFG% Advanced info */}
                <div style={{ display: 'flex', gap: '15px', marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div style={{ flex: 1 }}>
                    eFG% (skuteczność efektywna): <strong style={{ color: 'var(--text-main)' }}>{selectedPlayer.eFgPercentage?.toFixed(1) || '0.0'}%</strong>
                  </div>
                  <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '15px' }}>
                    TS% (skuteczność rzeczywista): <strong style={{ color: 'var(--text-main)' }}>{selectedPlayer.tsPercentage?.toFixed(1) || '0.0'}%</strong>
                  </div>
                </div>
              </div>

              {/* AI Development Summary */}
              {selectedPlayer.aiDevelopmentSummary && (
                <div className='ai-editorial-block'>
                  <h4>
                    <span>✨</span> Raport rozwoju AI
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {parseMarkdown(selectedPlayer.aiDevelopmentSummary)}
                  </div>
                </div>
              )}

              {/* Game Log Table */}
              {selectedPlayer.games && selectedPlayer.games.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <h3 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Historia występów
                  </h3>
                  <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.01)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '460px' }}>
                      <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)' }}>Przeciwnik</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>MIN</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--bkp-gold)' }}>PTS</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>REB</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>AST</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>STL</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>BLK</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>+/-</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--bkp-gold)' }}>EVAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPlayer.games.map((g, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                            <td style={{ padding: '8px 10px' }}>
                              <span style={{ fontWeight: 600, display: 'block' }}>{g.opponent}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{g.date.split('T')[0]}</span>
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>{g.min || '—'}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-main)' }}>{g.pts}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>{g.reb}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>{g.ast}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>{g.stl ?? '—'}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>{g.blk ?? '—'}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: (g.plusMinus || 0) > 0 ? '#10b981' : (g.plusMinus || 0) < 0 ? '#ef4444' : 'inherit' }}>
                              {g.plusMinus !== undefined ? (g.plusMinus > 0 ? `+${g.plusMinus}` : g.plusMinus) : '—'}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--bkp-gold)' }}>{g.eval ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
