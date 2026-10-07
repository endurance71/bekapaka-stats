'use client'

import { useEffect, useState } from 'react'
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

function ShotCell({ made, attempted, group = false }: { made?: number; attempted?: number; group?: boolean }) {
  const pct = formatPct(made, attempted)
  return (
    <td className={`shot${group ? ' col-group' : ''}`}>
      <span>{formatShot(made, attempted)}</span>
      {pct !== '—' && <small>{pct}</small>}
    </td>
  )
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
  // Widok linkowalny: /mecze/kalk-…?widok=akcje otwiera akcję po akcji.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('widok') === 'akcje') setActiveMainTab('pbp')
  }, [])
  const selectMainTab = (tab: 'boxscore' | 'pbp') => {
    setActiveMainTab(tab)
    const url = new URL(window.location.href)
    if (tab === 'pbp') url.searchParams.set('widok', 'akcje')
    else url.searchParams.delete('widok')
    window.history.replaceState(null, '', url)
  }
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
              ...[['Rzuty z gry (FG)', 'fgm', 'fga'], ['Rzuty za 3 pkt (3P)', 'three_pm', 'three_pa'], ['Rzuty wolne (FT)', 'ftm', 'fta']].map(([label, made, attempted]) => {
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
    <div className='match-stats'>
      {!hideScoreHeader && hasScore && (
        <div className='drawer-match-header'>
          <div className='drawer-match-scoreboard'>
            <div className='scoreboard-team'>
              <span className='scoreboard-team-name'>BeKaPaKa</span>
            </div>
            <div className='scoreboard-score-numbers' aria-label={`Wynik ${game.scoreUs} do ${game.scoreThem}`}>
              <span className={isWin ? 'is-positive' : 'is-negative'}>{game.scoreUs}</span>
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

      {/* Main Tabs: Statystyki (Box Score) vs Akcja po akcji (Play-by-Play) */}
      {final && hasScore && (
        <div className='tabs tabs--buttons' role='tablist' aria-label='Widok meczu'>
          <button
            type='button'
            role='tab'
            aria-selected={activeMainTab === 'boxscore'}
            className='tabs__btn'
            onClick={() => selectMainTab('boxscore')}
          >
            Statystyki
          </button>
          <button
            type='button'
            role='tab'
            aria-selected={activeMainTab === 'pbp'}
            className='tabs__btn'
            onClick={() => selectMainTab('pbp')}
          >
            Akcja po akcji
          </button>
        </div>
      )}

      {activeMainTab === 'boxscore' && (
      <div className='match-overview'>
      {/* Quarters Breakdown */}
      {statsAllowed && quarters && quarters.length > 0 ? (
        <section className='match-section'>
          <SectionHeading className='match-section__title'>Wyniki w kwartach</SectionHeading>
          <div className='table-scroll'>
            <table className='table data-table linescore'>
              <caption className='visually-hidden'>Punkty w kwartach</caption>
              <thead>
                <tr>
                  <th scope='col' className='boxscore-col-player'>Drużyna</th>
                  {quarters.map((q: { label: string }, idx: number) => (
                    <th key={idx} scope='col'>{q.label || `Q${idx + 1}`}</th>
                  ))}
                  <th scope='col' className='col-group col-key'>Razem</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'BeKaPaKa', key: 'home' as const, total: game.scoreUs, own: true },
                  { name: game.opponent, key: 'away' as const, total: game.scoreThem, own: false }
                ].map((team) => (
                  <tr key={team.key} className={team.own ? 'is-own' : undefined}>
                    <th scope='row' className='boxscore-col-player'>{team.name}</th>
                    {quarters.map((q: { home: number; away: number }, idx: number) => (
                      <td key={idx}>{q[team.key]}</td>
                    ))}
                    <td className='col-group col-key'>{team.total ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* Advanced Team Comparison Stats */}
      {statsAllowed && comparisonStats.length > 0 && (
        <section className='match-section'>
          <SectionHeading className='match-section__title'>Porównanie zespołowe</SectionHeading>
          <div className='compare__head' aria-hidden='true'>
            <span>BeKaPaKa</span>
            <span>{game.opponent}</span>
          </div>
          <div className='compare'>
            {comparisonStats.map((stat, idx) => {
              const total = stat.valHome! + stat.valAway!
              const homePct = total > 0 ? (stat.valHome! / total) * 100 : 50
              return (
                <div key={idx} className='compare__item'>
                  <div className='compare__labels'>
                    <span className='compare__home'>{stat.home}</span>
                    <span className='compare__name'>{stat.label}</span>
                    <span className='compare__away'>{stat.away}</span>
                  </div>
                  <div className='compare__track' aria-hidden="true">
                    <div className='compare__fill-home' style={{ width: `${homePct}%` }} />
                    <div className='compare__fill-away' style={{ width: `${100 - homePct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Additional team comparison stats if present */}
      {statsAllowed && availableStats.length > 0 ? (
        <section className='match-section'>
          <SectionHeading className='match-section__title'>Punkty specjalne</SectionHeading>
          <div className='compare__head' aria-hidden='true'>
            <span>BeKaPaKa</span>
            <span>{game.opponent}</span>
          </div>
          <div className='compare'>
            {availableStats.map((stat, idx) => {
              const total = stat.home + stat.away
              const homePct = total > 0 ? (stat.home / total) * 100 : 50
              return (
                <div key={idx} className='compare__item'>
                  <div className='compare__labels'>
                    <span className='compare__home'>{stat.home}</span>
                    <span className='compare__name'>{stat.label}</span>
                    <span className='compare__away'>{stat.away}</span>
                  </div>
                  <div className='compare__track'>
                    <div className='compare__fill-home' style={{ width: `${homePct}%` }} />
                    <div className='compare__fill-away' style={{ width: `${100 - homePct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      </div>
      )}

      {/* Coach Notes */}
      {game.coachNotes ? (
        <section className='match-section coach-notes-block'>
          <SectionHeading className='match-section__title'>Notatki sztabu trenerskiego</SectionHeading>
          <p className='coach-notes-text'>{game.coachNotes}</p>
        </section>
      ) : null}

      {/* Play-by-Play View */}
      {activeMainTab === 'pbp' ? (
        <section className='match-section'>
          <SectionHeading className='match-section__title'>Przebieg meczu akcja po akcji</SectionHeading>
          <MatchPlayByPlay
            gameId={game.id}
            homeTeamName={all[0]?.name || 'BeKaPaKa Bobolice'}
            awayTeamName={all[1]?.name || game.opponent || 'Rywal'}
          />
        </section>
      ) : (
        /* Full Box Score with Team Switching Tabs */
        statsAllowed && hasAnyPlayers ? (
          <section className='match-section'>
            <SectionHeading className='match-section__title'>Statystyki zawodników</SectionHeading>
            <div className='toolbar'>
              {all.length > 1 && (
                <div className='segmented' role='tablist' aria-label='Wybór drużyny w statystykach'>
                  {all.map((team, idx) => (
                    <button
                      key={idx}
                      type='button'
                      role='tab'
                      aria-selected={activeTeamIndex === idx}
                      className='segmented__btn'
                      onClick={() => setActiveTeamIndex(idx)}
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              )}
              <button type='button' className='btn btn--secondary boxscore-view-toggle' aria-expanded={fullStats} onClick={() => setFullStats(!fullStats)}>{fullStats ? 'Podstawowe statystyki' : 'Pełne statystyki'}</button>
            </div>
            <p className='table-hint table-hint--mobile'>{fullStats ? 'Przewiń tabelę w bok, aby zobaczyć wszystkie kolumny.' : 'Pokazujemy MIN, PKT, ZB i AS. Pełne statystyki pokażą rzuty i obronę.'}</p>

            <div className='table-scroll boxscore-scroll-shell' tabIndex={0} role='region' aria-label={`Statystyki ${activeTeam?.name}, przewijaj poziomo`}>
              <table className='table data-table boxscore-table text-sm' data-view={fullStats ? 'all' : 'basic'}>
                <caption className='visually-hidden'>Pełne statystyki zawodników {activeTeam?.name}</caption>
                <thead>
                  <tr>
                    <th scope='col' className='boxscore-col-player'>Zawodnik</th>
                    <th scope='col'>MIN</th>
                    <th scope='col' className='col-key'>PKT</th>
                    <th scope='col' className='col-group'><abbr title='Rzuty za 2: celne/oddane i skuteczność'>2P</abbr></th>
                    <th scope='col'><abbr title='Rzuty za 3: celne/oddane i skuteczność'>3P</abbr></th>
                    <th scope='col'><abbr title='Rzuty z gry: celne/oddane i skuteczność'>FG</abbr></th>
                    <th scope='col'><abbr title='Rzuty wolne: celne/oddane i skuteczność'>FT</abbr></th>
                    <th scope='col' className='col-group'><abbr title='Zbiórki w ataku'>ZA</abbr></th>
                    <th scope='col'><abbr title='Zbiórki w obronie'>ZO</abbr></th>
                    <th scope='col' className='col-key'><abbr title='Zbiórki razem'>ZB</abbr></th>
                    <th scope='col' className='col-group'><abbr title='Asysty'>AS</abbr></th>
                    <th scope='col'><abbr title='Przechwyty'>PRZ</abbr></th>
                    <th scope='col'><abbr title='Straty'>STR</abbr></th>
                    <th scope='col'><abbr title='Bloki'>BL</abbr></th>
                    <th scope='col'><abbr title='Faule popełnione'>F</abbr></th>
                    <th scope='col'><abbr title='Faule wymuszone'>FW</abbr></th>
                    <th scope='col' className='col-group col-key'><abbr title='Wskaźnik efektywności'>EVAL</abbr></th>
                    <th scope='col'><abbr title='Plus/minus na parkiecie'>+/−</abbr></th>
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
                            {p.number != null && <span className='boxscore-player-number'>#{p.number}</span>}
                          </div>
                        </th>
                        <td>{p.min || '—'}</td>
                        <td className='col-key'>{displayStat(p.pts)}</td>
                        <ShotCell made={p.two_pm} attempted={p.two_pa} group />
                        <ShotCell made={p.three_pm} attempted={p.three_pa} />
                        <ShotCell made={fgm} attempted={fga} />
                        <ShotCell made={p.ftm} attempted={p.fta} />
                        <td className='col-group'>{displayStat(p.orb)}</td>
                        <td>{displayStat(p.drb)}</td>
                        <td className='col-key'>{displayStat(p.reb ?? addStats(p.orb, p.drb))}</td>
                        <td className='col-group'>{displayStat(p.ast)}</td>
                        <td>{displayStat(p.stl)}</td>
                        <td>{displayStat(p.tov)}</td>
                        <td>{displayStat(p.blk)}</td>
                        <td>{displayStat(p.pf)}</td>
                        <td>{displayStat(p.pfDrawn)}</td>
                        <td className='col-group col-key'>{p.eval ?? '—'}</td>
                        <td className={p.plusMinus != null && p.plusMinus > 0 ? 'is-positive' : p.plusMinus != null && p.plusMinus < 0 ? 'is-negative' : ''}>
                          {p.plusMinus != null ? (p.plusMinus > 0 ? `+${p.plusMinus}` : p.plusMinus) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className='boxscore-total-row'>
                    <th scope='row' className='boxscore-col-player'>Zespół</th>
                    <td>{totalMin}</td>
                    <td className='col-key'>{displayStat(totalPts)}</td>
                    <ShotCell made={totalTwoPm} attempted={totalTwoPa} group />
                    <ShotCell made={totalThreePm} attempted={totalThreePa} />
                    <ShotCell made={totalFgm} attempted={totalFga} />
                    <ShotCell made={totalFtm} attempted={totalFta} />
                    <td className='col-group'>{displayStat(totalOrb)}</td>
                    <td>{displayStat(totalDrb)}</td>
                    <td className='col-key'>{displayStat(totalReb)}</td>
                    <td className='col-group'>{displayStat(totalAst)}</td>
                    <td>{displayStat(totalStl)}</td>
                    <td>{displayStat(totalTov)}</td>
                    <td>{displayStat(totalBlk)}</td>
                    <td>{displayStat(totalPf)}</td>
                    <td>{displayStat(totalPfDrawn)}</td>
                    <td className='col-group col-key'>{displayStat(totalEval)}</td>
                    <td>—</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <dl className='glossary-inline glossary-inline--table' aria-label='Objaśnienie skrótów'>
              <div><dt>*</dt><dd>pierwsza piątka</dd></div>
              <div><dt>MIN</dt><dd>minuty na parkiecie</dd></div>
              <div><dt>PKT</dt><dd>punkty</dd></div>
              <div><dt>2P · 3P · FG · FT</dt><dd>rzuty za 2, za 3, z gry i wolne: celne/oddane i skuteczność</dd></div>
              <div><dt>ZA · ZO · ZB</dt><dd>zbiórki w ataku, w obronie, razem</dd></div>
              <div><dt>AS</dt><dd>asysty</dd></div>
              <div><dt>PRZ</dt><dd>przechwyty</dd></div>
              <div><dt>STR</dt><dd>straty</dd></div>
              <div><dt>BL</dt><dd>bloki</dd></div>
              <div><dt>F · FW</dt><dd>faule popełnione i wymuszone</dd></div>
              <div><dt>EVAL</dt><dd>wskaźnik efektywności</dd></div>
              <div><dt>+/−</dt><dd>bilans punktów podczas gry zawodnika</dd></div>
            </dl>
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
          className='btn btn--primary match-video'
        >
          <VideoIcon size={18} />
          Oglądaj skrót wideo z meczu
        </a>
      ) : null}
    </div>
  )
}
