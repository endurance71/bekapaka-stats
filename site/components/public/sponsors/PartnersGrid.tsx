import type { SponsorItem } from '../../../lib/data/schemas'
import { siteSettings } from '../../../lib/site-settings'
import { SponsorLogoFrame } from './SponsorLogoFrame'

const levels: Record<string, string> = {
  main: 'Partner główny',
  strategic: 'Partnerzy strategiczni',
  supporting: 'Partnerzy wspierający',
  local: 'Partnerzy lokalni',
  other: 'Partnerzy klubu'
}

function Grid({ sponsors }: { sponsors: SponsorItem[] }) {
  return (
    <div className="logos logos--eq">
      {sponsors.map((sponsor) => {
        const content = sponsor.logoUrl ? (
          <SponsorLogoFrame sponsor={sponsor} />
        ) : (
          <span className="plaque--text">{sponsor.name}</span>
        )

        return sponsor.websiteUrl ? (
          <a
            key={sponsor.id}
            href={sponsor.websiteUrl}
            className="plaque plaque--eq"
            aria-label={sponsor.name}
            rel="noopener noreferrer"
            target="_blank"
          >
            {content}
          </a>
        ) : (
          <div key={sponsor.id} className="plaque plaque--eq" role="group" aria-label={sponsor.name}>
            {content}
          </div>
        )
      })}
    </div>
  )
}

export function PartnersGrid({ sponsors, compact = false }: { sponsors: SponsorItem[]; compact?: boolean }) {
  const sorted = [...sponsors].sort((a, b) => a.order - b.order)

  if (!siteSettings.partnersLevelsApproved) {
    return (
      <div className={`partners${compact ? ' partners--compact' : ''}`}>
        <div className="tier">
          <div className="tier__label">Partnerzy</div>
          <Grid sponsors={sorted} />
        </div>
      </div>
    )
  }

  return (
    <div className={`partners${compact ? ' partners--compact' : ''}`}>
      {Object.entries(levels).map(([tier, label]) => {
        const items = sorted.filter((item) => (item.tier || 'other') === tier)
        return items.length ? (
          <div className={`tier tier--${tier}`} key={tier}>
            <div className="tier__label">{label}</div>
            <Grid sponsors={items} />
          </div>
        ) : null
      })}
    </div>
  )
}
