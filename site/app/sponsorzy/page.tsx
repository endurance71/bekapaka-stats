import type { Metadata } from 'next'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import {
  getSiteMetadataBase,
  getSponsorsState,
  type SponsorItem
} from '../../lib/data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Sponsorzy | BeKaPaKa Bobolice',
  description: 'Poznaj sponsorów wspierających BeKaPaKa Bobolice.'
}

export default async function SponsorsPage() {
  const sponsorsState = await getSponsorsState(60)
  const sponsors = [...sponsorsState.data].sort((a, b) => (a.order || 999) - (b.order || 999))

  return (
    <EditorialListingTemplate
      title='Sponsorzy'
      description='Dziękujemy firmom i osobom wspierającym rozwój klubu.'
      hasItems={sponsors.length > 0}
      stateStatus={sponsorsState.status}
      stateSource={sponsorsState.source}
      stateMessage={sponsorsState.message}
      emptyTitle={sponsorsState.status === 'error' ? 'Nie można pobrać sponsorów' : 'Brak sponsorów'}
      emptyDescription={
        sponsorsState.status === 'error'
          ? 'Sprawdź połączenie z CMS lub token dostępu (SITE_CMS_TOKEN).'
          : 'Po uzupełnieniu sekcji sponsorów w CMS dane pojawią się automatycznie.'
      }
    >
      <div className='sponsors-logo-grid'>
        {sponsors.map((sponsor) => (
          <SponsorCard key={sponsor.id} sponsor={sponsor} />
        ))}
      </div>
    </EditorialListingTemplate>
  )
}

function SponsorCard({ sponsor }: { sponsor: SponsorItem }) {
  const isLink = !!sponsor.websiteUrl
  const initials = sponsor.name.slice(0, 2).toUpperCase()

  // Dynamic categorization for a highly professional copy layout
  const getSponsorDetails = (name: string) => {
    const normalized = name.toLowerCase()
    if (
      normalized.includes('gmina') ||
      normalized.includes('nadleśnictwo') ||
      normalized.includes('cesir') ||
      normalized.includes('urząd') ||
      normalized.includes('lasy państwowe')
    ) {
      return {
        badge: 'Partner Publiczny',
        description: 'Wspiera rozwój lokalnego sportu i inicjatywy sportowe w gminie Bobolice.'
      }
    }

    if (
      normalized.includes('adamus') ||
      normalized.includes('jaświg') ||
      normalized.includes('klimek') ||
      normalized.includes('remek')
    ) {
      return {
        badge: 'Sponsor Prywatny',
        description: 'Darczyńca i przyjaciel klubu, bezpośrednio wspierający naszą drużynę.'
      }
    }

    return {
      badge: 'Partner Biznesowy',
      description: 'Mecenas sportu pomagający w rozwoju organizacyjnym stowarzyszenia.'
    }
  }

  const { badge, description } = getSponsorDetails(sponsor.name)

  const cardContent = (
    <>
      <span className='sponsor-card-premium__badge'>{badge}</span>
      <div className={`sponsor-card-premium__logo-container ${
        sponsor.logoUrl 
          ? 'sponsor-card-premium__logo-container--white' 
          : 'sponsor-card-premium__logo-container--dark'
      }`}>
        {sponsor.logoUrl ? (
          <img
            src={sponsor.logoUrl}
            alt={sponsor.name}
            className='sponsor-card-premium__logo'
          />
        ) : (
          <div className='sponsor-card-premium__emblem'>
            <div className='sponsor-card-premium__emblem-ring' />
            <div className='sponsor-card-premium__emblem-shield'>
              <span className='sponsor-card-premium__emblem-star'>★</span>
              <span>{initials}</span>
            </div>
          </div>
        )}
      </div>
      <h3 className='sponsor-card-premium__name'>{sponsor.name}</h3>
      <p className='sponsor-card-premium__description'>{description}</p>
      {sponsor.websiteUrl ? (
        <span className='sponsor-card-premium__btn'>
          Odwiedź stronę
          <svg
            width='12'
            height='12'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'
          >
            <path d='M7 17L17 7M17 7H7M17 7V17' />
          </svg>
        </span>
      ) : null}
    </>
  )

  if (isLink) {
    return (
      <a
        id={`sponsor-link-${sponsor.id}`}
        href={sponsor.websiteUrl}
        target='_blank'
        rel='noreferrer'
        className='sponsor-card-premium'
      >
        {cardContent}
      </a>
    )
  }

  return (
    <div id={`sponsor-card-${sponsor.id}`} className='sponsor-card-premium'>
      {cardContent}
    </div>
  )
}


