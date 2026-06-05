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

  const cardContent = (
    <>
      <div
        className='sponsor-card-premium__logo-container sponsor-card-premium__logo-container--monogram'
        aria-hidden='true'
      >
        {initials}
      </div>
      <div className='sponsor-card-premium__content'>
        <h3 className='sponsor-card-premium__name'>{sponsor.name}</h3>
      </div>
      <div className='sponsor-card-premium__footer'>
        <span
          className={`sponsor-card-premium__btn${
            sponsor.websiteUrl ? '' : ' sponsor-card-premium__btn--placeholder'
          }`}
          aria-hidden={sponsor.websiteUrl ? undefined : true}
        >
          Strona
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
      </div>
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


