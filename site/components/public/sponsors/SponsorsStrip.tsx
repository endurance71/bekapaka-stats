import type { SponsorItem } from '../../../lib/data'

export function SponsorsStrip({ sponsors }: { sponsors: SponsorItem[] }) {
  if (sponsors.length === 0) return null

  return (
    <section className='sponsors-strip' aria-label='Strefa sponsorow'>
      <div className='container'>
        <p className='eyebrow'>Partnerzy</p>
        <div className='sponsors-strip__grid'>
          {sponsors.slice(0, 12).map((sponsor) => (
            <div key={sponsor.id} className='sponsor-chip'>
              {sponsor.logoUrl ? <img src={sponsor.logoUrl} alt={sponsor.name} className='sponsor-chip__logo' /> : sponsor.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
