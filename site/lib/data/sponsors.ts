import { sponsorSchema, type DataState, type SponsorItem } from './schemas'

/**
 * Ręcznie utrzymywana lista sponsorów (bez CMS).
 * Logo w `site/public/images/` — źródła w `Sponsorzy/`.
 */
export const sponsors: SponsorItem[] = [
  {
    id: 's-1',
    name: 'Gmina Bobolice',
    slug: 'gmina-bobolice',
    websiteUrl: 'https://bobolice.pl',
    order: 1,
    logoUrl: '/images/gmina-bobolice.svg',
    logoBgColor: '#ffffff',
    logoFit: 'contain',
    logoSliderScale: 1.08
  },
  {
    id: 's-2',
    name: 'Majster Plus Koszalin',
    slug: 'majster-plus-koszalin',
    websiteUrl: 'https://majsterplus.pl',
    order: 2,
    logoUrl: '/images/majster-plus.png',
    logoBgColor: '#e80808',
    logoFit: 'fill',
    logoSliderFit: 'contain',
    logoCardFit: 'contain',
    logoSliderScale: 0.82,
    logoSliderPadding: '0.38rem',
    logoCardScale: 0.9,
    logoCardPadding: '0.3rem'
  },
  {
    id: 's-3',
    name: 'Fem-Tech Tychowo',
    slug: 'fem-tech-tychowo',
    websiteUrl: '',
    order: 3,
    logoUrl: '/images/fem-tech.jpg',
    logoBgColor: '#ffffff',
    logoFit: 'contain',
    logoSliderScale: 1.26,
    logoSliderPadding: '0.12rem',
    logoCardScale: 1.2,
    logoCardPadding: '0.16rem'
  },
  {
    id: 's-4',
    name: 'Contema Bobolice',
    slug: 'contema-bobolice',
    websiteUrl: '',
    order: 4
  },
  {
    id: 's-5',
    name: 'CERTE. Kancelaria Doradcy Podatkowego Inez Szczęśniak',
    slug: 'certe-inez-szczesniak',
    websiteUrl: '',
    order: 5
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
    websiteUrl: 'https://bobolice.szczecinek.lasy.gov.pl',
    order: 7
  },
  {
    id: 's-8',
    name: 'ALAB laboratoria',
    slug: 'alab-laboratoria',
    websiteUrl: 'https://www.alab-laboratoria.pl',
    order: 8
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
    websiteUrl: 'http://www.cesir.bobolice.pl',
    order: 11
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
    websiteUrl: 'https://e-hurtowniabudowlana.pl',
    order: 13,
    logoUrl: '/images/baumal.png',
    logoBgColor: '#ffffff',
    logoFit: 'contain',
    logoSliderScale: 1.1,
    logoSliderPadding: '0.28rem'
  },
  {
    id: 's-14',
    name: 'Insight Data Consulting Izabela Kaszubowska',
    slug: 'insight-data-consulting',
    websiteUrl: '',
    order: 14
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
