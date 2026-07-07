import Link from 'next/link'
import type {
  EventItem,
  HomepageSection,
  NewsPost,
  RosterPlayer,
  SponsorItem,
  TeamStanding
} from '../lib/data'
import { formatDateTime } from '../lib/format'

type BentoTileProps = {
  size?: 'S' | 'M' | 'L' | 'XL'
  accent?: 'gold' | 'crimson' | 'slate' | 'none'
  className?: string
  children: React.ReactNode
}

export function BentoGrid({ children }: { children: React.ReactNode }) {
  return <div className='bento-grid'>{children}</div>
}

export function BentoTile({ size = 'M', accent = 'none', className = '', children }: BentoTileProps) {
  return (
    <article className={`bento-tile bento-tile--${size.toLowerCase()} bento-accent--${accent} ${className}`.trim()}>
      {children}
    </article>
  )
}

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
          </span>
        </Link>
        <nav aria-label='Nawigacja glowna'>
          <ul className='main-nav'>
            <li><Link href='/aktualnosci'>Aktualnosci</Link></li>
            <li><Link href='/mecze'>Mecze</Link></li>
            <li><Link href='/tabela'>Tabela</Link></li>
            <li><Link href='/sklad'>Sklad</Link></li>
            <li><Link href='/sponsorzy'>Sponsorzy</Link></li>
            <li><Link href='/klub'>Klub</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export function HeroSection({ teamStanding }: { teamStanding?: TeamStanding }) {
  return (
    <BentoTile size='XL' accent='gold' className='hero dashboard-hero'>
      <div
        className='hero-photo-bg'
        aria-hidden='true'
        style={{ backgroundImage: "url('/images/hero-basketball.jpg')" }}
      />
      <div className='hero-grid-bg' aria-hidden='true' />
      <div className='hero-content'>
        <p className='eyebrow'>Sezon 2026 / BeKaPaKa Bobolice</p>
        <h1>Nowoczesna koszykowka. Lokalna duma Bobolic.</h1>
        <p>
          Oficjalna strona klubu w wydaniu premium: aktualnosci, wydarzenia, tabela, sklad i strefa sponsorow.
        </p>
        <div className='hero__meta'>
          <span className='hero-badge'>Liga amatorska</span>
          <span className='hero-badge'>System Bento 2026</span>
          <span className='hero-badge'>Mobile first</span>
        </div>
        {teamStanding ? (
          <p className='hero__position'>
            Aktualna pozycja: <strong>#{teamStanding.position}</strong> | Bilans: <strong>{teamStanding.wins}-{teamStanding.losses}</strong>
          </p>
        ) : null}
        <div className='hero__actions hero-actions'>
          <a className='button button--primary' href='https://panel.bekapaka.pl'>
            Przejdz do panelu druzyny
          </a>
          <Link className='button button--ghost' href='/aktualnosci'>
            Zobacz aktualnosci
          </Link>
        </div>
      </div>
    </BentoTile>
  )
}

export function HomepageCmsSectionsTile({ sections }: { sections: HomepageSection[] }) {
  if (sections.length === 0) return null

  return (
    <BentoTile size='L' accent='slate'>
      <h2>Sekcje klubowe</h2>
      <div className='card-grid'>
        {sections.slice(0, 4).map((section) => (
          <article key={section.id} className='content-card'>
            <h3>{section.title}</h3>
            {section.subtitle ? <p className='muted'>{section.subtitle}</p> : null}
            {section.body ? <p style={{ whiteSpace: 'pre-wrap' }}>{section.body}</p> : null}
          </article>
        ))}
      </div>
    </BentoTile>
  )
}

export function NewsTile({ news }: { news: NewsPost[] }) {
  const featured = news[0]
  const rest = news.slice(1, 4)

  return (
    <BentoTile size='L' accent='none'>
      <div className='section-head'>
        <h2>Aktualnosci</h2>
        <Link href='/aktualnosci'>Zobacz wszystkie</Link>
      </div>
      <div className='news-editorial'>
        {featured ? (
          <article className='content-card news-featured' key={featured.id}>
            <p className='eyebrow'>Wyróżnione</p>
            <h3>{featured.title}</h3>
            <p>{featured.excerpt || 'Brak opisu.'}</p>
            <p className='muted'>{formatDateTime(featured.publishedAt)}</p>
          </article>
        ) : (
          <article className='content-card news-featured news-empty'>
            <h3>Redakcja przygotowuje nowe materiały</h3>
            <p>Dodaj pierwszą aktualność w CMS, aby wypełnić sekcję główną.</p>
          </article>
        )}
        <div className='stack-list'>
          {rest.map((item) => (
            <article key={item.id} className='content-card content-card--compact'>
              <h3>{item.title}</h3>
              <p>{item.excerpt || 'Brak opisu.'}</p>
              <p className='muted'>{formatDateTime(item.publishedAt)}</p>
            </article>
          ))}
        </div>
      </div>
    </BentoTile>
  )
}

export function EventsTile({ events }: { events: EventItem[] }) {
  return (
    <BentoTile size='M' accent='crimson'>
      <div className='section-head'>
        <h2>Nadchodzace mecze</h2>
        <Link href='/mecze'>Kalendarz</Link>
      </div>
      <div className='stack-list'>
        {events.length === 0 ? (
          <article className='content-card news-empty'>
            <h3>Brak nadchodzących wydarzeń</h3>
            <p>Uzupełnij sekcję wydarzeń w CMS, aby pojawił się kalendarz meczowy.</p>
          </article>
        ) : (
          events.map((event) => (
            <article key={event.id} className='list-row'>
              <span className='pill'>{event.type}</span>
              <div>
                <h3>{event.title}</h3>
                <p className='muted'>{formatDateTime(event.startAt)}{event.location ? ` | ${event.location}` : ''}</p>
                {event.description ? <p style={{ whiteSpace: 'pre-wrap' }}>{event.description}</p> : null}
              </div>
            </article>
          ))
        )}
      </div>
    </BentoTile>
  )
}

export function StandingTile({ teamStanding }: { teamStanding?: TeamStanding }) {
  return (
    <BentoTile size='S' accent='gold' className='standing-tile'>
      <p className='eyebrow'>Tabela ligi</p>
      <h2>Pozycja BeKaPaKa</h2>
      {teamStanding ? (
        <>
          <p className='standing-tile__rank'>#{teamStanding.position}</p>
          <p>Bilans: <strong>{teamStanding.wins}-{teamStanding.losses}</strong></p>
        </>
      ) : (
        <p>Brak danych tabeli.</p>
      )}
      <Link href='/tabela'>Pelna tabela</Link>
    </BentoTile>
  )
}

export function RosterTile({ roster }: { roster: RosterPlayer[] }) {
  return (
    <BentoTile size='M' accent='slate'>
      <div className='section-head'>
        <h2>Sklad druzyny</h2>
        <Link href='/sklad'>Pelny sklad</Link>
      </div>
      <div className='card-grid'>
        {roster.slice(0, 6).map((player, index) => (
          <article key={player.id} className='content-card content-card--compact'>
            <span className='player-chip'>{index + 1}</span>
            <h3>{player.firstName} {player.lastName}</h3>
            <p>Pozycja: {player.position}</p>
            <p>Numer: {player.number}</p>
          </article>
        ))}
      </div>
    </BentoTile>
  )
}

export function SponsorsTile({ sponsors }: { sponsors: SponsorItem[] }) {
  return (
    <BentoTile size='M' accent='none' className='sponsors'>
      <div className='section-head'>
        <h2>Sponsorzy</h2>
        <Link href='/sponsorzy'>Pelna lista</Link>
      </div>
      <div className='card-grid'>
        {sponsors.slice(0, 6).map((sponsor) => (
          <article key={sponsor.id} className='content-card sponsor-card content-card--compact'>
            <span className='sponsor-mark' aria-hidden='true'>
              {sponsor.name.slice(0, 2).toUpperCase()}
            </span>
            <h3>{sponsor.name}</h3>
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
    </BentoTile>
  )
}



export function SponsorsStrip({ sponsors }: { sponsors: SponsorItem[] }) {
  if (sponsors.length === 0) return null

  return (
    <section className='sponsors-strip' aria-label='Strefa sponsorow'>
      <div className='container'>
        <p className='eyebrow'>Sponsorzy</p>
        <div className='sponsors-strip__grid'>
          {sponsors.slice(0, 12).map((sponsor) => (
            <div key={sponsor.id} className='sponsor-chip'>
              {sponsor.name}
            </div>
          ))}
        </div>
      </div>
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

export function Breadcrumbs({
  items
}: {
  items: Array<{ label: string; href?: string }>
}) {
  return (
    <nav aria-label='Breadcrumb' className='breadcrumbs'>
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function SiteFooter() {
  return (
    <footer className='site-footer'>
      <div className='container site-footer__inner'>
        <p>© 2026 by MT HUB Damian Motyliński</p>
        <a href='mailto:kontakt@damianmotylinski.pl'>kontakt@damianmotylinski.pl</a>
      </div>
    </footer>
  )
}
