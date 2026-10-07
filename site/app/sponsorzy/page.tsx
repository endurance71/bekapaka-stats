import { siteSettings } from '../../lib/site-settings'
import type { Metadata } from 'next'
import { PartnersGrid } from '../../components/public/sponsors/PartnersGrid'
import { ListingTemplate } from '../../components/public/templates/ListingTemplate'
import {
  getSiteMetadataBase,
  getSponsorsState
} from '../../lib/data'

export const revalidate = 60

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  alternates: { canonical: '/sponsorzy' },
  title: 'Sponsorzy | BeKaPaKa Bobolice',
  description: 'Poznaj sponsorów wspierających BeKaPaKa Bobolice.'
}

export default async function SponsorsPage() {
  const sponsorsState = await getSponsorsState(60)
  const sponsors = [...sponsorsState.data].sort((a, b) => (a.order || 999) - (b.order || 999))

  const mailto = `mailto:${siteSettings.contactEmail}?subject=${encodeURIComponent('Współpraca partnerska z BeKaPaKa')}`

  return (
    <ListingTemplate
      theme='papier'
      kicker='Kto nas wspiera?'
      title='Partnerzy klubu'
      lead='Firmy, instytucje i osoby, dzięki którym gramy w lidze KALK i organizujemy turnieje w Bobolicach. Dziękujemy.'
      hasItems={sponsors.length > 0}
      stateStatus={sponsorsState.status}
      stateSource={sponsorsState.source}
      stateMessage={sponsorsState.message}
      emptyTitle='Brak partnerów'
      emptyDescription='Lista partnerów jest aktualnie pusta.'
    >
      <PartnersGrid sponsors={sponsors} />
      <section id='wspolpraca' className='cooperation' aria-labelledby='h-cooperation'>
        <div className='cooperation__text'>
          <p className='kicker'>Współpraca</p>
          <h2 id='h-cooperation' className='band-head__title'>Zostań partnerem BeKaPaKa</h2>
          <p className='cooperation__lead'>
            Twoja firma na parkiecie, na koszulkach i w relacjach z meczów. Napisz do nas — wspólnie ustalimy zakres i warunki współpracy.
          </p>
        </div>
        <div className='cooperation__action'>
          <a className='btn btn--primary' href={mailto}>
            Napisz w sprawie współpracy
          </a>
          <a className='cooperation__email' href={mailto}>
            {siteSettings.contactEmail}
          </a>
        </div>
      </section>
    </ListingTemplate>
  )
}
