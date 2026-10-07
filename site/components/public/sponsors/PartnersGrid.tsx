import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { SponsorItem } from '../../../lib/data/schemas'
import { siteSettings } from '../../../lib/site-settings'

type Tier = NonNullable<SponsorItem['tier']> | 'other'

/** Poziomy partnerów (Brandbook 2.0, s. 25 tomu WWW): skala 1.00 / 0.62 / 0.50. */
const tiers: { key: Tier; label: string }[] = [
  { key: 'main', label: 'Partner główny' },
  { key: 'strategic', label: 'Partnerzy strategiczni' },
  { key: 'supporting', label: 'Partnerzy wspierający' },
  { key: 'local', label: 'Partnerzy lokalni' },
  { key: 'other', label: 'Partnerzy klubu' }
]

function PartnerCell({ sponsor }: { sponsor: SponsorItem }) {
  const style = sponsor.logoCardScale ? ({ '--logo-scale': String(sponsor.logoCardScale) } as CSSProperties) : undefined
  const content = sponsor.logoUrl ? (
    <img className="partner__logo" src={sponsor.logoUrl} alt={sponsor.name} width={200} height={80} loading="lazy" decoding="async" style={style} />
  ) : (
    <span className="partner__name">{sponsor.name}</span>
  )
  return sponsor.websiteUrl ? (
    <li className="partner">
      <a className="partner__inner" href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label={`${sponsor.name} (otwiera się w nowej karcie)`}>
        {content}
      </a>
    </li>
  ) : (
    <li className="partner">
      <span className="partner__inner">{content}</span>
    </li>
  )
}

/** Liczba kolumn ściany na kolejnych szerokościach — musi odpowiadać .partner-tier__grid w components.css. */
const wallColumns = [
  { key: 'sm', cols: 2 },
  { key: 'md', cols: 3 },
  { key: 'lg', cols: 5 },
  { key: 'xl', cols: 6 }
] as const

/**
 * Kafel dopełniający ostatni rząd: zajmuje dokładnie tyle kolumn, ile brakuje na danej szerokości,
 * więc ściana nigdy nie kończy się pustymi komórkami. Gdy rząd jest pełny — ukryty.
 */
function InviteCell({ count }: { count: number }) {
  const spans = wallColumns.map(({ key, cols }) => ({ key, span: (cols - (count % cols)) % cols }))
  const style = Object.fromEntries(spans.map(({ key, span }) => [`--span-${key}`, String(Math.max(span, 1))])) as CSSProperties
  const classes = spans.filter(({ span }) => span > 0).map(({ key }) => `partner--invite-${key}`)
  if (!classes.length) return null
  return (
    <li className={`partner partner--invite ${classes.join(' ')}`} style={style}>
      <Link className="partner__inner partner__invite" href="/sponsorzy#wspolpraca">
        <span className="partner__invite-title">Miejsce na Twoją firmę</span>
        <span className="arrow-link">
          <span>Zostań partnerem</span>
        </span>
      </Link>
    </li>
  )
}

/**
 * Ściana partnerów: komórki o równym polu optycznym rozdzielone linią 1 px — jedna plansza, nie siatka kart.
 * Logo bez deformacji i przycinania (object-fit: contain, pole ochronne w paddingu komórki).
 * Poziomy włącza flaga SITE_PARTNER_LEVELS_APPROVED po decyzji zarządu; do tego czasu jeden poziom.
 */
export function PartnersGrid({ sponsors, compact = false }: { sponsors: SponsorItem[]; compact?: boolean }) {
  const sorted = [...sponsors].sort((a, b) => a.order - b.order)
  if (!sorted.length) return null

  const groups = siteSettings.partnersLevelsApproved
    ? tiers
        .map((tier) => ({ ...tier, items: sorted.filter((item) => (item.tier || 'other') === tier.key) }))
        .filter((group) => group.items.length)
    : [{ key: 'other' as Tier, label: 'Partnerzy klubu', items: sorted }]

  return (
    <div className={`partner-wall${compact ? ' partner-wall--compact' : ''}`}>
      {groups.map((group) => (
        <div key={group.key} className={`partner-tier partner-tier--${group.key}`}>
          {groups.length > 1 && <h3 className="partner-tier__label">{group.label}</h3>}
          <ul className="partner-tier__grid" role="list" aria-label={group.label}>
            {group.items.map((sponsor) => (
              <PartnerCell key={sponsor.id} sponsor={sponsor} />
            ))}
            {group === groups[groups.length - 1] && group.key !== 'main' && <InviteCell count={group.items.length} />}
          </ul>
        </div>
      ))}
    </div>
  )
}
