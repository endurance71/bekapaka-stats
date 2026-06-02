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
  const mvp = roster[2]
  const nextMatch = events[0]
  const topTable = table.slice(0, 5)
  const docs = documents.slice(0, 3)

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
          <img
            src='https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=1000&auto=format&fit=crop'
            alt='Akcja tygodnia'
            className='mega-bg-image'
          />
          <div className='mega-overlay' />
          <div className='mega-content'>
            <span className='mega-pill mega-pill--red'>Wideo</span>
            <h3>Akcja tygodnia: potezny dunk</h3>
          </div>
        </article>

        <article className='mega-card mega-card--delay-8 mega-results'>
          <div className='mega-content'>
            <h3>Ostatnie mecze</h3>
            <div className='mega-results-list'>
              {recentGames.slice(0, 3).map((game) => (
                <div key={game.id} className='mega-results-item'>
                  <span>{game.opponent}</span>
                  <span>{game.scoreUs} - {game.scoreThem} ({game.result})</span>
                </div>
              ))}
              {recentGames.length === 0 ? <p className='mega-empty'>Brak rozegranych meczow.</p> : null}
            </div>
          </div>
        </article>

        <article className='mega-card mega-card--delay-9 mega-mvp'>
          {mvp ? <img src={resolvePlayerPhoto(mvp)} alt='MVP miesiaca' className='mega-bg-image' /> : null}
          <div className='mega-overlay' />
          <div className='mega-content'>
            <span className='mega-pill'>MVP miesiaca</span>
            <h3>{mvp ? `${mvp.firstName} ${mvp.lastName}` : 'Brak danych MVP'}</h3>
            <p>{mvp ? `#${mvp.number} · ${getPositionLabel(mvp.position)}` : 'Dodaj dane skladu, aby wyznaczyc MVP'}</p>
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
