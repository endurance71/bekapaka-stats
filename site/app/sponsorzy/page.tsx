import type { Metadata } from 'next'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { getSiteMetadataBase, getSponsorsState } from '../../lib/data'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Sponsorzy | BeKaPaKa Bobolice',
  description: 'Poznaj partnerow i sponsorow wspierajacych BeKaPaKa Bobolice.'
}

export default async function SponsorsPage() {
  const sponsorsState = await getSponsorsState(60)
  const sponsors = sponsorsState.data

  return (
    <EditorialListingTemplate
      title='Sponsorzy i partnerzy'
      description='Dziekujemy firmom i osobom wspierajacym rozwoj klubu.'
      hasItems={sponsors.length > 0}
      emptyTitle={sponsorsState.status === 'error' ? 'Nie mozna pobrac sponsorow' : 'Brak sponsorow'}
      emptyDescription={
        sponsorsState.status === 'error'
          ? 'Sprawdz polaczenie z CMS lub token dostepu.'
          : 'Po uzupelnieniu sekcji sponsorow w CMS dane pojawia sie automatycznie.'
      }
    >
      <div className='card-grid'>
        {sponsors.map((sponsor) => (
          <article key={sponsor.id} className='content-card sponsor-card'>
            {sponsor.logoUrl ? <img src={sponsor.logoUrl} alt={sponsor.name} className='story-cover story-cover--logo' /> : null}
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
    </EditorialListingTemplate>
  )
}
