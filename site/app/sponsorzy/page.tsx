import type { Metadata } from 'next'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { getSiteMetadataBase, getSponsorsState, type SponsorItem } from '../../lib/data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Sponsorzy | BeKaPaKa Bobolice',
  description: 'Poznaj partnerow i sponsorow wspierajacych BeKaPaKa Bobolice.'
}

export default async function SponsorsPage() {
  const sponsorsState = await getSponsorsState(60)
  const sponsors = sponsorsState.data

  const goldSponsors = sponsors.filter(s => s.tier?.toLowerCase() === 'gold')
  const silverSponsors = sponsors.filter(s => s.tier?.toLowerCase() === 'silver' || s.tier?.toLowerCase() === 'srebrny' || s.tier?.toLowerCase() === 'main')
  const otherSponsors = sponsors.filter(s => 
    s.tier?.toLowerCase() !== 'gold' && 
    s.tier?.toLowerCase() !== 'silver' && 
    s.tier?.toLowerCase() !== 'srebrny' && 
    s.tier?.toLowerCase() !== 'main'
  )

  const hasTiers = goldSponsors.length > 0 || silverSponsors.length > 0

  return (
    <EditorialListingTemplate
      title='Sponsorzy i partnerzy'
      description='Dziekujemy firmom i osobom wspierajacym rozwoj klubu.'
      hasItems={sponsors.length > 0}
      stateStatus={sponsorsState.status}
      stateSource={sponsorsState.source}
      stateMessage={sponsorsState.message}
      emptyTitle={sponsorsState.status === 'error' ? 'Nie mozna pobrac sponsorow' : 'Brak sponsorow'}
      emptyDescription={
        sponsorsState.status === 'error'
          ? 'Sprawdz polaczenie z CMS lub token dostepu.'
          : 'Po uzupelnieniu sekcji sponsorow w CMS dane pojawia sie automatycznie.'
      }
    >
      <div style={{ display: 'grid', gap: '40px' }}>
        {goldSponsors.length > 0 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '2.2rem', color: 'var(--bkp-gold)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '20px', letterSpacing: '0.04em' }}>
              Sponsorzy Główni
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {goldSponsors.map((sponsor) => (
                <SponsorCard key={sponsor.id} sponsor={sponsor} isGold />
              ))}
            </div>
          </div>
        )}

        {silverSponsors.length > 0 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '1.8rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '20px', letterSpacing: '0.04em' }}>
              Sponsorzy Wspierający
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {silverSponsors.map((sponsor) => (
                <SponsorCard key={sponsor.id} sponsor={sponsor} />
              ))}
            </div>
          </div>
        )}

        {otherSponsors.length > 0 && (
          <div>
            {hasTiers && (
              <h2 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '1.8rem', color: '#aaa', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '20px', letterSpacing: '0.04em' }}>
                Partnerzy Klubu
              </h2>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
              {otherSponsors.map((sponsor) => (
                <SponsorCard key={sponsor.id} sponsor={sponsor} isCompact />
              ))}
            </div>
          </div>
        )}

        {!hasTiers && otherSponsors.length === 0 && sponsors.length > 0 && (
          <div className='card-grid'>
            {sponsors.map((sponsor) => (
              <SponsorCard key={sponsor.id} sponsor={sponsor} />
            ))}
          </div>
        )}
      </div>
    </EditorialListingTemplate>
  )
}

function SponsorCard({ sponsor, isGold = false, isCompact = false }: { sponsor: SponsorItem; isGold?: boolean; isCompact?: boolean }) {
  return (
    <article 
      className='content-card' 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: isGold ? '32px' : '20px',
        textAlign: 'center',
        border: isGold ? '1px solid rgba(236, 167, 44, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)',
        background: isGold ? 'linear-gradient(145deg, rgba(236, 167, 44, 0.05), rgba(10, 10, 10, 0.95))' : 'rgba(255, 255, 255, 0.02)',
        borderRadius: '16px',
        minHeight: isGold ? '220px' : '160px'
      }}
    >
      {sponsor.logoUrl ? (
        <div style={{ 
          width: '100%', 
          height: isGold ? '100px' : isCompact ? '60px' : '80px',
          position: 'relative', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img 
            src={sponsor.logoUrl} 
            alt={sponsor.name} 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'contain',
              filter: isGold ? 'none' : 'grayscale(35%) contrast(95%)',
              transition: 'filter 0.3s ease'
            }} 
            onMouseOver={(e) => { e.currentTarget.style.filter = 'none' }}
            onMouseOut={(e) => { e.currentTarget.style.filter = isGold ? 'none' : 'grayscale(35%) contrast(95%)' }}
          />
        </div>
      ) : (
        <div style={{ 
          width: '60px', 
          height: '60px', 
          borderRadius: '12px', 
          background: 'rgba(255, 255, 255, 0.04)', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'grid', 
          placeItems: 'center',
          fontFamily: 'var(--font-bebas-neue), sans-serif',
          fontSize: '1.5rem',
          color: 'var(--bkp-gold)',
          marginBottom: '12px'
        }}>
          {sponsor.name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <h3 style={{ 
        fontFamily: isCompact ? 'inherit' : 'var(--font-bebas-neue), sans-serif', 
        fontSize: isGold ? '1.8rem' : isCompact ? '1rem' : '1.4rem', 
        margin: '0 0 6px',
        letterSpacing: isCompact ? 'normal' : '0.02em',
        color: '#fff'
      }}>
        {sponsor.name}
      </h3>
      {!isCompact && <p className='muted' style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>{sponsor.tier}</p>}
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
            padding: '6px 12px',
            marginTop: 'auto'
          }}
        >
          Strona
        </a>
      ) : null}
    </article>
  )
}
