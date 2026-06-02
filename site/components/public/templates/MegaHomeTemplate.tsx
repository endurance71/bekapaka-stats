import Link from 'next/link'
import type { DocumentItem, EventItem, NewsPost, RosterPlayer, SponsorItem, TeamStanding } from '../../../lib/data'
import { formatDateTime } from '../../../lib/format'

const fallbackPlayers = [
  {
    firstName: 'Jan',
    lastName: 'Kowalski',
    position: 'Rozgrywajacy',
    number: '07',
    imageUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=600&auto=format&fit=crop'
  },
  {
    firstName: 'Michal',
    lastName: 'Nowak',
    position: 'Rzucajacy',
    number: '13',
    imageUrl: 'https://images.unsplash.com/photo-1627627256672-027a461b6932?q=80&w=600&auto=format&fit=crop'
  },
  {
    firstName: 'Piotr',
    lastName: 'Zielinski',
    position: 'Srodkowy',
    number: '15',
    imageUrl: 'https://images.unsplash.com/photo-1508344928928-7151b67de15e?q=80&w=600&auto=format&fit=crop'
  }
]

function getDisplayPlayer(roster: RosterPlayer[], index: number) {
  const fallback = fallbackPlayers[index]
  const real = roster[index]
  if (!real) return fallback
  return {
    firstName: real.firstName || fallback.firstName,
    lastName: real.lastName || fallback.lastName,
    position: real.position || fallback.position,
    number: real.number || fallback.number,
    imageUrl: fallback.imageUrl
  }
}

export function MegaHomeTemplate({
  news,
  events,
  table,
  roster,
  sponsors,
  documents
}: {
  news: NewsPost[]
  events: EventItem[]
  table: TeamStanding[]
  roster: RosterPlayer[]
  sponsors: SponsorItem[]
  documents: DocumentItem[]
}) {
  const leadNews = news[0]
  const p1 = getDisplayPlayer(roster, 0)
  const p2 = getDisplayPlayer(roster, 1)
  const mvp = getDisplayPlayer(roster, 2)
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
            <h2>{leadNews?.title || 'BeKaPaKa rozbija rywali w derbach powiatu'}</h2>
            <p>{leadNews?.excerpt || 'Niesamowita skutecznosc zza luku i zelazna obrona zapewnily kolejne zwyciestwo.'}</p>
            <Link href={leadNews ? `/aktualnosci/${leadNews.slug}` : '/aktualnosci'}>Czytaj artykul</Link>
          </div>
        </article>

        {[p1, p2].map((player) => (
          <article key={`${player.firstName}-${player.lastName}`} className='mega-card mega-card--delay-3 mega-player'>
            <img src={player.imageUrl} alt={`${player.firstName} ${player.lastName}`} className='mega-bg-image' />
            <div className='mega-overlay' />
            <div className='mega-content'>
              <span className='mega-chip'>{player.position}</span>
              <h3>{player.firstName}<br />{player.lastName}</h3>
              <p>#{player.number}</p>
            </div>
          </article>
        ))}

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
            <h3>{nextMatch?.title || 'BKP vs Morsy'}</h3>
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
              {events.slice(0, 3).map((event) => (
                <div key={event.id} className='mega-results-item'>
                  <span>{event.title}</span>
                  <span>{event.type}</span>
                </div>
              ))}
              {events.length === 0 ? <p className='mega-empty'>Brak rozegranych meczow.</p> : null}
            </div>
          </div>
        </article>

        <article className='mega-card mega-card--delay-9 mega-mvp'>
          <img src={mvp.imageUrl} alt='MVP miesiaca' className='mega-bg-image' />
          <div className='mega-overlay' />
          <div className='mega-content'>
            <span className='mega-pill'>MVP miesiaca</span>
            <h3>{mvp.firstName} {mvp.lastName}</h3>
            <p>{mvp.position}</p>
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
