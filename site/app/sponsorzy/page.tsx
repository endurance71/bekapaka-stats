import type { Metadata } from 'next'
import { PageHeader } from '../../components/public-site'
import { getSiteMetadataBase, getSponsors } from '../../lib/data'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Sponsorzy | BeKaPaKa Bobolice',
  description: 'Poznaj partnerow i sponsorow wspierajacych BeKaPaKa Bobolice.'
}

export default async function SponsorsPage() {
  const sponsors = await getSponsors(60)

  return (
    <section className='section-card'>
      <PageHeader title='Sponsorzy i partnerzy' description='Dziekujemy firmom i osobom wspierajacym rozwoj klubu.' />
      <div className='card-grid'>
        {sponsors.map((sponsor) => (
          <article key={sponsor.id} className='content-card sponsor-card'>
            <h2>{sponsor.name}</h2>
            <p className='muted'>Poziom wsparcia: {sponsor.tier}</p>
            {sponsor.websiteUrl ? (
              <a href={sponsor.websiteUrl} target='_blank' rel='noreferrer'>
                Odwiedz strone partnera
              </a>
            ) : (
              <p>Brak adresu strony.</p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
