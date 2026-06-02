import type { Metadata } from 'next'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import {
  getSiteMetadataBase,
  getSponsorsState,
  type SponsorItem
} from '../../lib/data'
import {
  getSponsorTierLabel,
  normalizeSponsorTier,
  partitionSponsorsByTier,
  type SponsorDisplayTier
} from '../../lib/data/sponsor-tiers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Sponsorzy | BeKaPaKa Bobolice',
  description: 'Poznaj partnerów i sponsorów wspierających BeKaPaKa Bobolice.'
}

export default async function SponsorsPage() {
  const sponsorsState = await getSponsorsState(60)
  const sponsors = sponsorsState.data
  const { mainSponsors, partnerSponsors, supportSponsors, hasTierSections } =
    partitionSponsorsByTier(sponsors)

  return (
    <EditorialListingTemplate
      title='Sponsorzy i partnerzy'
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
      <div style={{ display: 'grid', gap: '50px' }}>
        {mainSponsors.length > 0 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '2.4rem', color: 'var(--bkp-gold)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '24px', letterSpacing: '0.04em' }}>
              Sponsorzy Główni
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '24px' }}>
              {mainSponsors.map((sponsor) => (
                <SponsorCard key={sponsor.id} sponsor={sponsor} displayTier='main' />
              ))}
            </div>
          </div>
        )}

        {partnerSponsors.length > 0 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '2rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '24px', letterSpacing: '0.04em' }}>
              Sponsorzy Wspierający
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '20px' }}>
              {partnerSponsors.map((sponsor) => (
                <SponsorCard key={sponsor.id} sponsor={sponsor} displayTier='partner' />
              ))}
            </div>
          </div>
        )}

        {supportSponsors.length > 0 && (
          <div>
            {hasTierSections && (
              <h2 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '1.8rem', color: '#888', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '20px', letterSpacing: '0.04em' }}>
                Partnerzy Klubu
              </h2>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
              {supportSponsors.map((sponsor) => (
                <SponsorCard key={sponsor.id} sponsor={sponsor} displayTier='support' isCompact />
              ))}
            </div>
          </div>
        )}

        {!hasTierSections && supportSponsors.length === 0 && sponsors.length > 0 && (
          <div className='card-grid'>
            {sponsors.map((sponsor) => (
              <SponsorCard
                key={sponsor.id}
                sponsor={sponsor}
                displayTier={normalizeSponsorTier(sponsor.tier)}
              />
            ))}
          </div>
        )}
      </div>
    </EditorialListingTemplate>
  )
}

function SponsorCard({
  sponsor,
  displayTier,
  isCompact = false
}: {
  sponsor: SponsorItem
  displayTier: SponsorDisplayTier
  isCompact?: boolean
}) {
  const isGold = displayTier === 'main'
  const isSilver = displayTier === 'partner'

  const borderStyle = isGold
    ? '2px solid var(--bkp-gold)'
    : isSilver
      ? '1px solid rgba(255, 255, 255, 0.15)'
      : '1px solid rgba(255, 255, 255, 0.06)'

  const bgStyle = isGold
    ? 'linear-gradient(135deg, rgba(236, 167, 44, 0.08) 0%, rgba(20, 20, 22, 0.95) 100%)'
    : isSilver
      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(20, 20, 22, 0.95) 100%)'
      : 'rgba(255, 255, 255, 0.02)'

  const shadowStyle = isGold
    ? '0 12px 32px rgba(236, 167, 44, 0.15), 0 0 15px rgba(236, 167, 44, 0.05)'
    : isSilver
      ? '0 8px 24px rgba(0, 0, 0, 0.3)'
      : '0 4px 12px rgba(0, 0, 0, 0.2)'

  return (
    <article
      className='content-card'
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isGold ? '32px 24px' : '20px 16px',
        textAlign: 'center',
        border: borderStyle,
        background: bgStyle,
        boxShadow: shadowStyle,
        borderRadius: '20px',
        minHeight: isGold ? '240px' : isSilver ? '200px' : '150px',
        position: 'relative',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease'
      }}
    >
      {isGold && (
        <span
          style={{
            background: 'var(--gold-gradient)',
            color: '#000',
            fontSize: '9px',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '16px'
          }}
        >
          Sponsor Główny
        </span>
      )}
      {isSilver && (
        <span
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'rgba(255,255,255,0.9)',
            fontSize: '9px',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        >
          Sponsor Wspierający
        </span>
      )}

      {sponsor.logoUrl ? (
        <div
          style={{
            width: '100%',
            height: isGold ? '100px' : isCompact ? '60px' : '80px',
            position: 'relative',
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
              objectFit: 'contain',
              filter: isGold ? 'none' : 'grayscale(35%) contrast(95%)'
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
            border: isGold ? '1.5px solid var(--bkp-gold)' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-bebas-neue), sans-serif',
            fontSize: '1.6rem',
            color: isGold ? 'var(--bkp-gold)' : 'var(--text-muted)',
            textShadow: isGold ? '0 0 10px rgba(236, 167, 44, 0.2)' : 'none',
            marginBottom: '12px'
          }}
        >
          {sponsor.name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <h3
        style={{
          fontFamily: isCompact ? 'inherit' : 'var(--font-bebas-neue), sans-serif',
          fontSize: isGold ? '1.9rem' : isCompact ? '1rem' : '1.4rem',
          margin: '0 0 6px',
          letterSpacing: isCompact ? 'normal' : '0.02em',
          color: '#fff'
        }}
      >
        {sponsor.name}
      </h3>
      {!isCompact && (
        <p
          className='muted'
          style={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 12px',
            color: isGold ? 'var(--bkp-gold)' : 'var(--text-muted)'
          }}
        >
          {getSponsorTierLabel(displayTier)}
        </p>
      )}
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
            minHeight: '32px',
            padding: '6px 14px',
            marginTop: 'auto'
          }}
        >
          Strona
        </a>
      ) : null}
    </article>
  )
}
