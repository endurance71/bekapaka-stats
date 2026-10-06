import type { Metadata } from 'next'
import { PartnersGrid } from '../../components/public/sponsors/PartnersGrid'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
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

  return (
    <EditorialListingTemplate
      title='Partnerzy klubu'
      eyebrow='Dziękujemy'
      description='Dziękujemy firmom i osobom wspierającym rozwój klubu.'
      hasItems={sponsors.length > 0}
      stateStatus={sponsorsState.status}
      stateSource={sponsorsState.source}
      stateMessage={sponsorsState.message}
      emptyTitle='Brak sponsorów'
      emptyDescription='Lista sponsorów jest aktualnie pusta.'
    >
      <div className="sponsors-content-wrap">
        <PartnersGrid sponsors={sponsors}/>
        <section className="sponsors-cooperation-card" aria-labelledby="sponsors-coop-title">
          <div className="sponsors-cooperation-card__content">
            <span className="label accent">Współpraca</span>
            <h2 id="sponsors-coop-title" className="sponsors-cooperation-card__title">Zostań partnerem BeKaPaKa</h2>
            <p className="sponsors-cooperation-card__desc">
              Wspieraj rozwój koszykówki w Bobolicach, turnieje młodzieżowe i naszą drużynę w KALK.
              Oferujemy ekspozycję na strojach, materiałach klubowych i podczas wydarzeń w hali CESiR.
            </p>
            <div className="sponsors-cooperation-card__actions">
              <a className="btn btn--primary" href="mailto:kontakt@damianmotylinski.pl?subject=Wsp%C3%B3%C5%82praca%20partnerska%20z%20BeKaPaKa">
                Skontaktuj się w sprawie współpracy →
              </a>
              <span className="muted text-sm">kontakt@damianmotylinski.pl</span>
            </div>
          </div>
        </section>
      </div>
    </EditorialListingTemplate>
  )
}
