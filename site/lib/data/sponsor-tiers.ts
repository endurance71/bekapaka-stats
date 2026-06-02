import type { SponsorItem } from './schemas'

/** Wartości z CMS (Strapi enum) oraz legacy w fallback. */
export type SponsorDisplayTier = 'main' | 'partner' | 'support'

const MAIN_TIERS = new Set(['main', 'gold', 'glowny', 'główny'])
const PARTNER_TIERS = new Set(['partner', 'silver', 'srebrny'])

/**
 * Normalizuje surową wartość tier z CMS / fallback do grup wyświetlania.
 */
export function normalizeSponsorTier(rawTier?: string): SponsorDisplayTier {
  const tier = (rawTier ?? '').trim().toLowerCase()
  if (MAIN_TIERS.has(tier)) return 'main'
  if (PARTNER_TIERS.has(tier)) return 'partner'
  return 'support'
}

export function getSponsorTierLabel(tier: SponsorDisplayTier): string {
  if (tier === 'main') return 'Sponsor główny'
  if (tier === 'partner') return 'Sponsor wspierający'
  return 'Partner klubu'
}

export function partitionSponsorsByTier(sponsors: SponsorItem[]): {
  mainSponsors: SponsorItem[]
  partnerSponsors: SponsorItem[]
  supportSponsors: SponsorItem[]
  hasTierSections: boolean
} {
  const mainSponsors: SponsorItem[] = []
  const partnerSponsors: SponsorItem[] = []
  const supportSponsors: SponsorItem[] = []

  for (const sponsor of sponsors) {
    const tier = normalizeSponsorTier(sponsor.tier)
    if (tier === 'main') mainSponsors.push(sponsor)
    else if (tier === 'partner') partnerSponsors.push(sponsor)
    else supportSponsors.push(sponsor)
  }

  return {
    mainSponsors,
    partnerSponsors,
    supportSponsors,
    hasTierSections: mainSponsors.length > 0 || partnerSponsors.length > 0
  }
}
