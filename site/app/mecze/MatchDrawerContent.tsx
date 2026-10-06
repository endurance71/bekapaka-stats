'use client'

import { useState } from 'react'
import { resolvePresentation } from '../../../packages/match-presentation'
import { addStats, completeSum, displayStat, knownStat, shotLabel as formatShot, percentageLabel as formatPct, totalMinutes } from '../../lib/basketball-stats'
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
  const status = resolvePresentation(game).status
  const statsAllowed = ['LIVE', 'BREAK', 'FINAL'].includes(status)
  const [fullStats, setFullStats] = useState(false)
  const hasScore = game.scoreUs != null && game.scoreThem != null
  const isWin = hasScore && game.scoreUs! > game.scoreThem!
  const final = status === 'FINAL'
  const { us, all } = getTeamsFromGame(game)

  const [activeTeamIndex, setActiveTeamIndex] = useState<number>(0)
  const SectionHeading = hideScoreHeader ? 'h2' : 'h3'
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
            if (!val || !knownStat(val.home) || !knownStat(val.away)) return null
            return { label: sk.label, home: val.home, away: val.away }
          })
          .filter(Boolean) as { label: string; home: number; away: number }[]
      : []

  const comparisonStats = all.length === 2 ? [
              ...[['Zbiórki łącznie (REB)', 'reb'], ['Zbiórki w ataku (ORB)', 'orb'], ['Asysty (AST)', 'ast'], ['Przechwyty (STL)', 'stl'], ['Straty (TOV)', 'tov'], ['Bloki (BLK)', 'blk']].map(([label, key]) => {
                const home = all[0][key as keyof TeamData]
                const away = all[1][key as keyof TeamData]
                return { label, home: displayStat(typeof home === 'number' ? home : undefined), away: displayStat(typeof away === 'number' ? away : undefined), valHome: typeof home === 'number' ? home : undefined, valAway: typeof away === 'number' ? away : undefined }
              }),
              ...[['Punkty z gry (FG)', 'fgm', 'fga'], ['Rzuty za 3 pkt (3P)', 'three_pm', 'three_pa'], ['Rzuty wolne (FT)', 'ftm', 'fta']].map(([label, made, attempted]) => {
                const a = all[0][made as keyof TeamData], b = all[1][made as keyof TeamData]
                const aa = all[0][attempted as keyof TeamData], ba = all[1][attempted as keyof TeamData]
                return { label, home: formatShot(typeof a === 'number' ? a : undefined, typeof aa === 'number' ? aa : undefined), away: formatShot(typeof b === 'number' ? b : undefined, typeof ba === 'number' ? ba : undefined), valHome: typeof a === 'number' && typeof aa === 'number' ? a : undefined, valAway: typeof b === 'number' && typeof ba === 'number' ? b : undefined }
              })
            ].filter(stat => knownStat(stat.valHome) && knownStat(stat.valAway)) : []

  const players: PlayerStats[] = Array.isArray(activeTeam?.players)
    ? [...activeTeam.players].sort((a, b) => (b.pts || 0) - (a.pts || 0))
    : []

  const totalMin = totalMinutes(players.map(player => player.min))
  const sum = (key: keyof PlayerStats) => completeSum(players.map(player => typeof player[key] === 'number' ? player[key] as number : undefined))
  const totalPts = activeTeam?.pts ?? sum('pts')
  const totalTwoPm = activeTeam?.two_pm ?? sum('two_pm')
  const totalTwoPa = activeTeam?.two_pa ?? sum('two_pa')
  const totalThreePm = activeTeam?.three_pm ?? sum('three_pm')
  const totalThreePa = activeTeam?.three_pa ?? sum('three_pa')
  const totalFtm = activeTeam?.ftm ?? sum('ftm')
  const totalFta = activeTeam?.fta ?? sum('fta')
  const totalOrb = activeTeam?.orb ?? sum('orb')
  const totalDrb = activeTeam?.drb ?? sum('drb')
  const totalReb = activeTeam?.reb ?? sum('reb')
  const totalAst = activeTeam?.ast ?? sum('ast')
  const totalStl = activeTeam?.stl ?? sum('stl')
  const totalTov = activeTeam?.tov ?? sum('tov')
  const totalPf = activeTeam?.pf ?? sum('pf')
  const totalBlk = activeTeam?.blk ?? sum('blk')
  const totalFgm = activeTeam?.fgm ?? completeSum(players.map(p => p.fgm ?? addStats(p.two_pm, p.three_pm)))
  const totalFga = activeTeam?.fga ?? completeSum(players.map(p => p.fga ?? addStats(p.two_pa, p.three_pa)))
  const totalPfDrawn = sum('pfDrawn')
  const totalEval = sum('eval')

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
      {statsAllowed && quarters && quarters.length > 0 ? (
        <section className='drawer-match-section'>
          <SectionHeading className='drawer-section-title-small'>Wyniki w kwartach</SectionHeading>
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
      {statsAllowed && comparisonStats.length > 0 && (
        <section className='drawer-match-section'>
          <SectionHeading className='drawer-section-title-small'>Porównanie zespołowe</SectionHeading>
          <div className='team-comparison-list'>
            {comparisonStats.map((stat, idx) => {
              const total = stat.valHome! + stat.valAway!
              const homePct = total > 0 ? (stat.valHome! / total) * 100 : 50
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
      {statsAllowed && availableStats.length > 0 ? (
        <section className='drawer-match-section'>
          <SectionHeading className='drawer-section-title-small'>Punkty specjalne</SectionHeading>
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
          <SectionHeading className='drawer-section-title-small'>Notatki sztabu trenerskiego</SectionHeading>
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
          <SectionHeading className='drawer-section-title-small'>Przebieg meczu akcja po akcji</SectionHeading>
          <p className='profile__table-hint'>Szczegółowy zapis każdego posiadania piłki, celnych rzutów i zmian prosto z oficjalnego protokołu KALK.</p>
          <MatchPlayByPlay
            gameId={game.id}
            homeTeamName={all[0]?.name || 'BeKaPaKa Bobolice'}
            awayTeamName={all[1]?.name || game.opponent || 'Rywal'}
          />
        </section>
      ) : (
        /* Full Box Score with Team Switching Tabs */
        statsAllowed && hasAnyPlayers ? (
          <section className='drawer-match-section'>
            <div className='boxscore-header-row'>
              <SectionHeading className='drawer-section-title-small'>Statystyki indywidualne (Box Score)</SectionHeading>
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

            <button type='button' className='btn btn--secondary boxscore-view-toggle' aria-expanded={fullStats} onClick={() => setFullStats(!fullStats)}>{fullStats ? 'Podstawowe statystyki' : 'Pełne statystyki'}</button>
            <p className='profile__table-hint'>{fullStats ? 'Przewiń tabelę w bok, aby zobaczyć pełne statystyki rzutowe i obronne.' : 'Na telefonie pokazujemy MIN, PKT, ZB i AS. Wybierz pełne statystyki, aby zobaczyć pozostałe kolumny.'}</p>

            <div className='table-shell-v2 boxscore-scroll-shell' tabIndex={0} role='region' aria-label={`Statystyki ${activeTeam?.name}, przewijaj poziomo`}>
              <table className='data-table-v2 boxscore-table text-sm' data-view={fullStats ? 'all' : 'basic'}>
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
                    const fgm = p.fgm ?? addStats(p.two_pm, p.three_pm)
                    const fga = p.fga ?? addStats(p.two_pa, p.three_pa)
                    return (
                      <tr key={idx}>
                        <th scope='row' className='boxscore-col-player'>
                          <div className='boxscore-player-cell'>
                            <span className='boxscore-player-name'>{p.name}</span>
                            {p.starter && <span className='boxscore-starter-star' title='Pierwsza piątka'>*</span>}
                            {p.number != null && (
                              <span className='boxscore-player-number muted text-xs'>#{p.number}</span>
                            )}
                          </div>
                        </th>
                        <td className='text-center font-mono'>{p.min || '—'}</td>
                        <td className='text-center font-bold font-mono'><span className='highlight-gold'>{displayStat(p.pts)}</span></td>
                        <td className='text-center font-mono'>{formatShot(p.two_pm, p.two_pa)}</td>
                        <td className='text-center font-mono text-xs muted'>{formatPct(p.two_pm, p.two_pa)}</td>
                        <td className='text-center font-mono'>{formatShot(p.three_pm, p.three_pa)}</td>
                        <td className='text-center font-mono text-xs muted'>{formatPct(p.three_pm, p.three_pa)}</td>
                        <td className='text-center font-mono'>{formatShot(fgm, fga)}</td>
                        <td className='text-center font-mono text-xs muted'>{formatPct(fgm, fga)}</td>
                        <td className='text-center font-mono'>{formatShot(p.ftm, p.fta)}</td>
                        <td className='text-center font-mono text-xs muted'>{formatPct(p.ftm, p.fta)}</td>
                        <td className='text-center font-mono'>{displayStat(p.orb)}</td>
                        <td className='text-center font-mono'>{displayStat(p.drb)}</td>
                        <td className='text-center font-bold font-mono'>{displayStat(p.reb ?? addStats(p.orb, p.drb))}</td>
                        <td className='text-center font-mono'>{displayStat(p.ast)}</td>
                        <td className='text-center font-mono'>{displayStat(p.stl)}</td>
                        <td className='text-center font-mono'>{displayStat(p.tov)}</td>
                        <td className='text-center font-mono'>{displayStat(p.pf)}</td>
                        <td className='text-center font-mono'>{displayStat(p.pfDrawn)}</td>
                        <td className='text-center font-mono'>{displayStat(p.blk)}</td>
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
                    <td className='text-center font-bold font-mono highlight-gold'>{displayStat(totalPts)}</td>
                    <td className='text-center font-mono font-bold'>{formatShot(totalTwoPm, totalTwoPa)}</td>
                    <td className='text-center font-mono font-bold text-xs'>{formatPct(totalTwoPm, totalTwoPa)}</td>
                    <td className='text-center font-mono font-bold'>{formatShot(totalThreePm, totalThreePa)}</td>
                    <td className='text-center font-mono font-bold text-xs'>{formatPct(totalThreePm, totalThreePa)}</td>
                    <td className='text-center font-mono font-bold'>{formatShot(totalFgm, totalFga)}</td>
                    <td className='text-center font-mono font-bold text-xs'>{formatPct(totalFgm, totalFga)}</td>
                    <td className='text-center font-mono font-bold'>{formatShot(totalFtm, totalFta)}</td>
                    <td className='text-center font-mono font-bold text-xs'>{formatPct(totalFtm, totalFta)}</td>
                    <td className='text-center font-mono font-bold'>{displayStat(totalOrb)}</td>
                    <td className='text-center font-mono font-bold'>{displayStat(totalDrb)}</td>
                    <td className='text-center font-mono font-bold'>{displayStat(totalReb)}</td>
                    <td className='text-center font-mono font-bold'>{displayStat(totalAst)}</td>
                    <td className='text-center font-mono font-bold'>{displayStat(totalStl)}</td>
                    <td className='text-center font-mono font-bold'>{displayStat(totalTov)}</td>
                    <td className='text-center font-mono font-bold'>{displayStat(totalPf)}</td>
                    <td className='text-center font-mono font-bold'>{displayStat(totalPfDrawn)}</td>
                    <td className='text-center font-mono font-bold'>{displayStat(totalBlk)}</td>
                    <td className='text-center font-bold font-mono highlight-gold'>{displayStat(totalEval)}</td>
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

      {!loading && (!statsAllowed || !hasAnyPlayers) && (
        <p className='drawer-match-loading muted'>
          {{
            SCHEDULED: 'Szczegóły i statystyki meczowe będą dostępne po rozegraniu spotkania.',
            LIVE: 'Mecz trwa. Szczegółowe statystyki nie są jeszcze dostępne.',
            BREAK: 'Przerwa w meczu. Szczegółowe statystyki nie są jeszcze dostępne.',
            FINAL: 'Szczegółowe statystyki zawodników nie zostały jeszcze opublikowane przez ligę.',
            POSTPONED: 'Mecz został przełożony. Statystyki pojawią się po rozegraniu spotkania.',
            CANCELLED: 'Mecz został odwołany.'
          }[status]}
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
