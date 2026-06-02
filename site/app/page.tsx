import Link from 'next/link'
import {
  getDocuments,
  getEvents,
  getLeagueTable,
  getNewsPosts,
  getRoster,
  getSponsors
} from '../lib/data'

function formatDate(value?: string) {
  if (!value) return 'Brak daty'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default async function HomePage() {
  const [table, roster, news, events, sponsors, documents] = await Promise.all([
    getLeagueTable(),
    getRoster(),
    getNewsPosts(),
    getEvents(),
    getSponsors(),
    getDocuments()
  ])

  const ourPosition = Array.isArray(table)
    ? table.find((row) => String((row.team || row.name || '')).toLowerCase().includes('bekapaka'))
    : null

  return (
    <main>
      <section>
        <h1>BeKaPaKa Bobolice</h1>
        <p>Oficjalna strona klubu: aktualności, wydarzenia, zawodnicy, sponsorzy i dokumenty.</p>
        <Link href='https://panel.bekapaka.pl'>Przejdź do panelu drużyny</Link>
      </section>

      <section>
        <h2>Pozycja w tabeli</h2>
        {ourPosition ? (
          <p>
            Aktualnie zajmujemy miejsce <strong>{String(ourPosition.position || ourPosition.rank || '-')}</strong> z bilansem{' '}
            <strong>{String(ourPosition.wins || 0)}-{String(ourPosition.losses || 0)}</strong>.
          </p>
        ) : (
          <p>Brak danych tabeli do wyświetlenia.</p>
        )}
      </section>

      <section>
        <h2>Zawodnicy</h2>
        <div className='grid'>
          {(roster || []).slice(0, 12).map((player, index) => (
            <article key={String(player.id || index)}>
              <h3>{String(player.firstName || '')} {String(player.lastName || '')}</h3>
              <p>Pozycja: {String(player.position || 'Brak')}</p>
              <p>Numer: {String(player.number || '-')}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Aktualności</h2>
        <div className='grid'>
          {news.map((item, index) => (
            <article key={String(item.id || index)}>
              <h3>{String(item.title || 'Bez tytułu')}</h3>
              <p>{String(item.excerpt || item.description || 'Brak opisu')}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Nadchodzące wydarzenia</h2>
        {events.length === 0 ? (
          <p>Brak nadchodzących wydarzeń.</p>
        ) : (
          events.map((event, index) => (
            <article key={String(event.id || index)}>
              <span className='pill'>{String(event.type || 'Wydarzenie')}</span>
              <h3>{String(event.title || event.name || 'Bez tytułu')}</h3>
              <p>{formatDate(event.startAt)}</p>
              <p>{String(event.description || 'Brak opisu')}</p>
            </article>
          ))
        )}
      </section>

      <section>
        <h2>Sponsorzy</h2>
        <div className='grid'>
          {sponsors.map((sponsor, index) => (
            <article key={String(sponsor.id || index)}>
              <h3>{String(sponsor.name || 'Sponsor')}</h3>
              {sponsor.websiteUrl ? (
                <a href={String(sponsor.websiteUrl)} target='_blank' rel='noreferrer'>
                  Strona sponsora
                </a>
              ) : (
                <p>Link nie został podany</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Regulaminy i dokumenty</h2>
        {documents.length === 0 ? (
          <p>Brak dokumentów.</p>
        ) : (
          <ul>
            {documents.map((doc, index) => (
              <li key={String(doc.id || index)}>
                {String(doc.title || 'Dokument')} ({formatDate(doc.effectiveDate)})
                {doc.fileUrl ? (
                  <>
                    {' '}
                    - <a href={String(doc.fileUrl)} target='_blank' rel='noreferrer'>Pobierz</a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
