import Link from 'next/link'
import type { Matchup, MatchupTeam } from '../../../lib/data/schemas'
import { formatDate } from '../../../lib/format'
import { Band } from '../primitives/Band'
import { BandHead } from '../primitives/BandHead'
import { FormBadges } from '../shared/StandingsBoard'
import { CompareBars, type CompareRow } from './CompareBars'
import { TeamMark } from './TeamMark'

const number = (value: number) => value.toLocaleString('pl-PL', { maximumFractionDigits: 1 })
const percent = (value: number | null | undefined) => (value == null ? '—' : `${number(value)}%`)

/** 1 mecz · 2–4 mecze · 5+ meczów (z wyjątkiem 12–14). */
export function gamesLabel(count: number) {
  const tens = count % 100
  if (count === 1) return '1 mecz'
  if (count % 10 >= 2 && count % 10 <= 4 && (tens < 12 || tens > 14)) return `${count} mecze`
  return `${count} meczów`
}

function compareRows(us: MatchupTeam, them: MatchupTeam): CompareRow[] {
  if (!us.perGame || !them.perGame || !us.pct || !them.pct) return []
  const counting: [string, keyof NonNullable<MatchupTeam['perGame']>, boolean?][] = [
    ['Punkty zdobyte', 'pts'],
    ['Punkty stracone', 'opp', true],
    ['Zbiórki', 'reb'],
    ['Asysty', 'ast'],
    ['Przechwyty', 'stl'],
    ['Bloki', 'blk'],
    ['Straty', 'tov', true]
  ]
  const shooting: [string, keyof NonNullable<MatchupTeam['pct']>][] = [
    ['Skuteczność z gry (FG%)', 'fg'],
    ['Za 3 punkty (3P%)', 'three'],
    ['Rzuty wolne (FT%)', 'ft']
  ]
  return [
    ...counting.map(([label, key, lowerIsBetter]) => ({
      label,
      us: number(us.perGame![key]),
      them: number(them.perGame![key]),
      usValue: us.perGame![key],
      themValue: them.perGame![key],
      lowerIsBetter
    })),
    ...shooting
      .filter(([, key]) => us.pct![key] != null && them.pct![key] != null)
      .map(([label, key]) => ({ label, us: percent(us.pct![key]), them: percent(them.pct![key]), usValue: us.pct![key]!, themValue: them.pct![key]! }))
  ]
}

function TeamSide({ team, own }: { team: MatchupTeam; own: boolean }) {
  return (
    <div className={`matchup__team${own ? ' matchup__team--own' : ''}`}>
      <TeamMark own={own} name={team.name} logoUrl={team.logoUrl} size="md" />
      <div className="matchup__team-text">
        <p className="matchup__team-name">{team.name}</p>
        <p className="matchup__team-meta">
          {team.position != null && <span>{team.position}. miejsce</span>}
          <span>
            bilans {team.wins}–{team.losses}
          </span>
        </p>
        <FormBadges form={team.form} />
      </div>
    </div>
  )
}

/**
 * Zapowiedź meczu: BeKaPaKa i rywal w bieżącym sezonie — tabela, średnie na mecz z box score,
 * najlepsi strzelcy i mecze bezpośrednie. Dane: `/api/league/matchup`.
 */
export function MatchupPreview({ matchup }: { matchup: Matchup }) {
  const { us, them } = matchup.teams
  const rows = compareRows(us, them)
  const seasonLabel = matchup.season?.label.replace(/^Sezon\s+/i, '') || 'bieżący'
  const missing = [us, them].filter((team) => !team.boxScoreGames)
  const hasScorers = matchup.scorers.us.length > 0 || matchup.scorers.them.length > 0

  return (
    <Band theme="plyta" labelledBy="przed-meczem" className="matchup">
      <BandHead kicker="Przed meczem" title={`Jak wypadamy w sezonie ${seasonLabel}`} titleId="przed-meczem" />

      <div className="matchup__teams">
        <TeamSide team={us} own />
        <span className="matchup__vs" aria-hidden="true">
          vs
        </span>
        <TeamSide team={them} own={false} />
      </div>

      {rows.length > 0 && (
        <section className="match-section matchup__compare" aria-label="Średnie na mecz w sezonie">
          <h3 className="t-label muted">Średnio na mecz</h3>
          <CompareBars usLabel={us.name} themLabel={them.name} rows={rows} />
        </section>
      )}
      {missing.length > 0 && (
        <p className="matchup__note">
          {missing.map((team) => `${team.name} nie ma jeszcze w tym sezonie meczu ze statystykami.`).join(' ')}
        </p>
      )}

      {(hasScorers || matchup.headToHead.length > 0) && (
        <div className="matchup__extra">
          {hasScorers && (
            <section className="matchup__scorers" aria-labelledby="matchup-scorers">
              <h3 id="matchup-scorers" className="t-label muted">
                Najlepsi strzelcy · pkt na mecz
              </h3>
              <div className="matchup__scorer-cols">
                {[
                  { team: us, list: matchup.scorers.us },
                  { team: them, list: matchup.scorers.them }
                ].map(({ team, list }) => (
                  <div key={team.name}>
                    <p className="matchup__scorer-team">{team.name}</p>
                    {list.length ? (
                      <ol className="zebra-list" role="list">
                        {list.map((player) => (
                          <li key={player.name} className="matchup__scorer">
                            <span>{player.name}</span>
                            <strong>{number(player.pointsAverage)}</strong>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="muted">Brak danych w tym sezonie.</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          {matchup.headToHead.length > 0 && (
            <section className="matchup__h2h" aria-labelledby="matchup-h2h">
              <h3 id="matchup-h2h" className="t-label muted">
                Mecze bezpośrednie
              </h3>
              <ol className="zebra-list" role="list">
                {matchup.headToHead.map((game) => {
                  const win = game.scoreUs > game.scoreThem
                  return (
                    <li key={game.gameId}>
                      <Link className="matchup__h2h-row" href={`/mecze/kalk-${encodeURIComponent(game.gameId)}`}>
                        <span className="matchup__h2h-date">
                          {formatDate(game.date)}
                          {game.seasonLabel && <small>{game.seasonLabel}</small>}
                        </span>
                        <span className={`matchup__h2h-result matchup__h2h-result--${win ? 'win' : 'loss'}`}>{win ? 'Wygrana' : 'Porażka'}</span>
                        <strong className="matchup__h2h-score">
                          {game.scoreUs}:{game.scoreThem}
                        </strong>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <p className="matchup__source">
          Średnie z box score KALK: {us.name} — {gamesLabel(us.boxScoreGames)}, {them.name} — {gamesLabel(them.boxScoreGames)} w sezonie {seasonLabel}.
        </p>
      )}
    </Band>
  )
}
