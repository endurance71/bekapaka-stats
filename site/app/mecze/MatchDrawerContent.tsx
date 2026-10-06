'use client'

import { useState } from 'react'
import type { GameSummary } from '../../lib/data'
import { VideoIcon } from '../../components/public/shared/PublicIcons'
import { MatchPlayByPlay } from './MatchPlayByPlay'

interface PlayerStats {
  name: string
  number?: number | string
  starter?: boolean
  min?: string
  pts: number
  two_pm?: number
  two_pa?: number
  three_pm?: number
  three_pa?: number
  fgm?: number
  fga?: number
  ftm?: number
  fta?: number
  orb?: number
  drb?: number
  reb?: number
  ast?: number
  stl?: number
  tov?: number
  pf?: number
  pfDrawn?: number
  blk?: number
  eval?: number
  plusMinus?: number
}

interface TeamData {
  name: string
  isBekapaka?: boolean
  pts?: number
  players?: PlayerStats[]
  two_pm?: number
  two_pa?: number
  three_pm?: number
  three_pa?: number
  fgm?: number
  fga?: number
  ftm?: number
  fta?: number
  orb?: number
  drb?: number
  reb?: number
  ast?: number
  stl?: number
  tov?: number
  pf?: number
  blk?: number
  fourFactors?: {
    efg?: number
    ts?: number
    pace?: number
    offRtg?: number
    defRtg?: number
    netRtg?: number
  }
}

function getTeamsFromGame(game: GameSummary): { us?: TeamData; them?: TeamData; all: TeamData[] } {
  const rawTeams: TeamData[] = game.teams || game.data?.teams || []
  if (!Array.isArray(rawTeams) || rawTeams.length === 0) {
    return { all: [] }
  }
  const us = rawTeams.find(
    (t) =>
      t.isBekapaka ||
      t.name?.toLowerCase().includes('bekapaka') ||
      t.name?.toLowerCase().includes('bobolice')
  )
  const them = rawTeams.find((t) => t !== us)
  return { us, them, all: rawTeams }
}

function formatShot(made?: number, att?: number): string {
  if (made == null && att == null) return '—'
  return `${made ?? 0}/${att ?? 0}`
}

function formatPct(made?: number, att?: number): string {
  if (!att || att <= 0) return '—'
  return `${Math.round(((made ?? 0) / att) * 1000) / 10}%`
}

interface MatchDrawerContentProps {
  game: GameSummary
  loading?: boolean
  hideScoreHeader?: boolean
}

export function MatchDrawerContent({
  game,
  loading = false,
  hideScoreHeader = false
}: MatchDrawerContentProps) {
  const hasScore = game.scoreUs != null && game.scoreThem != null
  const isWin = hasScore && game.scoreUs! > game.scoreThem!
  const final = game.status === 'FINAL' || (!game.status && !!game.result)
  const { us, them, all } = getTeamsFromGame(game)

  const [activeTeamIndex, setActiveTeamIndex] = useState<number>(0)
  const [activeMainTab, setActiveMainTab] = useState<'boxscore' | 'pbp'>('boxscore')
  const activeTeam = all[activeTeamIndex] || us || all[0]
  const hasAnyPlayers = all.some((t) => Array.isArray(t.players) && t.players.length > 0)

  const quarters = Array.isArray(game.data?.quarters) ? game.data.quarters : null
  const rawTeamStats = game.data?.teamStats

  const statKeys = [
    { key: 'Punkty spod kosza', label: 'Punkty z pomalowanego' },
    { key: 'Punkty po szybkim ataku', label: 'Punkty z szybkiego ataku' },
    { key: 'Punkty po stratach', label: 'Punkty po stratach rywala' },
    { key: 'Punkty drugiej szansy', label: 'Punkty 2. szansy' },
    { key: 'Punkty zmiennikow', label: 'Punkty rezerwowych' },
    { key: 'Punkty zmienników', label: 'Punkty rezerwowych' }
  ]

  const availableStats =
    rawTeamStats && typeof rawTeamStats === 'object'
      ? statKeys
          .map((sk) => {
            const val = rawTeamStats[sk.key as keyof typeof rawTeamStats] as
              | { home?: number; away?: number }
              | undefined
            if (!val) return null
            return { label: sk.label, home: val.home || 0, away: val.away || 0 }
          })
          .filter(Boolean) as { label: string; home: number; away: number }[]
      : []

  const players: PlayerStats[] = Array.isArray(activeTeam?.players)
    ? [...activeTeam.players].sort((a, b) => (b.pts || 0) - (a.pts || 0))
    : []

  // Sums / Totals calculation for the active team
  const totalMin = '200:00'
  const totalPts = activeTeam?.pts ?? players.reduce((s, p) => s + (p.pts || 0), 0)
  const totalTwoPm = activeTeam?.two_pm ?? players.reduce((s, p) => s + (p.two_pm || 0), 0)
  const totalTwoPa = activeTeam?.two_pa ?? players.reduce((s, p) => s + (p.two_pa || 0), 0)
  const totalThreePm = activeTeam?.three_pm ?? players.reduce((s, p) => s + (p.three_pm || 0), 0)
  const totalThreePa = activeTeam?.three_pa ?? players.reduce((s, p) => s + (p.three_pa || 0), 0)
  const totalFgm = activeTeam?.fgm ?? players.reduce((s, p) => s + (p.fgm || (p.two_pm || 0) + (p.three_pm || 0)), 0)
  const totalFga = activeTeam?.fga ?? players.reduce((s, p) => s + (p.fga || (p.two_pa || 0) + (p.three_pa || 0)), 0)
  const totalFtm = activeTeam?.ftm ?? players.reduce((s, p) => s + (p.ftm || 0), 0)
  const totalFta = activeTeam?.fta ?? players.reduce((s, p) => s + (p.fta || 0), 0)
  const totalOrb = activeTeam?.orb ?? players.reduce((s, p) => s + (p.orb || 0), 0)
  const totalDrb = activeTeam?.drb ?? players.reduce((s, p) => s + (p.drb || 0), 0)
  const totalReb = activeTeam?.reb ?? players.reduce((s, p) => s + (p.reb || 0), 0)
  const totalAst = activeTeam?.ast ?? players.reduce((s, p) => s + (p.ast || 0), 0)
  const totalStl = activeTeam?.stl ?? players.reduce((s, p) => s + (p.stl || 0), 0)
  const totalTov = activeTeam?.tov ?? players.reduce((s, p) => s + (p.tov || 0), 0)
  const totalPf = activeTeam?.pf ?? players.reduce((s, p) => s + (p.pf || 0), 0)
  const totalPfDrawn = players.reduce((s, p) => s + (p.pfDrawn || 0), 0)
  const totalBlk = activeTeam?.blk ?? players.reduce((s, p) => s + (p.blk || 0), 0)
  const totalEval = players.reduce((s, p) => s + (p.eval || 0), 0)

  return (
    <div className='drawer-stack-v2'>
      {!hideScoreHeader && hasScore && (
        <div className='drawer-match-header'>
          <div className='drawer-match-scoreboard'>
            <div className='scoreboard-team'>
              <span className='scoreboard-team-name'>BeKaPaKa</span>
            </div>
            <div className='scoreboard-score-numbers' aria-label={`Wynik ${game.scoreUs} do ${game.scoreThem}`}>
              <span className={isWin ? 'color-win' : 'color-loss'}>{game.scoreUs}</span>
              <span className='score-sep'>:</span>
              <span>{game.scoreThem}</span>
            </div>
            <div className='scoreboard-team text-right'>
              <span className='scoreboard-team-name'>{game.opponent}</span>
            </div>
          </div>

          {final && (
            <div className='drawer-match-badge-wrap'>
              <span className={`pill ${isWin ? 'pill--win' : 'pill--loss'}`}>
                {isWin ? 'Zwycięstwo BeKaPaKa' : 'Porażka'}
              </span>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className='drawer-match-loading muted' role='status'>
          Ładowanie statystyk meczu…
        </p>
      ) : null}

      {/* Quarters Breakdown */}
      {quarters && quarters.length > 0 ? (
        <section className='drawer-match-section'>
          <h3 className='drawer-section-title-small'>Wyniki w kwartach</h3>
          <div className='quarters-grid-premium'>
            {quarters.map((q: { label: string; home: number; away: number }, idx: number) => (
              <div key={idx} className='quarter-cell-premium'>
                <div className='q-label'>{q.label || `Q${idx + 1}`}</div>
                <div className='q-scores'>
                  <span className='q-score-home'>{q.home}</span>
                  <span className='q-score-sep'>-</span>
                  <span className='q-score-away'>{q.away}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Advanced Team Comparison Stats */}
      {all.length === 2 && (
        <section className='drawer-match-section'>
          <h3 className='drawer-section-title-small'>Porównanie zespołowe</h3>
          <div className='team-comparison-list'>
            {[
              {
                label: 'Punkty z gry (FG)',
                home: formatShot(all[0].fgm, all[0].fga),
                away: formatShot(all[1].fgm, all[1].fga),
                valHome: all[0].fgm || 0,
                valAway: all[1].fgm || 0
              },
              {
                label: 'Skuteczność z gry (FG%)',
                home: formatPct(all[0].fgm, all[0].fga),
                away: formatPct(all[1].fgm, all[1].fga),
                valHome: all[0].fga ? (all[0].fgm || 0) / all[0].fga : 0,
                valAway: all[1].fga ? (all[1].fgm || 0) / all[1].fga : 0
              },
              {
                label: 'Rzuty za 3 pkt (3P)',
                home: formatShot(all[0].three_pm, all[0].three_pa),
                away: formatShot(all[1].three_pm, all[1].three_pa),
                valHome: all[0].three_pm || 0,
                valAway: all[1].three_pm || 0
              },
              {
                label: 'Rzuty wolne (FT)',
                home: formatShot(all[0].ftm, all[0].fta),
                away: formatShot(all[1].ftm, all[1].fta),
                valHome: all[0].ftm || 0,
                valAway: all[1].ftm || 0
              },
              {
                label: 'Zbiórki łącznie (REB)',
                home: String(all[0].reb || 0),
                away: String(all[1].reb || 0),
                valHome: all[0].reb || 0,
                valAway: all[1].reb || 0
              },
              {
                label: 'Zbiórki w ataku (ORB)',
                home: String(all[0].orb || 0),
                away: String(all[1].orb || 0),
                valHome: all[0].orb || 0,
                valAway: all[1].orb || 0
              },
              {
                label: 'Asysty (AST)',
                home: String(all[0].ast || 0),
                away: String(all[1].ast || 0),
                valHome: all[0].ast || 0,
                valAway: all[1].ast || 0
              },
              {
                label: 'Przechwyty (STL)',
                home: String(all[0].stl || 0),
                away: String(all[1].stl || 0),
                valHome: all[0].stl || 0,
                valAway: all[1].stl || 0
              },
              {
                label: 'Straty (TOV)',
                home: String(all[0].tov || 0),
                away: String(all[1].tov || 0),
                valHome: all[0].tov || 0,
                valAway: all[1].tov || 0
              },
              {
                label: 'Bloki (BLK)',
                home: String(all[0].blk || 0),
                away: String(all[1].blk || 0),
                valHome: all[0].blk || 0,
                valAway: all[1].blk || 0
              }
            ].map((stat, idx) => {
              const total = stat.valHome + stat.valAway
              const homePct = total > 0 ? (stat.valHome / total) * 100 : 50
              return (
                <div key={idx} className='stat-compare-item'>
                  <div className='sci-labels'>
                    <span className='sci-val-home highlight-gold font-mono'>{stat.home}</span>
                    <span className='sci-name'>{stat.label}</span>
                    <span className='sci-val-away font-mono'>{stat.away}</span>
                  </div>
                  <div className='sci-bar-track' aria-hidden="true">
                    <div className='sci-bar-fill-home' style={{ width: `${homePct}%` }} />
                    <div className='sci-bar-fill-away' style={{ width: `${100 - homePct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Additional team comparison stats if present */}
      {availableStats.length > 0 ? (
        <section className='drawer-match-section'>
          <h3 className='drawer-section-title-small'>Punkty specjalne</h3>
          <div className='team-comparison-list'>
            {availableStats.map((stat, idx) => {
              const total = stat.home + stat.away
              const homePct = total > 0 ? (stat.home / total) * 100 : 50
              return (
                <div key={idx} className='stat-compare-item'>
                  <div className='sci-labels'>
                    <span className='sci-val-home highlight-gold'>{stat.home}</span>
                    <span className='sci-name'>{stat.label}</span>
                    <span className='sci-val-away'>{stat.away}</span>
                  </div>
                  <div className='sci-bar-track'>
                    <div className='sci-bar-fill-home' style={{ width: `${homePct}%` }} />
                    <div className='sci-bar-fill-away' style={{ width: `${100 - homePct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {/* Coach Notes */}
      {game.coachNotes ? (
        <section className='drawer-match-section coach-notes-block'>
          <h3 className='drawer-section-title-small'>Notatki sztabu trenerskiego</h3>
          <p className='coach-notes-text'>{game.coachNotes}</p>
        </section>
      ) : null}

      {/* Main Tabs: Statystyki (Box Score) vs Akcja po akcji (Play-by-Play) */}
      {final && hasScore && (
        <div className='match-main-tabs-wrap' role='tablist' aria-label='Widok meczu'>
          <button
            type='button'
            role='tab'
            aria-selected={activeMainTab === 'boxscore'}
            className={`match-main-tab ${activeMainTab === 'boxscore' ? 'match-main-tab--active' : ''}`}
            onClick={() => setActiveMainTab('boxscore')}
          >
            Statystyki meczowe (Box Score)
          </button>
          <button
            type='button'
            role='tab'
            aria-selected={activeMainTab === 'pbp'}
            className={`match-main-tab ${activeMainTab === 'pbp' ? 'match-main-tab--active' : ''}`}
            onClick={() => setActiveMainTab('pbp')}
          >
            Akcja po akcji (Play-by-Play)
          </button>
        </div>
      )}

      {/* Play-by-Play View */}
      {activeMainTab === 'pbp' ? (
        <section className='drawer-match-section'>
          <h3 className='drawer-section-title-small'>Przebieg meczu akcja po akcji</h3>
          <p className='profile__table-hint'>Szczegółowy zapis każdego posiadania piłki, celnych rzutów i zmian prosto z oficjalnego protokołu KALK.</p>
          <MatchPlayByPlay
            gameId={game.id}
            homeTeamName={all[0]?.name || 'BeKaPaKa Bobolice'}
            awayTeamName={all[1]?.name || game.opponent || 'Rywal'}
          />
        </section>
      ) : (
        /* Full Box Score with Team Switching Tabs */
        hasAnyPlayers ? (
          <section className='drawer-match-section'>
            <div className='boxscore-header-row'>
              <h3 className='drawer-section-title-small'>Statystyki indywidualne (Box Score)</h3>
              {all.length > 1 && (
                <div className='boxscore-team-tabs' role='tablist' aria-label='Wybór drużyny w statystykach'>
                  {all.map((team, idx) => (
                    <button
                      key={idx}
                      type='button'
                      role='tab'
                      aria-selected={activeTeamIndex === idx}
                      className={`boxscore-team-tab ${activeTeamIndex === idx ? 'boxscore-team-tab--active' : ''}`}
                      onClick={() => setActiveTeamIndex(idx)}
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className='profile__table-hint'>Przewiń tabelę w bok, aby zobaczyć pełne statystyki rzutowe i obronne (zgodne z protokołem KALK).</p>

            <div className='table-shell-v2 boxscore-scroll-shell' tabIndex={0} role='region' aria-label={`Statystyki ${activeTeam?.name}, przewijaj poziomo`}>
              <table className='data-table-v2 boxscore-table text-sm'>
                <caption className='visually-hidden'>Pełne statystyki zawodników {activeTeam?.name}</caption>
                <thead>
                  <tr>
                    <th scope='col' className='boxscore-col-player'>Zawodnik</th>
                    <th scope='col' className='text-center'>MIN</th>
                    <th scope='col' className='text-center font-bold'><span className='highlight-gold'>PKT</span></th>
                    <th scope='col' className='text-center'>Za 2</th>
                    <th scope='col' className='text-center'>% 2P</th>
                    <th scope='col' className='text-center'>Za 3</th>
                    <th scope='col' className='text-center'>% 3P</th>
                    <th scope='col' className='text-center'>Z gry</th>
                    <th scope='col' className='text-center'>% FG</th>
                    <th scope='col' className='text-center'>Wolne</th>
                    <th scope='col' className='text-center'>% FT</th>
                    <th scope='col' className='text-center' title='Zbiórki w ataku'>A</th>
                    <th scope='col' className='text-center' title='Zbiórki w obronie'>O</th>
                    <th scope='col' className='text-center font-bold' title='Zbiórki suma'>ZB</th>
                    <th scope='col' className='text-center'>AS</th>
                    <th scope='col' className='text-center'>PRZ</th>
                    <th scope='col' className='text-center'>STR</th>
                    <th scope='col' className='text-center' title='Faule popełnione'>F</th>
                    <th scope='col' className='text-center' title='Faule wymuszone'>Fw</th>
                    <th scope='col' className='text-center'>BL</th>
                    <th scope='col' className='text-center font-bold highlight-gold'>EVAL</th>
                    <th scope='col' className='text-center'>+/-</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, idx) => {
                    const fgm = p.fgm ?? (p.two_pm || 0) + (p.three_pm || 0)
                    const fga = p.fga ?? (p.two_pa || 0) + (p.three_pa || 0)
                    return (
                      <tr key={idx}>
                        <td className='boxscore-col-player'>
                          <div className='boxscore-player-cell'>
                            <span className='boxscore-player-name'>{p.name}</span>
                            {p.starter && <span className='boxscore-starter-star' title='Pierwsza piątka'>*</span>}
                            {p.number != null && (
                              <span className='boxscore-player-number muted text-xs'>#{p.number}</span>
                            )}
                          </div>
                        </td>
                        <td className='text-center font-mono'>{p.min || '—'}</td>
                        <td className='text-center font-bold font-mono'><span className='highlight-gold'>{p.pts}</span></td>
                        <td className='text-center font-mono'>{formatShot(p.two_pm, p.two_pa)}</td>
                        <td className='text-center font-mono text-xs muted'>{formatPct(p.two_pm, p.two_pa)}</td>
                        <td className='text-center font-mono'>{formatShot(p.three_pm, p.three_pa)}</td>
                        <td className='text-center font-mono text-xs muted'>{formatPct(p.three_pm, p.three_pa)}</td>
                        <td className='text-center font-mono'>{formatShot(fgm, fga)}</td>
                        <td className='text-center font-mono text-xs muted'>{formatPct(fgm, fga)}</td>
                        <td className='text-center font-mono'>{formatShot(p.ftm, p.fta)}</td>
                        <td className='text-center font-mono text-xs muted'>{formatPct(p.ftm, p.fta)}</td>
                        <td className='text-center font-mono'>{p.orb ?? 0}</td>
                        <td className='text-center font-mono'>{p.drb ?? 0}</td>
                        <td className='text-center font-bold font-mono'>{p.reb ?? ((p.orb || 0) + (p.drb || 0))}</td>
                        <td className='text-center font-mono'>{p.ast || 0}</td>
                        <td className='text-center font-mono'>{p.stl || 0}</td>
                        <td className='text-center font-mono'>{p.tov || 0}</td>
                        <td className='text-center font-mono'>{p.pf || 0}</td>
                        <td className='text-center font-mono'>{p.pfDrawn || 0}</td>
                        <td className='text-center font-mono'>{p.blk || 0}</td>
                        <td className='text-center font-bold font-mono highlight-gold'>{p.eval ?? '—'}</td>
                        <td className={`text-center font-bold font-mono ${p.plusMinus != null && p.plusMinus > 0 ? 'color-win' : p.plusMinus != null && p.plusMinus < 0 ? 'color-loss' : ''}`}>
                          {p.plusMinus != null ? (p.plusMinus > 0 ? `+${p.plusMinus}` : p.plusMinus) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className='boxscore-total-row'>
                    <th scope='row' className='boxscore-col-player font-bold'>SUMA / ZESPÓŁ</th>
                    <td className='text-center font-mono font-bold'>{totalMin}</td>
                    <td className='text-center font-bold font-mono highlight-gold'>{totalPts}</td>
                    <td className='text-center font-mono font-bold'>{formatShot(totalTwoPm, totalTwoPa)}</td>
                    <td className='text-center font-mono font-bold text-xs'>{formatPct(totalTwoPm, totalTwoPa)}</td>
                    <td className='text-center font-mono font-bold'>{formatShot(totalThreePm, totalThreePa)}</td>
                    <td className='text-center font-mono font-bold text-xs'>{formatPct(totalThreePm, totalThreePa)}</td>
                    <td className='text-center font-mono font-bold'>{formatShot(totalFgm, totalFga)}</td>
                    <td className='text-center font-mono font-bold text-xs'>{formatPct(totalFgm, totalFga)}</td>
                    <td className='text-center font-mono font-bold'>{formatShot(totalFtm, totalFta)}</td>
                    <td className='text-center font-mono font-bold text-xs'>{formatPct(totalFtm, totalFta)}</td>
                    <td className='text-center font-mono font-bold'>{totalOrb}</td>
                    <td className='text-center font-mono font-bold'>{totalDrb}</td>
                    <td className='text-center font-mono font-bold'>{totalReb}</td>
                    <td className='text-center font-mono font-bold'>{totalAst}</td>
                    <td className='text-center font-mono font-bold'>{totalStl}</td>
                    <td className='text-center font-mono font-bold'>{totalTov}</td>
                    <td className='text-center font-mono font-bold'>{totalPf}</td>
                    <td className='text-center font-mono font-bold'>{totalPfDrawn}</td>
                    <td className='text-center font-mono font-bold'>{totalBlk}</td>
                    <td className='text-center font-bold font-mono highlight-gold'>{totalEval}</td>
                    <td className='text-center font-mono'>—</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className='boxscore-legend text-xs muted'>
              <span><strong>Legenda:</strong> * – pierwsza piątka</span>
              <span>Za 2, Za 3, Z gry, Wolne – celne/oddane (C/O) oraz skuteczność procentowa (%)</span>
              <span>A – zbiórki w ataku, O – w obronie, ZB – suma zbiórek</span>
              <span>AS – asysty, PRZ – przechwyty, STR – straty, F/Fw – faule popełnione/wymuszone, BL – bloki</span>
              <span>EVAL – eval ogólny, +/- – wskaźnik plus/minus podczas pobytu na parkiecie</span>
            </div>
          </section>
        ) : null
      )}

      {!loading && !hasAnyPlayers && (
        <p className='drawer-match-loading muted'>
          {game.status === 'SCHEDULED'
            ? 'Szczegóły i statystyki meczowe będą dostępne po rozegraniu spotkania.'
            : game.status === 'FINAL'
              ? 'Szczegółowe statystyki zawodników nie zostały jeszcze opublikowane przez ligę.'
              : 'Brak dodatkowych statystyk dla tego spotkania.'}
        </p>
      )}

      {/* Highlight Video Action Button */}
      {game.videoUrl ? (
        <a
          href={game.videoUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='btn btn--primary stub-button button-with-icon'
          style={{ width: '100%', marginTop: '8px' }}
        >
          <VideoIcon size={18} />
          Oglądaj skrót wideo z meczu
        </a>
      ) : null}
    </div>
  )
}
