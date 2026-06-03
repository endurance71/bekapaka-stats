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
  return (
    <article
      className='content-card'
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.02)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        borderRadius: '20px',
        minHeight: '200px',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease'
      }}
    >
      {sponsor.logoUrl ? (
        <div
          style={{
            width: '100%',
            height: '80px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src={sponsor.logoUrl}
            alt={sponsor.name}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        </div>
      ) : (
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-bebas-neue), sans-serif',
            fontSize: '1.6rem',
            color: 'var(--text-muted)',
            marginBottom: '12px'
          }}
        >
          {sponsor.name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <h3
        style={{
          fontFamily: 'var(--font-bebas-neue), sans-serif',
          fontSize: '1.4rem',
          margin: '0 0 12px',
          letterSpacing: '0.02em',
          color: '#fff'
        }}
      >
        {sponsor.name}
      </h3>
      {sponsor.websiteUrl ? (
        <a
          href={sponsor.websiteUrl}
          target='_blank'
          rel='noreferrer'
          className='button button--ghost'
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            minHeight: '44px',
            minWidth: '88px',
            padding: '8px 14px',
            marginTop: 'auto'
          }}
        >
          Strona
        </a>
      ) : null}
    </article>
  )
}
