import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import type { Matchup, MatchupTeam } from '../../../lib/data/schemas'
import { formatDate } from '../../../lib/format'
import { Band } from '../primitives/Band'
import { BandHead } from '../primitives/BandHead'
import { FormBadges } from '../shared/StandingsBoard'
import { TeamMark, VersusMark } from './TeamMark'

const number = (value: number) => value.toLocaleString('pl-PL', { maximumFractionDigits: 1 })

/** 1 mecz · 2–4 mecze · 5+ meczów (z wyjątkiem 12–14). */
export function gamesLabel(count: number) {
  const tens = count % 100
  if (count === 1) return '1 mecz'
  if (count % 10 >= 2 && count % 10 <= 4 && (tens < 12 || tens > 14)) return `${count} mecze`
  return `${count} meczów`
}

type Stat = { key: string; label: string; read: (team: MatchupTeam) => number | null | undefined; percent?: boolean; lowerIsBetter?: boolean }

/** Porównanie drużyn w trzech blokach — od tego, co widać na tablicy wyników, do obrony. */
const GROUPS: { title: string; stats: Stat[] }[] = [
  {
    title: 'Atak',
    stats: [
      { key: 'pts', label: 'Punkty', read: (t) => t.perGame?.pts },
      { key: 'ast', label: 'Asysty', read: (t) => t.perGame?.ast },
      { key: 'fgPct', label: 'Skuteczność z gry', read: (t) => t.pct?.fg, percent: true },
      { key: 'twoPct', label: 'Za 2 punkty', read: (t) => t.pct?.two, percent: true },
      { key: 'threePct', label: 'Za 3 punkty', read: (t) => t.pct?.three, percent: true },
      { key: 'ftPct', label: 'Rzuty wolne', read: (t) => t.pct?.ft, percent: true }
    ]
  },
  {
    title: 'Zbiórki',
    stats: [
      { key: 'reb', label: 'Zbiórki', read: (t) => t.perGame?.reb },
      { key: 'orb', label: 'W ataku', read: (t) => t.perGame?.orb },
      { key: 'drb', label: 'W obronie', read: (t) => t.perGame?.drb }
    ]
  },
  {
    title: 'Obrona',
    stats: [
      { key: 'opp', label: 'Punkty stracone', read: (t) => t.perGame?.opp, lowerIsBetter: true },
      { key: 'stl', label: 'Przechwyty', read: (t) => t.perGame?.stl },
      { key: 'blk', label: 'Bloki', read: (t) => t.perGame?.blk },
      { key: 'tov', label: 'Straty', read: (t) => t.perGame?.tov, lowerIsBetter: true }
    ]
  }
]

const LEADER_LABELS: Record<string, string> = {
  pts: 'Punkty',
  reb: 'Zbiórki',
  ast: 'Asysty',
  stl: 'Przechwyty',
  blk: 'Bloki',
  eval: 'EVAL'
}

function better(us: number, them: number, lowerIsBetter = false): 'us' | 'them' | null {
  if (us === them) return null
  return us > them !== lowerIsBetter ? 'us' : 'them'
}

/** Długość paska względem większej z dwóch wartości (większa = pełna połowa). */
const share = (value: number, other: number) => (Math.max(value, other) > 0 ? `${(value / Math.max(value, other)) * 100}%` : '0%')

/**
 * Wiersz „lustrzany”: wartość BeKaPaKa · paski od środka · wartość rywala. Lepsza strona w kolorze marki.
 * Wspólny dla statystyk drużyn i pojedynków liderów.
 */
function DuelRow({
  label,
  us,
  them,
  usValue,
  themValue,
  lowerIsBetter,
  usNote,
  themNote,
  player = false
}: {
  label: string
  us: ReactNode
  them: ReactNode
  usValue: number
  themValue: number
  lowerIsBetter?: boolean
  usNote?: ReactNode
  themNote?: ReactNode
  /** Pojedynek zawodników: nazwisko jest główną informacją, nie przypisem. */
  player?: boolean
}) {
  const winner = better(usValue, themValue, lowerIsBetter)
  return (
    <div className={`duel${player ? ' duel--player' : ''}`} data-winner={winner ?? 'tie'}>
      <div className={`duel__side duel__side--us${winner === 'us' ? ' is-better' : ''}`}>
        <span className="duel__value">{us}</span>
        {usNote && <span className="duel__note">{usNote}</span>}
      </div>
      <div className="duel__middle">
        <span className="duel__label">{label}</span>
        <span className="duel__bars" aria-hidden="true">
          <span className="duel__bar duel__bar--us" style={{ '--share': share(usValue, themValue) } as CSSProperties} />
          <span className="duel__bar duel__bar--them" style={{ '--share': share(themValue, usValue) } as CSSProperties} />
        </span>
      </div>
      <div className={`duel__side duel__side--them${winner === 'them' ? ' is-better' : ''}`}>
        <span className="duel__value">{them}</span>
        {themNote && <span className="duel__note">{themNote}</span>}
      </div>
    </div>
  )
}

function TeamHead({ team, own }: { team: MatchupTeam; own: boolean }) {
  return (
    <div className={`matchup__team${own ? ' matchup__team--own' : ''}`}>
      <TeamMark own={own} name={team.name} logoUrl={team.logoUrl} size="lg" />
      <p className="matchup__team-name">{team.name}</p>
      <p className="matchup__team-meta">
        {team.position != null && <span>{team.position}. miejsce</span>}
        <span>
          bilans {team.wins}–{team.losses}
        </span>
      </p>
      <FormBadges form={team.form} />
    </div>
  )
}

const rankNote = (team: MatchupTeam, key: string) => {
  const rank = team.ranks?.[key]
  return rank && (team.leagueTeams ?? 0) > 1 ? `${rank}. w lidze` : undefined
}

/**
 * Zapowiedź meczu w formie programu meczowego: para drużyn, lustrzane porównanie sezonu (z miejscem w lidze),
 * pojedynki liderów i mecze bezpośrednie. Dane: `/api/league/matchup`.
 */
export function MatchupPreview({ matchup }: { matchup: Matchup }) {
  const { us, them } = matchup.teams
  const seasonLabel = matchup.season?.label.replace(/^Sezon\s+/i, '') || 'bieżący'
  const bothPlayed = Boolean(us.perGame && them.perGame)
  const missing = [us, them].filter((team) => !team.boxScoreGames)
  const groups = GROUPS.map((group) => ({
    ...group,
    stats: group.stats.filter((stat) => stat.read(us) != null && stat.read(them) != null)
  })).filter((group) => group.stats.length > 0)

  return (
    <Band theme="plyta" labelledBy="przed-meczem" className="matchup">
      <BandHead kicker="Przed meczem" title={`Sezon ${seasonLabel}: kto ma przewagę?`} titleId="przed-meczem" />

      <div className="matchup__head">
        <TeamHead team={us} own />
        <div className="matchup__versus" aria-hidden="true">
          <VersusMark />
          <span>vs</span>
        </div>
        <TeamHead team={them} own={false} />
      </div>

      {bothPlayed && (
        <div className="matchup__tape">
          {groups.map((group) => (
            <section key={group.title} className="matchup__group" aria-label={`${group.title} — średnio na mecz`}>
              <h3 className="matchup__group-title">{group.title}</h3>
              {group.stats.map((stat) => {
                const a = stat.read(us) as number
                const b = stat.read(them) as number
                const show = (value: number) => (stat.percent ? `${number(value)}%` : number(value))
                return (
                  <DuelRow
                    key={stat.key}
                    label={stat.label}
                    us={show(a)}
                    them={show(b)}
                    usValue={a}
                    themValue={b}
                    lowerIsBetter={stat.lowerIsBetter}
                    usNote={rankNote(us, stat.key)}
                    themNote={rankNote(them, stat.key)}
                  />
                )
              })}
            </section>
          ))}
        </div>
      )}
      {missing.length > 0 && (
        <p className="matchup__note">{missing.map((team) => `${team.name} nie ma jeszcze w tym sezonie meczu ze statystykami.`).join(' ')}</p>
      )}

      {matchup.leaders.length > 0 && (
        <div className="matchup__tape">
        <section className="matchup__group matchup__leaders" aria-labelledby="matchup-leaders">
          <h3 id="matchup-leaders" className="matchup__group-title">
            Liderzy · na mecz
          </h3>
          {matchup.leaders.map((duel) => (
            <DuelRow
              key={duel.category}
              label={LEADER_LABELS[duel.category] || duel.category}
              us={duel.us ? number(duel.us.value) : '—'}
              them={duel.them ? number(duel.them.value) : '—'}
              usValue={duel.us?.value ?? 0}
              themValue={duel.them?.value ?? 0}
              usNote={duel.us?.name}
              themNote={duel.them?.name}
              player
            />
          ))}
        </section>
        </div>
      )}

      {matchup.headToHead.length > 0 && (
        <section className="matchup__h2h" aria-labelledby="matchup-h2h">
          <h3 id="matchup-h2h" className="matchup__group-title">
            Mecze bezpośrednie
          </h3>
          <ol className="matchup__h2h-list" role="list">
            {matchup.headToHead.map((game) => {
              const win = game.scoreUs > game.scoreThem
              return (
                <li key={game.gameId}>
                  <Link className={`matchup__h2h-game matchup__h2h-game--${win ? 'win' : 'loss'}`} href={`/mecze/kalk-${encodeURIComponent(game.gameId)}`}>
                    <span className="matchup__h2h-result">{win ? 'Wygrana' : 'Porażka'}</span>
                    <strong className="matchup__h2h-score">
                      {game.scoreUs}:{game.scoreThem}
                    </strong>
                    <span className="matchup__h2h-date">
                      {formatDate(game.date)}
                      {game.seasonLabel && ` · ${game.seasonLabel.replace(/^Sezon\s+/i, '')}`}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {bothPlayed && (
        <p className="matchup__source">
          Średnie na mecz z box score KALK: {us.name} — {gamesLabel(us.boxScoreGames)}, {them.name} — {gamesLabel(them.boxScoreGames)} w sezonie {seasonLabel}. Miejsce w lidze wśród {us.leagueTeams || them.leagueTeams} drużyn ze statystykami.
        </p>
      )}
    </Band>
  )
}
