import Link from 'next/link'
import type { DocumentItem, EventItem, GameSummary, NewsPost, RosterPlayer, SponsorItem, TeamStanding } from '../../../lib/data'
import { formatDateTime } from '../../../lib/format'
import { resolvePlayerPhoto, getPositionLabel } from '../../../lib/data/utils'

export function MegaHomeTemplate({
  news,
  recentGames,
  events,
  table,
  roster,
  sponsors,
  documents
}: {
  news: NewsPost[]
  recentGames: GameSummary[]
  events: EventItem[]
  table: TeamStanding[]
  roster: RosterPlayer[]
  sponsors: SponsorItem[]
  documents: DocumentItem[]
}) {
  const leadNews = news[0]
  const topPlayers = roster.slice(0, 2)
  const mvp = roster.length > 0 ? [...roster].sort((a, b) => (b.eval || 0) - (a.eval || 0))[0] : null
  const nextMatch = events[0]
  const topTable = table.slice(0, 5)
  const docs = documents.slice(0, 3)

  const hasRoster = roster && roster.length > 0
  const pointsLeader = hasRoster ? [...roster].sort((a, b) => (b.ppg || 0) - (a.ppg || 0))[0] : null
  const reboundsLeader = hasRoster ? [...roster].sort((a, b) => (b.rpg || 0) - (a.rpg || 0))[0] : null
  const assistsLeader = hasRoster ? [...roster].sort((a, b) => (b.apg || 0) - (a.apg || 0))[0] : null

  return (
    <div className='mega-home'>
      <section className='mega-grid'>
        <article className='mega-card mega-card--delay-1 mega-hero'>
          <img
            src='https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1200&auto=format&fit=crop'
            alt='Parkiet koszykarski'
            className='mega-bg-image'
          />
          <div className='mega-overlay' />
          <div className='mega-content'>
            <span className='mega-pill'>Oficjalny Portal</span>
            <h1>
              BEKAPAKA
              <br />
              <span>BOBOLICE</span>
            </h1>
            <p>
              Amatorska druzyna koszykowki. Nasza gra opiera sie na twardej defensywie, nieustepliwosci i zelaznej
              dyscyplinie taktycznej.
            </p>
          </div>
        </article>

        <article className='mega-card mega-card--delay-2 mega-news'>
          <img
            src={leadNews?.coverImageUrl || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1000&auto=format&fit=crop'}
            alt='Aktualnosc'
            className='mega-bg-image'
          />
          <div className='mega-overlay' />
          <div className='mega-content'>
            <span className='mega-pill mega-pill--red'>Najnowsze</span>
            <h2>{leadNews?.title || 'Brak aktualnosci do wyswietlenia'}</h2>
            <p>{leadNews?.excerpt || 'Po dodaniu wpisow w CMS ta sekcja pokaze najnowszy artykul.'}</p>
            <Link href={leadNews ? `/aktualnosci/${leadNews.slug}` : '/aktualnosci'}>Czytaj artykul</Link>
          </div>
        </article>

        {topPlayers.map((player) => (
          <article key={player.id} className='mega-card mega-card--delay-3 mega-player'>
            <img src={resolvePlayerPhoto(player)} alt={`${player.firstName} ${player.lastName}`} className='mega-bg-image' />
            <div className='mega-overlay' />
            <div className='mega-content'>
              <span className='mega-chip'>{getPositionLabel(player.position)}</span>
              <h3>{player.firstName}<br />{player.lastName}</h3>
              <p>#{player.number}</p>
            </div>
          </article>
        ))}
        {topPlayers.length === 0 ? (
          <article className='mega-card mega-card--delay-3 mega-player'>
            <div className='mega-overlay' />
            <div className='mega-content'>
              <span className='mega-chip'>Sklad</span>
              <h3>Brak danych skladu</h3>
              <p className='mega-empty'>Backend nie zwrocil listy zawodnikow.</p>
            </div>
          </article>
        ) : null}
        {topPlayers.length < 2 ? (
          <article className='mega-card mega-card--delay-3 mega-player'>
            <div className='mega-overlay' />
            <div className='mega-content'>
              <span className='mega-chip'>Sklad</span>
              <h3>Brak danych skladu</h3>
              <p className='mega-empty'>Brakuje drugiego zawodnika do sekcji hero.</p>
            </div>
          </article>
        ) : null}

        <article className='mega-card mega-card--delay-4 mega-table'>
          <div className='mega-content'>
            <div className='mega-row-head'>
              <h3>Tabela ligowa</h3>
              <Link href='/tabela'>Pelna tabela</Link>
            </div>
            <div className='mega-table-head'>
              <span>#</span><span>Druzyna</span><span>W-L</span><span>Pkt</span>
            </div>
            <div className='mega-table-body'>
              {topTable.length > 0 ? topTable.map((row) => {
                const isBkp = row.name.toLowerCase().includes('bekapaka')
                return (
                  <div key={`${row.name}-${row.position}`} className={`mega-table-row ${isBkp ? 'is-bkp' : ''}`}>
                    <span>{row.position}</span>
                    <span>{row.name}</span>
                    <span>{row.wins}-{row.losses}</span>
                    <span>{row.wins * 2 + row.losses}</span>
                  </div>
                )
              }) : <p className='mega-empty'>Brak danych tabeli.</p>}
            </div>
          </div>
        </article>

        <article className='mega-card mega-card--delay-5 mega-next-match'>
          <div className='mega-content'>
            <span className='mega-pill'>Najblizszy mecz</span>
            <h3>{nextMatch?.title || 'Brak zaplanowanego meczu'}</h3>
            <p>{nextMatch ? formatDateTime(nextMatch.startAt) : 'Data zostanie opublikowana'}</p>
            <Link href={nextMatch ? `/mecze/${nextMatch.slug}` : '/mecze'}>Szczegoly</Link>
          </div>
        </article>

        <article className='mega-card mega-card--delay-6 mega-sponsors'>
          <div className='mega-content'>
            <h3>Partnerzy</h3>
            <div className='mega-sponsor-list'>
              {sponsors.slice(0, 4).map((sponsor) => (
                <div key={sponsor.id} className='mega-sponsor-item'>
                  {sponsor.logoUrl ? <img src={sponsor.logoUrl} alt={sponsor.name} /> : <span>{sponsor.name}</span>}
                </div>
              ))}
            </div>
            <Link href='/sponsorzy'>Wszyscy sponsorzy</Link>
          </div>
        </article>

        <article className='mega-card mega-card--delay-7 mega-video'>
          <div className='mega-content' style={{ height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', textTransform: 'uppercase', fontFamily: 'var(--font-bebas-neue), sans-serif', letterSpacing: '0.04em' }}>
                Liderzy statystyk
              </h3>
              <span className='mega-pill'>Sezon 2026</span>
            </div>
            
            {hasRoster ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', flex: 1, marginTop: '10px' }}>
                {/* Points Leader */}
                {pointsLeader && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '10px 5px' }}>
                    <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid var(--bkp-gold)', background: '#141822', marginBottom: '8px' }}>
                      <img src={resolvePlayerPhoto(pointsLeader)} alt={`${pointsLeader.firstName} ${pointsLeader.lastName}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pointsLeader.lastName}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Punkty</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--bkp-gold)', marginTop: '2px' }}>{pointsLeader.ppg?.toFixed(1)} PPG</strong>
                  </div>
                )}

                {/* Rebounds Leader */}
                {reboundsLeader && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '10px 5px' }}>
                    <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid var(--text-main)', background: '#141822', marginBottom: '8px' }}>
                      <img src={resolvePlayerPhoto(reboundsLeader)} alt={`${reboundsLeader.firstName} ${reboundsLeader.lastName}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {reboundsLeader.lastName}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Zbiórki</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-main)', marginTop: '2px' }}>{reboundsLeader.rpg?.toFixed(1)} RPG</strong>
                  </div>
                )}

                {/* Assists Leader */}
                {assistsLeader && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '10px 5px' }}>
                    <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid var(--text-main)', background: '#141822', marginBottom: '8px' }}>
                      <img src={resolvePlayerPhoto(assistsLeader)} alt={`${assistsLeader.firstName} ${assistsLeader.lastName}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {assistsLeader.lastName}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asysty</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-main)', marginTop: '2px' }}>{assistsLeader.apg?.toFixed(1)} APG</strong>
                  </div>
                )}
              </div>
            ) : (
              <p className='mega-empty'>Brak danych liderów.</p>
            )}
          </div>
        </article>

        <article className='mega-card mega-card--delay-8 mega-results'>
          <div className='mega-content'>
            <h3>Ostatnie mecze</h3>
            <div className='mega-results-list' style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {recentGames.slice(0, 3).map((game) => {
                const isWin = game.result === 'W' || (game.scoreUs || 0) > (game.scoreThem || 0)
                return (
                  <div
                    key={game.id}
                    className='mega-results-item'
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.03)',
                      borderRadius: '10px',
                      padding: '8px 12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isWin ? '#10b981' : '#ef4444',
                          display: 'inline-block'
                        }}
                      />
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{game.opponent}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '1.25rem', color: 'var(--text-main)' }}>
                      {game.scoreUs} - {game.scoreThem}
                    </span>
                  </div>
                )
              })}
              {recentGames.length === 0 ? <p className='mega-empty'>Brak rozegranych meczów.</p> : null}
            </div>
          </div>
        </article>

        <article className='mega-card mega-card--delay-9 mega-mvp'>
          {mvp ? <img src={resolvePlayerPhoto(mvp)} alt='MVP miesiąca' className='mega-bg-image' /> : null}
          <div className='mega-overlay' />
          <div className='mega-content'>
            <span className='mega-pill'>Lider zespołu (MVP)</span>
            <h3 style={{ fontSize: '1.8rem', lineHeight: '1.1', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{mvp ? `${mvp.firstName} ${mvp.lastName}` : 'Brak danych MVP'}</h3>
            <p style={{ margin: '2px 0 6px 0' }}>{mvp ? `#${mvp.number} · ${getPositionLabel(mvp.position)}` : 'Dodaj dane składu'}</p>
            {mvp && mvp.ppg !== undefined && (
              <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', marginTop: 'auto' }}>
                <span className='mega-pill' style={{ background: 'rgba(0,0,0,0.6)', borderColor: 'rgba(236,167,44,0.3)', color: 'var(--bkp-gold)', textTransform: 'none', fontWeight: 'bold' }}>
                  {mvp.ppg.toFixed(1)} PPG
                </span>
                <span className='mega-pill' style={{ background: 'rgba(0,0,0,0.6)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-main)', textTransform: 'none' }}>
                  EVAL {mvp.eval?.toFixed(1) || '0.0'}
                </span>
              </div>
            )}
          </div>
        </article>

        <article className='mega-card mega-card--delay-10 mega-newsletter'>
          <div className='mega-content'>
            <h3>Strefa kibica BKP</h3>
            <p>Dolacz do newslettera. Znizki na merch i bilety.</p>
            <div className='mega-newsletter-form'>
              <input type='email' placeholder='Twoj adres e-mail' />
              <button type='button'>Dolacz</button>
            </div>
          </div>
        </article>

        <article className='mega-card mega-card--delay-10 mega-docs'>
          <div className='mega-content'>
            <h3>Dokumenty klubowe</h3>
            <div className='mega-docs-list'>
              {docs.map((doc) => (
                <Link key={doc.id} href={`/dokumenty/${doc.slug}`}>{doc.title}</Link>
              ))}
              {docs.length === 0 ? <p className='mega-empty'>Brak dokumentow.</p> : null}
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}
