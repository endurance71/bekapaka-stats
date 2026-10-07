import Link from 'next/link'
import type { RosterPlayer } from '../../../lib/data'
import { completeSum, shotLabel, shotPercentage } from '../../../lib/basketball-stats'
import { getPositionLabel } from '../../../lib/data/utils'
import { formatDate, formatStat } from '../../../lib/format'
import { Breadcrumbs } from '../primitives/PageHeader'
import { JerseyStripes } from '../primitives/JerseyStripes'
import { PlayerPortrait, playerNumber } from '../team/PlayerPortrait'
import { ShareActions } from './ShareActions'

function average(values: (number | undefined)[]) {
  const known = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  if (!known.length) return '—'
  return formatStat(known.reduce((sum, value) => sum + value, 0) / known.length)
}

function signed(value?: number | null, digits = 1) {
  if (value == null || Number.isNaN(value)) return '—'
  const text = value.toFixed(digits)
  return value > 0 ? `+${text}` : text
}

/**
 * Profil zawodnika: portret z numerem za postacią (5) | nazwisko w skali Display i średnie sezonu (7);
 * niżej skuteczność rzutowa i historia występów. Statystyki „—” do pierwszego meczu.
 */
export function PlayerProfile({ player, standalone = false }: { player: RosterPlayer; standalone?: boolean }) {
  const Heading = standalone ? 'h1' : 'h2'
  const SubHeading = standalone ? 'h2' : 'h3'
  const number = playerNumber(player)
  const hasGames = (player.gamesPlayed ?? 0) > 0
  const seasonStat = (value?: number | null) => (hasGames ? formatStat(value) : '—')
  const total = (key: 'fgm' | 'fga' | 'threePm' | 'threePa' | 'ftm' | 'fta') =>
    player[key] ?? completeSum((player.games || []).map((game) => game[key]))
  const shooting = [
    { label: 'Z gry', code: 'FG%', made: total('fgm'), attempted: total('fga') },
    { label: 'Za 3 punkty', code: '3P%', made: total('threePm'), attempted: total('threePa') },
    { label: 'Rzuty wolne', code: 'FT%', made: total('ftm'), attempted: total('fta') }
  ]
  const averages = [
    { label: 'Punkty', value: seasonStat(player.ppg) },
    { label: 'Zbiórki', value: seasonStat(player.rpg) },
    { label: 'Asysty', value: seasonStat(player.apg) },
    { label: 'EVAL', value: hasGames && player.eval != null ? formatStat(player.eval) : '—' }
  ]

  return (
    <div className="profile-page" data-theme="plyta">
      <section className="profile">
        <div className="container profile__grid">
          <div className="profile__media">
            <PlayerPortrait player={player} sizes="(min-width: 1024px) 40vw, 100vw" priority={standalone} />
          </div>
          <div className="profile__text">
            {standalone && (
              <Breadcrumbs items={[{ label: 'Start', href: '/' }, { label: 'Skład', href: '/sklad' }, { label: `${player.firstName} ${player.lastName}` }]} />
            )}
            <p className="kicker">
              {getPositionLabel(player.position)}
              {number ? ` · #${number}` : ''}
            </p>
            <Heading className="profile__name">
              <span className="profile__first-name">{player.firstName}</span>{' '}
              <span className="profile__last-name">{player.lastName}</span>
            </Heading>
            <p className="profile__season">
              {player.seasonLabel || 'Sezon niepotwierdzony'} · Rozegrane mecze: <strong>{player.gamesPlayed ?? '—'}</strong>
            </p>
            <dl className="profile__averages" aria-label="Średnie na mecz w sezonie">
              {averages.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
            {!hasGames && (
              <p className="profile__note">
                {player.gamesPlayed === 0 ? 'Statystyki pojawią się po pierwszym występie w sezonie.' : 'Liczba występów w sezonie nie jest potwierdzona.'}
              </p>
            )}
            {player.numberSource === 'brand-fallback' && (
              <p className="profile__note">Numer z materiałów klubu; protokół meczu może podawać inny numer.</p>
            )}
            {(player.heightCm || player.birthDate) && (
              <p className="profile__physicals">
                {player.heightCm && (
                  <span>
                    Wzrost <strong>{player.heightCm} cm</strong>
                  </span>
                )}
                {player.birthDate && (
                  <span>
                    Urodzony <strong>{player.birthDate}</strong>
                  </span>
                )}
              </p>
            )}
            {standalone && <ShareActions />}
          </div>
        </div>
        <JerseyStripes className="profile__stripes" />
      </section>

      <div className="container profile__details">
        <section className="profile-section" aria-label="Skuteczność rzutowa">
          <SubHeading className="profile-section__title">Skuteczność rzutowa</SubHeading>
          <ul className="shooting" role="list">
            {shooting.map(({ label, code, made, attempted }) => {
              const value = shotPercentage(made, attempted)
              const available = hasGames && value != null
              return (
                <li key={code} className="shooting__row">
                  <span className="shooting__label">
                    {label} <abbr>{code}</abbr>
                  </span>
                  <span className={`shooting__value${available ? '' : ' is-empty'}`}>{available ? `${formatStat(value)}%` : 'brak prób'}</span>
                  <span className="shooting__attempts">{hasGames ? shotLabel(made, attempted) : '—'} celne/próby</span>
                  <span className="shooting__track" aria-hidden="true">
                    <span className="shooting__fill" style={{ width: `${available ? Math.max(0, Math.min(100, value ?? 0)) : 0}%` }} />
                  </span>
                </li>
              )
            })}
          </ul>
          <dl className="profile-extra">
            <div>
              <dt>eFG%</dt>
              <dd>{hasGames && player.eFgPercentage != null ? `${formatStat(player.eFgPercentage)}%` : '—'}</dd>
            </div>
            <div>
              <dt>TS%</dt>
              <dd>{hasGames && player.tsPercentage != null ? `${formatStat(player.tsPercentage)}%` : '—'}</dd>
            </div>
            <div>
              <dt>+/− (śr.)</dt>
              <dd>{hasGames ? signed(player.plusMinus) : '—'}</dd>
            </div>
          </dl>
          <p className="table-hint">
            EVAL — efektywność meczowa (punkty, zbiórki, asysty, przechwyty i bloki minus straty i niecelne rzuty). eFG% — skuteczność z premią za
            rzuty za 3. TS% — skuteczność punktowa z rzutami wolnymi.
          </p>
        </section>

        {player.games && player.games.length > 0 && (
          <section className="profile-section" aria-label="Historia występów">
            <SubHeading className="profile-section__title">Historia występów</SubHeading>
            <div className="table-scroll" tabIndex={0} role="region" aria-label="Historia występów, przewijaj poziomo">
              <table className="table data-table data-table--compact">
                <caption className="sr-only">
                  Historia występów zawodnika {player.firstName} {player.lastName}
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="boxscore-col-player">Przeciwnik</th>
                    <th scope="col">MIN</th>
                    <th scope="col" className="col-key">PKT</th>
                    <th scope="col">ZB</th>
                    <th scope="col">AS</th>
                    <th scope="col">PRZ</th>
                    <th scope="col">BL</th>
                    <th scope="col">+/−</th>
                    <th scope="col" className="col-key">EVAL</th>
                  </tr>
                </thead>
                <tbody>
                  {player.games.map((game, index) => (
                    <tr key={index}>
                      <th scope="row"><strong>{game.opponent}</strong>
                        <time className="player-game-date" dateTime={game.date}>
                          {formatDate(game.date)}
                        </time>
                      </th>
                      <td>{game.min || '—'}</td>
                      <td className="col-key">{game.pts}</td>
                      <td>{game.reb}</td>
                      <td>{game.ast}</td>
                      <td>{game.stl ?? '—'}</td>
                      <td>{game.blk ?? '—'}</td>
                      <td className={(game.plusMinus || 0) > 0 ? 'is-positive' : (game.plusMinus || 0) < 0 ? 'is-negative' : ''}>
                        {game.plusMinus != null ? signed(game.plusMinus, 0) : '—'}
                      </td>
                      <td className="col-key">{game.eval ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
                {player.games.length > 1 && (
                  <tfoot>
                    <tr>
                      <th scope="row">Średnio · {player.games.length} meczów</th>
                      <td>—</td>
                      <td className="col-key">{average(player.games.map((game) => game.pts))}</td>
                      <td>{average(player.games.map((game) => game.reb))}</td>
                      <td>{average(player.games.map((game) => game.ast))}</td>
                      <td>{average(player.games.map((game) => game.stl))}</td>
                      <td>{average(player.games.map((game) => game.blk))}</td>
                      <td>{average(player.games.map((game) => game.plusMinus ?? undefined))}</td>
                      <td className="col-key">{average(player.games.map((game) => game.eval ?? undefined))}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <dl className="glossary-inline glossary-inline--table" aria-label="Objaśnienie skrótów">
              <div><dt>MIN</dt><dd>minuty na parkiecie</dd></div>
              <div><dt>PKT</dt><dd>punkty</dd></div>
              <div><dt>ZB</dt><dd>zbiórki</dd></div>
              <div><dt>AS</dt><dd>asysty</dd></div>
              <div><dt>PRZ</dt><dd>przechwyty</dd></div>
              <div><dt>BL</dt><dd>bloki</dd></div>
              <div><dt>+/−</dt><dd>bilans punktów podczas gry</dd></div>
              <div><dt>EVAL</dt><dd>wskaźnik efektywności</dd></div>
            </dl>
          </section>
        )}

        {!standalone && (
          <Link className="btn btn--secondary btn--block" href={`/sklad/${encodeURIComponent(player.id)}`}>
            Otwórz pełny profil zawodnika
          </Link>
        )}
        {standalone && (
          <Link className="arrow-link" href="/sklad">
            <span>Cały skład</span>
          </Link>
        )}
      </div>
    </div>
  )
}
