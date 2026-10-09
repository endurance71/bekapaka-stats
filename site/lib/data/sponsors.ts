import { sponsorSchema, type DataState, type SponsorItem } from './schemas'

/**
 * Ręcznie utrzymywana lista sponsorów (bez CMS).
 * Lokalne logotypy i ich pochodzenie: docs/qa/partner-logos-2026-10-06.md.
 */
export const sponsors: SponsorItem[] = [
  {
    id: 's-1',
    name: 'Gmina Bobolice',
    slug: 'gmina-bobolice',
    facebookUrl: 'https://www.facebook.com/Gmina.Bobolice',
    websiteUrl: 'https://bobolice.pl',
    order: 1,
    logoUrl: '/images/gmina-bobolice.svg',
    logoBgColor: '#ffffff',
    logoFit: 'contain'
  },
  {
    id: 's-2',
    name: 'Majster Plus Koszalin',
    slug: 'majster-plus-koszalin',
    facebookUrl: 'https://www.facebook.com/MajsterPlusKoszalin',
    websiteUrl: 'https://koszalin.majsterplus.com/',
    order: 2,
    logoUrl: '/images/partners/majster-official.svg',
    logoBgColor: '#ffffff',
    logoFit: 'contain'
  },
  {
    id: 's-3',
    name: 'Fem-Tech Tychowo',
    slug: 'fem-tech-tychowo',
    websiteUrl: '',
    order: 3,
    logoUrl: '/images/partners/fem-tech.webp',
    logoBgColor: '#ffffff',
    logoFit: 'contain'
  },
  {
    id: 's-4',
    name: 'Contema Bobolice',
    slug: 'contema-bobolice',
    websiteUrl: 'http://www.contema.eu/',
    order: 4,
    logoUrl: '/images/partners/contema.png',
    logoBgColor: '#ffffff',
    logoFit: 'contain'
  },
  {
    id: 's-5',
    name: 'CERTE. Kancelaria Doradcy Podatkowego Inez Szczęśniak',
    slug: 'certe-inez-szczesniak',
    websiteUrl: 'https://certe.com.pl/',
    order: 5,
    logoUrl: '/images/partners/certe-wordmark.png',
    logoBgColor: '#ffffff',
    logoFit: 'contain'
  },
  {
    id: 's-6',
    name: 'PST Sped-Trans Bobolice',
    slug: 'pst-sped-trans',
    websiteUrl: '',
    order: 6
  },
  {
    id: 's-7',
    name: 'Nadleśnictwo Bobolice, Lasy Państwowe',
    slug: 'nadlesnictwo-bobolice',
    facebookUrl: 'https://www.facebook.com/Nadlesnictwo.Bobolice',
    websiteUrl: 'https://bobolice.szczecinek.lasy.gov.pl',
    order: 7,
    logoUrl: '/images/partners/lasy-vector.svg',
    logoBgColor: '#ffffff',
    logoFit: 'contain',
    logoCardScale: 1.25,
    logoCardPadding: '8px'
  },
  {
    id: 's-8',
    name: 'ALAB laboratoria',
    slug: 'alab-laboratoria',
    facebookUrl: 'https://www.facebook.com/alablaboratoria',
    websiteUrl: 'https://www.alab.pl/',
    order: 8,
    logoUrl: '/images/partners/alab-official.svg',
    logoBgColor: '#ffffff',
    logoFit: 'contain'
  },
  {
    id: 's-9',
    name: 'Piotr Adamus',
    slug: 'piotr-adamus',
    websiteUrl: '',
    order: 9
  },
  {
    id: 's-10',
    name: '„Skup aut i Auto laweta” Remek Klimek',
    slug: 'skup-aut-remek-klimek',
    websiteUrl: '',
    order: 10
  },
  {
    id: 's-11',
    name: 'CESIR Bobolice',
    slug: 'cesir-bobolice',
    websiteUrl: 'https://hala.spbobolice.pl/',
    order: 11,
    logoUrl: '/images/partners/cesir.webp',
    logoBgColor: '#ffffff',
    logoFit: 'contain'
  },
  {
    id: 's-12',
    name: 'Emil Jaświg',
    slug: 'emil-jaswig',
    websiteUrl: '',
    order: 12
  },
  {
    id: 's-13',
    name: 'Baumal e-hurtowniabudowlana.pl',
    slug: 'baumal',
    facebookUrl: 'https://www.facebook.com/BAUMALPOLSKA',
    websiteUrl: 'https://e-hurtowniabudowlana.pl',
    order: 13,
    logoUrl: '/images/partners/baumal-vector.svg',
    logoBgColor: '#ffffff',
    logoFit: 'contain'
  },
  {
    id: 's-14',
    name: 'Insight Data Consulting Izabela Kaszubowska',
    slug: 'insight-data-consulting',
    websiteUrl: '',
    order: 14,
    logoUrl: '/images/partners/insight-data-consulting.webp',
    logoBgColor: '#ffffff',
    logoFit: 'contain',
    // Znak poziomy ~5:1 — przy 150 px nazwa „Insight Data Consulting” byłaby za drobna.
    logoCardScale: 1.25
  },
  {
    id: 's-15',
    name: 'ShipApp',
    slug: 'shipapp',
    websiteUrl: 'https://shipapp.pl',
    order: 15,
    logoUrl: '/images/partners/shipapp.png',
    logoBgColor: '#ffffff',
    logoFit: 'contain'
  }
].map((item) => sponsorSchema.parse(item))

export async function getSponsors(limit = 12): Promise<SponsorItem[]> {
  const state = await getSponsorsState(limit)
  return state.data
}

export async function getSponsorsState(limit = 12): Promise<DataState<SponsorItem[]>> {
  const sorted = [...sponsors].sort((a, b) => (a.order || 999) - (b.order || 999))
  return {
    status: 'ok',
    data: sorted.slice(0, limit),
    source: 'live'
  }
}
