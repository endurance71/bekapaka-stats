import Link from 'next/link'
import type { GameSummary, NearestHighlight, NewsPost, RosterPlayer, SponsorItem, TeamStanding } from '../../../lib/data'
import { formatDateTime } from '../../../lib/format'
import { NearestEventCard, NearestEventEmpty } from '../home/NearestEventCard'
import { getPositionLabel, resolvePlayerPhoto, hasPlayerPhoto } from '../../../lib/data/utils'
import { ArrowRightIcon } from '../shared/PublicIcons'
import { FsmmSupportSection } from '../support/FsmmSupportSection'

export function MegaHomeTemplate({
  news,
  recentGames,
  nearestEvent,
  table,
  roster,
  sponsors,
}: {
  news: NewsPost[]
  recentGames: GameSummary[]
  nearestEvent?: NearestHighlight | null
  table: TeamStanding[]
  roster: RosterPlayer[]
  sponsors: SponsorItem[]
}) {
  const leadNews = news[0]
  const latestGames = recentGames.slice(0, 3)
  const hasRoster = roster.length > 0
  const pointsLeader = hasRoster ? [...roster].sort((a, b) => (b.ppg || 0) - (a.ppg || 0))[0] : null
  const reboundsLeader = hasRoster ? [...roster].sort((a, b) => (b.rpg || 0) - (a.rpg || 0))[0] : null
  const assistsLeader = hasRoster ? [...roster].sort((a, b) => (b.apg || 0) - (a.apg || 0))[0] : null
  const normalizedSponsors = [...sponsors].sort((a, b) => (a.order || 999) - (b.order || 999))
  const tablePreview = table.slice(0, 5)

  const ourPosition = table.find((row) => row.name.toLowerCase().includes('bekapaka'))

  return (
    <div className='dashboard-home'>
      <section className='dashboard-grid'>
        {/* ROW 1: HERO SECTION (7) & LATEST NEWS (5) */}
        <article className='surface-card dashboard-hero'>
          <div className='hero-grid-bg'></div>
          <div className='hero-content'>
            <p className='section-kicker'>Klub Sportowy</p>
            <h1>
              Pasja. Emocje. <br />
              <span className='highlight-gold'>BeKaPaKa Bobolice</span>
            </h1>
            <p className='hero-description'>
              Oficjalny serwis klubu koszykarskiego z Bobolic. Śledź statystyki zawodników, terminarz rozgrywek oraz bądź na bieżąco z wynikami spotkań.
            </p>
            
            {ourPosition && (
              <div className='hero-stats-row'>
                <div className='hero-stat-badge'>
                  <span className='hero-stat-badge__label'>Pozycja</span>
                  <span className='hero-stat-badge__value'>#{ourPosition.position}</span>
                </div>
                <div className='hero-stat-badge'>
                  <span className='hero-stat-badge__label'>Bilans</span>
                  <span className='hero-stat-badge__value'>{ourPosition.wins} - {ourPosition.losses}</span>
                </div>
              </div>
            )}

            <div className='hero-actions'>
              <Link href='/aktualnosci' className='button button--primary'>
                Aktualności
              </Link>
              <Link href='/mecze' className='button button--ghost'>
                Terminarz
              </Link>
            </div>
          </div>
        </article>

        <article className='surface-card dashboard-news'>
          <div className='section-head'>
            <h2>Najnowsze aktualności</h2>
            <Link href='/aktualnosci'>Zobacz wszystkie</Link>
          </div>
          {leadNews ? (
            <div className='news-feature'>
              {leadNews.coverImageUrl && (
                <div className='news-feature__image-wrap'>
                  <img src={leadNews.coverImageUrl} alt='' />
                </div>
              )}
              <div className='news-feature__content'>
                <span className='news-date'>{formatDateTime(leadNews.publishedAt)}</span>
                <h3>{leadNews.title}</h3>
                <p className='muted'>{leadNews.excerpt || 'Przejdź do wpisu, aby przeczytać pełną treść.'}</p>
                <Link href={`/aktualnosci/${leadNews.slug}`} className='button button--ghost card-action-btn'>
                  Czytaj artykuł
                </Link>
              </div>
            </div>
          ) : (
            <p className='muted'>Brak aktualności do wyświetlenia.</p>
          )}
        </article>

        {/* ROW 2: NEXT MATCH (7) & STAT LEADERS (5) */}
        <article className='surface-card dashboard-next dashboard-next--highlight'>
          <p className='section-kicker'>Najbliższe wydarzenie</p>
          {nearestEvent ? <NearestEventCard highlight={nearestEvent} /> : <NearestEventEmpty />}
        </article>

        <article className='surface-card dashboard-leaders'>
          <p className='section-kicker'>Liderzy zespołu</p>
          <div className='leaders-list-v2'>
            {pointsLeader && (
              <div className='leader-card-v2'>
                <div className='leader-info'>
                  <span className='leader-label'>Punkty</span>
                  <strong className='leader-name'>{pointsLeader.firstName} {pointsLeader.lastName}</strong>
                  <span className='leader-val'>{pointsLeader.ppg?.toFixed(1)} <small>PPG</small></span>
                </div>
                <div className='leader-progress-track'>
                  <div className='leader-progress-fill fill-points' style={{ width: `${Math.min((pointsLeader.ppg || 0) * 4, 100)}%` }}></div>
                </div>
              </div>
            )}

            {reboundsLeader && (
              <div className='leader-card-v2'>
                <div className='leader-info'>
                  <span className='leader-label'>Zbiórki</span>
                  <strong className='leader-name'>{reboundsLeader.firstName} {reboundsLeader.lastName}</strong>
                  <span className='leader-val'>{reboundsLeader.rpg?.toFixed(1)} <small>RPG</small></span>
                </div>
                <div className='leader-progress-track'>
                  <div className='leader-progress-fill fill-rebounds' style={{ width: `${Math.min((reboundsLeader.rpg || 0) * 6, 100)}%` }}></div>
                </div>
              </div>
            )}

            {assistsLeader && (
              <div className='leader-card-v2'>
                <div className='leader-info'>
                  <span className='leader-label'>Asysty</span>
                  <strong className='leader-name'>{assistsLeader.firstName} {assistsLeader.lastName}</strong>
                  <span className='leader-val'>{assistsLeader.apg?.toFixed(1)} <small>APG</small></span>
                </div>
                <div className='leader-progress-track'>
                  <div className='leader-progress-fill fill-assists' style={{ width: `${Math.min((assistsLeader.apg || 0) * 10, 100)}%` }}></div>
                </div>
              </div>
            )}

            {!pointsLeader && <p className='muted'>Brak danych statystycznych.</p>}
          </div>
        </article>

        {/* ROW 3: STANDINGS TABLE (7) & RECENT RESULTS (5) */}
        <article className='surface-card dashboard-table'>
          <div className='section-head'>
            <h2>Tabela ligowa</h2>
            <Link href='/tabela'>Pełna tabela</Link>
          </div>
          <div className='table-shell-v2'>
            <table className='data-table-v2'>
              <thead>
                <tr>
                  <th className='th-pos'>#</th>
                  <th>Drużyna</th>
                  <th className='th-wl'>W - L</th>
                  <th className='th-pts'>PKT</th>
                </tr>
              </thead>
              <tbody>
                {tablePreview.map((row) => {
                  const isBkp = row.name.toLowerCase().includes('bekapaka')
                  return (
                    <tr key={`${row.name}-${row.position}`} className={isBkp ? 'is-highlight-row' : undefined}>
                      <td className='td-pos'>
                        <span className='pos-num'>{row.position}</span>
                      </td>
                      <td className='td-name'>
                        <strong>{row.name}</strong>
                      </td>
                      <td className='td-wl'>{row.wins} - {row.losses}</td>
                      <td className='td-pts'>{row.wins * 2 + row.losses}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className='surface-card dashboard-results'>
          <div className='section-head'>
            <h2>Ostatnie mecze</h2>
            <Link href='/mecze'>Kalendarz</Link>
          </div>
          <div className='stack-list-v2'>
            {latestGames.map((game) => {
              const isWin = game.result === 'W' || (game.scoreUs || 0) > (game.scoreThem || 0)
              return (
                <div key={game.id} className='list-row-v2'>
                  <div className='result-row-left'>
                    <span className={`result-outcome-badge ${isWin ? 'is-win-badge' : 'is-loss-badge'}`}>
                      {isWin ? 'W' : 'L'}
                    </span>
                    <div className='result-opponent-info'>
                      <strong>vs {game.opponent}</strong>
                      <span className='muted'>{formatDateTime(game.date)}</span>
                    </div>
                  </div>
                  <strong className='score-badge-premium'>
                    {game.scoreUs ?? '-'}:{game.scoreThem ?? '-'}
                  </strong>
                </div>
              )
            })}
            {latestGames.length === 0 ? <p className='muted'>Brak rozegranych meczów.</p> : null}
          </div>
        </article>

        {/* ROW 4: JOIN US (6) & BECOME A SPONSOR (6) */}
        <article className='surface-card dashboard-join-us'>
          <p className='section-kicker'>Zbudujmy to razem</p>
          <div className='join-us-section' style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <h3>Dołącz do drużyny</h3>
            <p className='muted'>
              Chcesz trenować w barwach BeKaPaKa? Szukamy talentów z Bobolic i okolic. Przyjdź na otwarty trening!
            </p>
            <a href='mailto:kontakt@damianmotylinski.pl?subject=Gra w druzynie BeKaPaKa' className='button button--ghost join-us-btn-premium button-with-icon' style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>
              Zagraj z nami
              <ArrowRightIcon size={14} />
            </a>
          </div>
        </article>

        <article className='surface-card dashboard-become-sponsor'>
          <p className='section-kicker'>Wspieraj klub</p>
          <div className='join-us-section' style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <h3>Zostań sponsorem</h3>
            <p className='muted'>
              Twój biznes na koszulkach meczowych, grafikach społecznościowych i stronie klubu. Wspieraj lokalny sport!
            </p>
            <a href='mailto:kontakt@damianmotylinski.pl?subject=Wspolpraca sponsorska BeKaPaKa' className='button button--primary join-us-btn-premium button-with-icon' style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>
              Zostań sponsorem
              <ArrowRightIcon size={14} />
            </a>
          </div>
        </article>

        <FsmmSupportSection variant='dashboard' />

        {/* ROW 5: TEAM ROSTER SLIDER (12) - MANUAL SCROLL ONLY */}
        <article className='surface-card dashboard-roster'>
          <div className='section-head'>
            <h2>Skład drużyny</h2>
            <Link href='/sklad'>Wszyscy zawodnicy</Link>
          </div>
          {hasRoster ? (
            <div className='players-slider-wrap-premium'>
              <div className='players-slider-track-premium'>
                {roster.map((player) => {
                  const hasPhoto = hasPlayerPhoto(player);
                  const initials = `${player.firstName[0] || ''}${player.lastName[0] || ''}`.toUpperCase();
                  return (
                    <Link href='/sklad' key={player.id} className='home-player-card-premium-slide'>
                      <div className='home-player-card__image-wrap-premium'>
                        {!hasPhoto ? (
                          <div className='home-player-card__avatar-placeholder-premium'>
                            <span>{initials}</span>
                          </div>
                        ) : (
                          <img
                            src={resolvePlayerPhoto(player)}
                            alt={`${player.firstName} ${player.lastName}`}
                            className='home-player-card__image-premium'
                          />
                        )}
                        <div className='home-player-card__number-badge'>#{player.number}</div>
                      </div>
                      <div className='home-player-card__body-premium'>
                        <strong>{player.firstName} {player.lastName}</strong>
                        <span className='muted-gold'>{getPositionLabel(player.position)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className='muted'>Brak danych składu.</p>
          )}
        </article>

        {/* ROW 6: SPONSORS SLIDER (12) */}
        <article className='surface-card dashboard-sponsors'>
          <div className='section-head'>
            <h2>Sponsorzy</h2>
            <Link href='/sponsorzy'>Wszyscy sponsorzy</Link>
          </div>
          
          <div className='sponsors-slider-wrap-premium'>
            <div className='sponsors-slider-track-premium'>
              {/* Loop 1 */}
              {normalizedSponsors.map((sponsor) => (
                <div key={`s1-${sponsor.id}`} className='sponsor-tile-premium-slide'>
                  {sponsor.logoUrl ? (
                    <img src={sponsor.logoUrl} alt={sponsor.name} className='sponsor-logo-img' />
                  ) : (
                    <span className='sponsor-logo-text'>{sponsor.name}</span>
                  )}
                </div>
              ))}
              {/* Loop 2 (Seamless loop duplication) */}
              {normalizedSponsors.map((sponsor) => (
                <div key={`s2-${sponsor.id}`} className='sponsor-tile-premium-slide'>
                  {sponsor.logoUrl ? (
                    <img src={sponsor.logoUrl} alt={sponsor.name} className='sponsor-logo-img' />
                  ) : (
                    <span className='sponsor-logo-text'>{sponsor.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}
