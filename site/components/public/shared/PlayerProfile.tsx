import Link from 'next/link'
import { ShareActions } from './ShareActions'
import type { RosterPlayer } from '../../../lib/data'
import { FallbackImage } from './FallbackImage'
import { completeSum, shotPercentage, shotLabel } from '../../../lib/basketball-stats'
import { formatDate, formatStat } from '../../../lib/format'
import { getPositionLabel, resolvePlayerPhoto } from '../../../lib/data/utils'
export function PlayerProfile({ player, standalone = false }: { player: RosterPlayer; standalone?: boolean }) {
  const Heading = standalone ? 'h1' : 'h2'
  const StatHeading = standalone ? 'h2' : 'h3'
  const photoSrc = resolvePlayerPhoto(player)
  const hasGames = (player.gamesPlayed ?? 0) > 0
  const seasonStat = (value?: number | null) => hasGames ? formatStat(value) : '—'
  const total = (key: 'fgm' | 'fga' | 'threePm' | 'threePa' | 'ftm' | 'fta') => player[key] ?? completeSum((player.games || []).map(game => game[key]))
  const shootingStats = [
    { label: 'Rzuty z gry (FG%)', made: total('fgm'), attempted: total('fga') },
    { label: 'Rzuty za 3 (3P%)', made: total('threePm'), attempted: total('threePa') },
    { label: 'Rzuty wolne (FT%)', made: total('ftm'), attempted: total('fta') }
  ]


  return (
    <div className="drawer-profile-panel">
      <section className="profile" data-theme="plyta">
        <div className={standalone ? 'container' : undefined}>
          <div className="profile__grid">
            <div className="profile__text">
              {standalone && <nav aria-label="Ścieżka"><ol className="breadcrumbs"><li><Link href="/sklad">Skład</Link></li><li aria-current="page">#{player.number || '—'}</li></ol></nav>}
              <p className="label accent">{getPositionLabel(player.position)} · #{player.number || '—'}</p>
              <Heading><span className="profile__first-name">{player.firstName}</span>{' '}<span className="profile__name">{player.lastName}</span></Heading>
              <p className="muted">{player.seasonLabel || 'Sezon niepotwierdzony'} · Rozegrane mecze: {player.gamesPlayed ?? '—'}</p>
              {player.numberSource === 'brand-fallback' && <p className="muted text-xs">Numer z materiałów klubu; protokół meczu może podawać inny numer.</p>}
              <dl className="statstrip profile__averages">
                <div><dt>Pkt / mecz</dt><dd>{seasonStat(player.ppg)}</dd></div>
                <div><dt>Zb. / mecz</dt><dd>{seasonStat(player.rpg)}</dd></div>
                <div><dt>As. / mecz</dt><dd>{seasonStat(player.apg)}</dd></div>
              </dl>
              {!hasGames && <p className="muted">{player.gamesPlayed === 0 ? 'Statystyki pojawią się po pierwszym występie w sezonie.' : 'Liczba występów w sezonie nie jest potwierdzona.'}</p>}
              <div className="profile-physicals">
                {player.heightCm && <span>Wzrost: <strong>{player.heightCm} cm</strong></span>}
                {player.birthDate && <span>Urodzony: <strong>{player.birthDate}</strong></span>}
              </div>
              {standalone && <ShareActions />}
            </div>
            <div className="profile__media">
              <span className="profile__num" aria-hidden="true">{player.number || '—'}</span>
              {player.photoApproved ? <FallbackImage width={480} height={600} sizes="(min-width: 1024px) 480px, 75vw" loading="eager"
                src={photoSrc} alt={player.photoAlt || ''} className="profile__photo"
                fallback={<img className="profile__monogram" src="/brand/monogram-bialy.svg" width={64} height={64} alt="" />} />
                : <img className="profile__monogram" src="/brand/monogram-bialy.svg" width={64} height={64} alt="" />}
            </div>
          </div>
        </div>
      </section>
      <div className={standalone ? 'container profile__details' : 'profile__details'}>
      {/* Core Stats Overview */}
      <div className="drawer-section-v2">
        <StatHeading className="drawer-section-title">Statystyki sezonu</StatHeading>
        <div className="stats-dashboard-grid">
          <div className="dashboard-stat-box">
            <span
              className={`db-stat-val ${player.plusMinus != null && player.plusMinus > 0 ? 'color-win' : player.plusMinus != null && player.plusMinus < 0 ? 'color-loss' : ''}`}
            >
              {hasGames && player.plusMinus != null
                ? player.plusMinus > 0
                  ? `+${player.plusMinus.toFixed(1)}`
                  : player.plusMinus.toFixed(1)
                : '—'}
            </span>
            <span className="db-stat-label">PLUS / MINUS (ŚR.)</span>
          </div>
        </div>

        <div className="stats-dashboard-summary-row">
          <span>
            Rozegrane mecze: <strong>{player.gamesPlayed ?? '—'}</strong>
          </span>
          {hasGames && player.eval !== null && player.eval !== undefined && (
            <span>
              Średni wskaźnik EVAL:{' '}
              <strong className="highlight-gold">{player.eval.toFixed(1)}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Shooting Percentages */}
      <div className="drawer-section-v2">
        <StatHeading className="drawer-section-title">Skuteczność rzutowa</StatHeading>

        {shootingStats.map(({ label, made, attempted }) => {
          const value = shotPercentage(made, attempted)
          const available = hasGames && value != null
          return (
            <div className="stat-bar-premium" key={label}>
              <div className="sb-label-group">
                <span className="sb-label-text">{label}</span>
                <span className="sb-value-text">{available ? `${formatStat(value)}%` : '—'} · {hasGames ? shotLabel(made, attempted) : '—'} celne/próby</span>
              </div>
              <div className="sb-track-premium" aria-hidden="true">
                <div className="sb-fill-premium" style={{ width: `${available ? Math.max(0, Math.min(100, value ?? 0)) : 0}%` }} />
              </div>
            </div>
          )
        })}

        <div className="advanced-shooting-notes">
          <div className="asn-item" title="Efektywna skuteczność rzutów z gry z uwzględnieniem dodatkowego punktu za celne rzuty za 3">
            Efektywna skuteczność (eFG%):{' '}
            <strong>
              {hasGames && player.eFgPercentage != null ? `${formatStat(player.eFgPercentage)}%` : '—'}
            </strong>
          </div>
          <div className="asn-divider"></div>
          <div className="asn-item" title="Rzeczywista skuteczność uwzględniająca rzuty z gry i rzuty wolne (True Shooting)">
            Rzeczywista skuteczność (TS%):{' '}
            <strong>
              {hasGames && player.tsPercentage != null ? `${formatStat(player.tsPercentage)}%` : '—'}
            </strong>
          </div>
        </div>
        <p className="profile__metrics-explainer muted text-xs">
          <strong>Objaśnienia wskaźników:</strong> EVAL – ogólna efektywność meczowa (suma punktów, zbiórek, asyst, przechwytów i bloków minus straty i niecelne rzuty); eFG% – skuteczność z premią za rzuty z dystansu; TS% – całościowa efektywność punktowa w przeliczeniu na posiadania.
        </p>
      </div>

      {/* Game Log Table */}
      {player.games && player.games.length > 0 && (
        <div className="drawer-section-v2 drawer-section-v2--game-log">
          <StatHeading className="drawer-section-title">Historia występów</StatHeading>
          <p className="profile__table-hint">Przewiń tabelę w bok, aby zobaczyć wszystkie statystyki.</p>
          <div className="table-shell-v2 profile__game-log" tabIndex={0} role="region" aria-label="Historia występów, przewijaj poziomo">
            <table className="data-table-v2 text-sm">
              <caption className="sr-only">Historia występów zawodnika {player.firstName} {player.lastName}</caption>
              <thead>
                <tr>
                  <th>Przeciwnik</th>
                  <th className="text-center">MIN</th>
                  <th className="text-center">
                    <span className="highlight-gold">PTS</span>
                  </th>
                  <th className="text-center">REB</th>
                  <th className="text-center">AST</th>
                  <th className="text-center">STL</th>
                  <th className="text-center">BLK</th>
                  <th className="text-center">+/-</th>
                  <th className="text-center">
                    <span className="highlight-gold">EVAL</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {player.games.map((g, idx) => (
                  <tr key={idx}>
                    <th scope="row">
                      <strong>{g.opponent}</strong>
                      <time className="player-game-date muted" dateTime={g.date}>{formatDate(g.date)}</time>
                    </th>
                    <td className="text-center font-mono">{g.min || '—'}</td>
                    <td className="text-center font-bold font-mono">
                      <span className="highlight-gold">{g.pts}</span>
                    </td>
                    <td className="text-center font-mono">{g.reb}</td>
                    <td className="text-center font-mono">{g.ast}</td>
                    <td className="text-center font-mono">{g.stl ?? '—'}</td>
                    <td className="text-center font-mono">{g.blk ?? '—'}</td>
                    <td
                      className={`text-center font-bold font-mono ${(g.plusMinus || 0) > 0 ? 'color-win' : (g.plusMinus || 0) < 0 ? 'color-loss' : ''}`}
                    >
                      {g.plusMinus !== undefined && g.plusMinus !== null
                        ? g.plusMinus > 0
                          ? `+${g.plusMinus}`
                          : g.plusMinus
                        : '—'}
                    </td>
                    <td className="text-center font-bold font-mono">
                      <span className="highlight-gold">{g.eval ?? '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!standalone && (
        <div style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border)' }}>
          <Link className="btn btn--secondary btn--block" href={`/sklad/${encodeURIComponent(player.id)}`}>
            Otwórz pełny profil zawodnika →
          </Link>
        </div>
      )}
      </div>
    </div>
  )
}
