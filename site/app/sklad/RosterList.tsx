'use client'

import React, { useState } from 'react'
import type { RosterPlayer } from '../../lib/data'
import { formatStat } from '../../lib/format'
import { resolvePlayerPhoto, getPositionLabel } from '../../lib/data/utils'
import { SlideoutPanel } from '../../components/public/shared/SlideoutPanel'
import { MarkdownContent } from '../../components/public/shared/MarkdownContent'

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
    setTimeout(() => {
      setAnimateBars(true)
    }, 150)
  }

  const handleCloseDrawer = () => {
    setIsOpen(false)
    setAnimateBars(false)
    setTimeout(() => {
      setSelectedPlayer(null)
    }, 300)
  }

  return (
    <>
      <div className='roster-grid'>
        {roster.map((player) => (
          <button
            key={player.id}
            className='player-card player-card--button'
            onClick={() => handleOpenDrawer(player)}
            type='button'
            aria-label={`Pokaż statystyki zawodnika ${player.firstName} ${player.lastName}`}
          >
            <div className='player-card__image-wrap'>
              {resolvePlayerPhoto(player).includes('default.png') ? (
                <div className='player-card__jersey-fallback'>
                  <div className='jersey-back'>
                    <span className='jersey-name'>{player.lastName}</span>
                    <span className='jersey-num'>{player.number}</span>
                    <span className='jersey-logo'>BEKAPAKA</span>
                  </div>
                </div>
              ) : (
                <>
                  <img
                    src={resolvePlayerPhoto(player)}
                    alt={`${player.firstName} ${player.lastName}`}
                    className='player-card__image'
                  />
                  <div className='player-card__overlay' />
                </>
              )}
              <div className='player-card__number'>#{player.number}</div>
            </div>
            <div className='player-card__info'>
              <h2 className='player-card__name'>
                {player.firstName} <span className='highlight-gold'>{player.lastName}</span>
              </h2>
              <p className='player-card__position'>{getPositionLabel(player.position)}</p>
              
              {player.ppg !== undefined || player.rpg !== undefined || player.apg !== undefined ? (
                <div className='player-card__quick-stats'>
                  <div className='quick-stat-item'>
                    <span className='qs-label'>PTS</span>
                    <span className='qs-val'>{formatStat(player.ppg)}</span>
                  </div>
                  <div className='quick-stat-item'>
                    <span className='qs-label'>REB</span>
                    <span className='qs-val'>{formatStat(player.rpg)}</span>
                  </div>
                  <div className='quick-stat-item'>
                    <span className='qs-label'>AST</span>
                    <span className='qs-val'>{formatStat(player.apg)}</span>
                  </div>
                </div>
              ) : null}
              
              <div className='player-card__action-hint'>Szczegóły zawodnika ➔</div>
            </div>
          </button>
        ))}
      </div>

      <SlideoutPanel isOpen={isOpen} onClose={handleCloseDrawer} title='Karta zawodnika'>
        {selectedPlayer && (
          <div className='drawer-profile-panel'>
            {/* Profile Header */}
            <div className='profile-header'>
              <div className='profile-avatar-wrap'>
                {resolvePlayerPhoto(selectedPlayer).includes('default.png') ? (
                  <div className='profile-avatar-fallback'>
                    #{selectedPlayer.number}
                  </div>
                ) : (
                  <img
                    src={resolvePlayerPhoto(selectedPlayer)}
                    alt={`${selectedPlayer.firstName} ${selectedPlayer.lastName}`}
                    className='profile-avatar-img'
                  />
                )}
              </div>
              <div className='profile-meta-info'>
                <div className='profile-name-row'>
                  <span className='profile-jersey-number'>#{selectedPlayer.number}</span>
                  <h2 className='profile-full-name'>
                    {selectedPlayer.firstName} <span className='highlight-gold'>{selectedPlayer.lastName}</span>
                  </h2>
                </div>
                <p className='profile-position-label'>
                  {getPositionLabel(selectedPlayer.position)}
                </p>
                <div className='profile-physicals'>
                  {selectedPlayer.heightCm && (
                    <span className='physical-stat'>
                      Wzrost: <strong>{selectedPlayer.heightCm} cm</strong>
                    </span>
                  )}
                  {selectedPlayer.birthDate && (
                    <span className='physical-stat'>
                      Urodzony: <strong>{selectedPlayer.birthDate}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Core Stats Overview */}
            <div className='drawer-section-v2'>
              <h3 className='drawer-section-title'>Średnie statystyki sezonu</h3>
              <div className='stats-dashboard-grid'>
                <div className='dashboard-stat-box highlight-box-gold'>
                  <span className='db-stat-val'>{formatStat(selectedPlayer.ppg)}</span>
                  <span className='db-stat-label'>PUNKTY (PTS)</span>
                </div>
                <div className='dashboard-stat-box'>
                  <span className='db-stat-val'>{formatStat(selectedPlayer.rpg)}</span>
                  <span className='db-stat-label'>ZBIÓRKI (REB)</span>
                </div>
                <div className='dashboard-stat-box'>
                  <span className='db-stat-val'>{formatStat(selectedPlayer.apg)}</span>
                  <span className='db-stat-label'>ASYSTY (AST)</span>
                </div>
                <div className='dashboard-stat-box'>
                  <span className={`db-stat-val ${(selectedPlayer.plusMinus || 0) > 0 ? 'color-win' : (selectedPlayer.plusMinus || 0) < 0 ? 'color-loss' : ''}`}>
                    {selectedPlayer.plusMinus !== undefined 
                      ? (selectedPlayer.plusMinus > 0 ? `+${selectedPlayer.plusMinus.toFixed(1)}` : selectedPlayer.plusMinus.toFixed(1)) 
                      : '0.0'}
                  </span>
                  <span className='db-stat-label'>PLUS / MINUS</span>
                </div>
              </div>
              
              <div className='stats-dashboard-summary-row'>
                <span>Rozegrane mecze: <strong>{selectedPlayer.gamesPlayed || 0}</strong></span>
                {selectedPlayer.eval !== null && selectedPlayer.eval !== undefined && (
                  <span>Średni wskaźnik EVAL: <strong className='highlight-gold'>{selectedPlayer.eval.toFixed(1)}</strong></span>
                )}
              </div>
            </div>

            {/* Shooting Percentages */}
            <div className='drawer-section-v2'>
              <h3 className='drawer-section-title'>Skuteczność rzutowa</h3>
              
              <div className='stat-bar-premium'>
                <div className='sb-label-group'>
                  <span className='sb-label-text'>Rzuty z gry (FG%)</span>
                  <span className='sb-value-text'>{formatStat(selectedPlayer.fgPercentage)}%</span>
                </div>
                <div className='sb-track-premium'>
                  <div
                    className='sb-fill-premium sb-fill-gold'
                    style={{ width: animateBars ? `${selectedPlayer.fgPercentage || 0}%` : '0%' }}
                  />
                </div>
              </div>

              <div className='stat-bar-premium'>
                <div className='sb-label-group'>
                  <span className='sb-label-text'>Rzuty za 3 (3P%)</span>
                  <span className='sb-value-text'>{formatStat(selectedPlayer.threePercentage)}%</span>
                </div>
                <div className='sb-track-premium'>
                  <div
                    className='sb-fill-premium sb-fill-blue'
                    style={{ width: animateBars ? `${selectedPlayer.threePercentage || 0}%` : '0%' }}
                  />
                </div>
              </div>

              <div className='stat-bar-premium'>
                <div className='sb-label-group'>
                  <span className='sb-label-text'>Rzuty wolne (FT%)</span>
                  <span className='sb-value-text'>{formatStat(selectedPlayer.ftPercentage)}%</span>
                </div>
                <div className='sb-track-premium'>
                  <div
                    className='sb-fill-premium sb-fill-green'
                    style={{ width: animateBars ? `${selectedPlayer.ftPercentage || 0}%` : '0%' }}
                  />
                </div>
              </div>

              <div className='advanced-shooting-notes'>
                <div className='asn-item'>
                  Efektywna skuteczność (eFG%): <strong>{formatStat(selectedPlayer.eFgPercentage)}%</strong>
                </div>
                <div className='asn-divider'></div>
                <div className='asn-item'>
                  Rzeczywista skuteczność (TS%): <strong>{formatStat(selectedPlayer.tsPercentage)}%</strong>
                </div>
              </div>
            </div>

            {/* AI Development Summary */}
            {selectedPlayer.aiDevelopmentSummary && (
              <div className='ai-development-card-premium'>
                <div className='ai-card-title'>
                  <span className='ai-spark-icon'>✨</span>
                  <h4>Raport Rozwoju AI (Gemini Spec)</h4>
                </div>
                <div className='ai-card-body'>
                  <MarkdownContent markdown={selectedPlayer.aiDevelopmentSummary} />
                </div>
              </div>
            )}

            {/* Game Log Table */}
            {selectedPlayer.games && selectedPlayer.games.length > 0 && (
              <div className='drawer-section-v2' style={{ marginTop: '8px' }}>
                <h3 className='drawer-section-title'>Historia występów</h3>
                <div className='table-shell-v2'>
                  <table className='data-table-v2 text-sm'>
                    <thead>
                      <tr>
                        <th>Przeciwnik</th>
                        <th className='text-center'>MIN</th>
                        <th className='text-center highlight-gold'>PTS</th>
                        <th className='text-center'>REB</th>
                        <th className='text-center'>AST</th>
                        <th className='text-center'>STL</th>
                        <th className='text-center'>BLK</th>
                        <th className='text-center'>+/-</th>
                        <th className='text-center highlight-gold'>EVAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPlayer.games.map((g, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{g.opponent}</strong>
                            <span className='block text-xs muted'>{g.date.split('T')[0]}</span>
                          </td>
                          <td className='text-center font-mono'>{g.min || '—'}</td>
                          <td className='text-center font-bold font-mono'>{g.pts}</td>
                          <td className='text-center font-mono'>{g.reb}</td>
                          <td className='text-center font-mono'>{g.ast}</td>
                          <td className='text-center font-mono'>{g.stl ?? '—'}</td>
                          <td className='text-center font-mono'>{g.blk ?? '—'}</td>
                          <td className={`text-center font-bold font-mono ${(g.plusMinus || 0) > 0 ? 'color-win' : (g.plusMinus || 0) < 0 ? 'color-loss' : ''}`}>
                            {g.plusMinus !== undefined ? (g.plusMinus > 0 ? `+${g.plusMinus}` : g.plusMinus) : '—'}
                          </td>
                          <td className='text-center font-bold font-mono highlight-gold'>{g.eval ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </SlideoutPanel>
    </>
  )
}
