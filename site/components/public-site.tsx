import Link from 'next/link'
import type {
  DocumentItem,
  EventItem,
  HomepageSection,
  NewsPost,
  RosterPlayer,
  SponsorItem,
  TeamStanding
} from '../lib/data'
import { formatDate, formatDateTime } from '../lib/format'

export function SiteHeader() {
  return (
    <header className='site-header'>
      <div className='container site-header__inner'>
        <Link href='/' className='brand-mark' aria-label='Strona glowna BeKaPaKa Bobolice'>
          <span className='brand-mark__badge' aria-hidden='true'>
            BKP
          </span>
          <span>
            <strong>BeKaPaKa Bobolice</strong>
            <small>Koszykowka amatorska</small>
          </span>
        </Link>
        <nav aria-label='Nawigacja glowna'>
          <ul className='main-nav'>
            <li><Link href='/aktualnosci'>Aktualnosci</Link></li>
            <li><Link href='/wydarzenia'>Wydarzenia</Link></li>
            <li><Link href='/sponsorzy'>Sponsorzy</Link></li>
            <li><Link href='/dokumenty'>Dokumenty</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export function HeroSection({ teamStanding }: { teamStanding?: TeamStanding }) {
  return (
    <section className='hero section-card'>
      <p className='eyebrow'>Sezon 2026</p>
      <h1>Nowoczesna koszykowka. Lokalna duma Bobolic.</h1>
      <p>
        Oficjalna strona BeKaPaKa: aktualnosci, wydarzenia klubowe, sklad druzyny i strefa sponsorow.
      </p>
      {teamStanding ? (
        <p className='hero__position'>
          Aktualna pozycja: <strong>#{teamStanding.position}</strong> | Bilans: <strong>{teamStanding.wins}-{teamStanding.losses}</strong>
        </p>
      ) : null}
      <div className='hero__actions'>
        <a className='button button--primary' href='https://panel.bekapaka.pl'>
          Przejdz do panelu druzyny
        </a>
        <Link className='button button--ghost' href='/aktualnosci'>
          Zobacz aktualnosci
        </Link>
      </div>
    </section>
  )
}

export function HomepageCmsSections({ sections }: { sections: HomepageSection[] }) {
  if (sections.length === 0) return null

  return (
    <section className='section-card'>
      <h2>Sekcje klubowe</h2>
      <div className='card-grid'>
        {sections.slice(0, 4).map((section) => (
          <article key={section.id} className='content-card'>
            <h3>{section.title}</h3>
            {section.subtitle ? <p className='muted'>{section.subtitle}</p> : null}
            {section.body ? <p>{section.body}</p> : null}
          </article>
        ))}
      </div>
    </section>
  )
}

export function NewsSection({ news }: { news: NewsPost[] }) {
  return (
    <section className='section-card'>
      <div className='section-head'>
        <h2>Aktualnosci</h2>
        <Link href='/aktualnosci'>Zobacz wszystkie</Link>
      </div>
      <div className='card-grid'>
        {news.map((item) => (
          <article key={item.id} className='content-card'>
            <h3>{item.title}</h3>
            <p>{item.excerpt || 'Brak opisu.'}</p>
            <p className='muted'>{formatDateTime(item.publishedAt)}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function EventsSection({ events }: { events: EventItem[] }) {
  return (
    <section className='section-card'>
      <div className='section-head'>
        <h2>Nadchodzace wydarzenia</h2>
        <Link href='/wydarzenia'>Kalendarz</Link>
      </div>
      <div className='stack-list'>
        {events.length === 0 ? (
          <p>Brak nadchodzacych wydarzen.</p>
        ) : (
          events.map((event) => (
            <article key={event.id} className='list-row'>
              <span className='pill'>{event.type}</span>
              <div>
                <h3>{event.title}</h3>
                <p className='muted'>{formatDateTime(event.startAt)}{event.location ? ` | ${event.location}` : ''}</p>
                {event.description ? <p>{event.description}</p> : null}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

export function RosterPreview({ roster }: { roster: RosterPlayer[] }) {
  return (
    <section className='section-card'>
      <h2>Sklad druzyny</h2>
      <div className='card-grid'>
        {roster.slice(0, 12).map((player) => (
          <article key={player.id} className='content-card'>
            <h3>{player.firstName} {player.lastName}</h3>
            <p>Pozycja: {player.position}</p>
            <p>Numer: {player.number}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function SponsorsSection({ sponsors }: { sponsors: SponsorItem[] }) {
  return (
    <section className='section-card sponsors'>
      <div className='section-head'>
        <h2>Partnerzy i sponsorzy</h2>
        <Link href='/sponsorzy'>Pelna lista</Link>
      </div>
      <div className='card-grid'>
        {sponsors.map((sponsor) => (
          <article key={sponsor.id} className='content-card sponsor-card'>
            <h3>{sponsor.name}</h3>
            <p className='muted'>{sponsor.tier}</p>
            {sponsor.websiteUrl ? (
              <a href={sponsor.websiteUrl} target='_blank' rel='noreferrer'>
                Strona sponsora
              </a>
            ) : (
              <p>Link nie zostal podany.</p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export function DocumentsSection({ documents }: { documents: DocumentItem[] }) {
  return (
    <section className='section-card'>
      <div className='section-head'>
        <h2>Dokumenty</h2>
        <Link href='/dokumenty'>Wszystkie dokumenty</Link>
      </div>
      <ul className='documents-list'>
        {documents.slice(0, 8).map((document) => (
          <li key={document.id}>
            <div>
              <strong>{document.title}</strong>
              <p className='muted'>{document.category} | {formatDate(document.effectiveDate)}</p>
            </div>
            {document.fileUrl ? (
              <a href={document.fileUrl} target='_blank' rel='noreferrer'>
                Pobierz
              </a>
            ) : (
              <span className='muted'>Brak pliku</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className='page-header'>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className='site-footer'>
      <div className='container site-footer__inner'>
        <p>© {new Date().getFullYear()} BeKaPaKa Bobolice</p>
        <a href='mailto:kontakt@bekapaka.pl'>kontakt@bekapaka.pl</a>
      </div>
    </footer>
  )
}
