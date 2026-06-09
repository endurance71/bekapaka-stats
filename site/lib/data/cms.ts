import { cmsHeaders, cmsPath, fetchJsonState, hasCmsToken, toAbsoluteCmsUrl } from './client'
import {
  type DataState,
  documentSchema,
  eventSchema,
  homepageSectionSchema,
  newsPostSchema,
  type DocumentItem,
  type EventItem,
  type HomepageSection,
  type NewsAttachment,
  type NewsPost
} from './schemas'
import {
  excerptFromContent,
  resolveNewsSlug,
  sanitizeNumber,
  sanitizeText,
  toNormalizedArray
} from './utils'

function mapMediaUrl(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const payload = value as { data?: unknown; url?: unknown }
  if (typeof payload.url === 'string') return toAbsoluteCmsUrl(payload.url)
  if (payload.data && typeof payload.data === 'object') {
    const nested = payload.data as { attributes?: { url?: unknown }; url?: unknown }
    if (typeof nested.url === 'string') return toAbsoluteCmsUrl(nested.url)
    if (nested.attributes && typeof nested.attributes.url === 'string') {
      return toAbsoluteCmsUrl(nested.attributes.url)
    }
  }
  return undefined
}

/** Map Strapi media (single or multiple) to public attachment links. */
function mapMediaAttachments(value: unknown): NewsAttachment[] {
  if (!value) return []

  const rawList = Array.isArray(value)
    ? value
    : typeof value === 'object' && value !== null && Array.isArray((value as { data?: unknown }).data)
      ? ((value as { data: unknown[] }).data)
      : typeof value === 'object' && value !== null && (value as { data?: unknown }).data
        ? [((value as { data: unknown }).data)]
        : []

  const attachments: NewsAttachment[] = []

  rawList.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return
    const record = entry as Record<string, unknown>
    const url = mapMediaUrl(entry)
    if (!url) return
    const mime = sanitizeText(record.mime, '')
    attachments.push({
      id: sanitizeText(record.id, String(index)),
      name: sanitizeText(record.name, sanitizeText(record.alternativeText, `Załącznik ${index + 1}`)),
      url,
      ...(mime ? { mime } : {})
    })
  })

  return attachments
}

function stateFromArray<T>(items: T[], errorMessage?: string): DataState<T[]> {
  if (errorMessage) return { status: 'error', data: [], source: 'live', message: errorMessage }
  if (items.length === 0) return { status: 'empty', data: [], source: 'live' }
  return { status: 'ok', data: items, source: 'live' }
}

/** Sort by display date (publishedAtCustom in CMS), newest first. */
function sortNewsPostsByDate(items: NewsPost[]): NewsPost[] {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(a.publishedAt) || 0
    const bTime = Date.parse(b.publishedAt) || 0
    return bTime - aTime
  })
}

// ==========================================
// FALLBACK DATA (CMS)
// ==========================================

const fallbackNews: NewsPost[] = [
  {
    id: 'fn-1',
    title: 'Rewolucyjne zmiany w klubie i nowy portal statystyczny!',
    slug: 'nowy-portal-statystyczny',
    excerpt: 'Uruchamiamy nową platformę dla kibiców BeKaPaKa Bobolice ze szczegółowymi statystykami oraz wynikami spotkań.',
    content: 'Z dumą prezentujemy nasz nowy portal internetowy! Dzięki integracji z systemem analiz sportowych KALK, nasi kibice mogą od dziś śledzić niezwykle szczegółowe, zaawansowane statystyki zawodników oraz terminarz i wyniki meczów. Zapraszamy do eksploracji podstron Skład oraz Mecze!',
    publishedAt: '2026-06-01T12:00:00Z',
    coverImageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1000&auto=format&fit=crop',
    attachments: []
  },
  {
    id: 'fn-2',
    title: 'Przed nami decydujące starcie w sezonie 2026',
    slug: 'decydujace-starcie-2026',
    excerpt: 'Trener zapowiada pełną mobilizację przed nadchodzącym meczem na szczycie. Każdy kosz będzie na wagę złota.',
    content: 'Nasz zespół intensywnie trenuje przed najbliższym spotkaniem ligowym. Po serii zaciętych meczów, przed nami kluczowy pojedynek, który zadecyduje o układzie tabeli przed fazą play-off. Zapraszamy wszystkich kibiców do wsparcia drużyny głośnym dopingiem!',
    publishedAt: '2026-05-28T14:30:00Z',
    coverImageUrl: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a27?q=80&w=1000&auto=format&fit=crop',
    attachments: []
  },
  {
    id: 'fn-3',
    title: 'Analiza statystyczna po pierwszej rundzie rozgrywek',
    slug: 'podsumowanie-rundy-rozgrywek',
    excerpt: 'Przyjrzyjmy się bliżej liczbom. Kto jest liderem zbiórek, a kto najlepiej asystuje w tym sezonie?',
    content: 'Pierwsza runda za nami, czas na analizę statystyczną! Zespół BeKaPaKa notuje świetne wskaźniki w grze obronnej, a nasi liderzy Tomasz Kaszubowski oraz Damian Motyliński przewodzą w ligowych statystykach zbiórek oraz asyst. Zapraszamy do zapoznania się ze szczegółowymi profilami zawodników w zakładce Skład.',
    publishedAt: '2026-05-20T10:15:00Z',
    coverImageUrl: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=1000&auto=format&fit=crop',
    attachments: []
  }
]

const fallbackEvents: EventItem[] = [
  {
    id: 'fe-1',
    title: 'BeKaPaKa Bobolice vs Piwiarnia Bumerang',
    slug: 'mecz-piwiarnia-bumerang',
    type: 'game',
    description: 'Niezwykle ważne spotkanie ligowe na szczycie tabeli.',
    location: 'Hala CESIR Bobolice, ul. Głowackiego 1',
    startAt: '2026-06-08T18:00:00Z',
    endAt: '2026-06-08T20:00:00Z',
    registrationUrl: ''
  },
  {
    id: 'fe-2',
    title: 'Trening otwarty dla młodzieży z Bobolic',
    slug: 'trening-otwarty-mlodziez',
    type: 'other',
    description: 'Chcesz spróbować swoich sił na parkiecie? Przyjdź na nasz otwarty trening prowadzony przez zawodników pierwszego składu!',
    location: 'Hala CESIR Bobolice, ul. Głowackiego 1',
    startAt: '2026-06-12T16:00:00Z',
    endAt: '2026-06-12T18:00:00Z',
    registrationUrl: 'https://panel.bekapaka.pl'
  }
]

const fallbackDocuments: DocumentItem[] = [
  {
    id: 'fd-1',
    title: 'Regulamin Klubu BeKaPaKa Bobolice 2026',
    slug: 'regulamin-klubu-2026',
    category: 'Regulaminy',
    effectiveDate: '2026-01-01',
    fileUrl: '#'
  },
  {
    id: 'fd-2',
    title: 'Formularz zgłoszeniowy dla nowych zawodników',
    slug: 'formularz-zgloszeniowy-zawodnika',
    category: 'Formularze',
    effectiveDate: '2026-02-15',
    fileUrl: '#'
  },
  {
    id: 'fd-3',
    title: 'Polityka prywatności i ochrona danych osobowych (RODO)',
    slug: 'polityka-prywatnosci-rodo',
    category: 'RODO',
    effectiveDate: '2026-01-01',
    fileUrl: '#'
  }
]

const fallbackHomepageSections: HomepageSection[] = [
  {
    id: 'fhs-1',
    key: 'about',
    title: 'O klubie BeKaPaKa',
    subtitle: 'Historia i misja',
    body: 'BeKaPaKa Bobolice to amatorska drużyna koszykówki, która powstała z pasji do sportu i chęci reprezentowania naszego miasta w rozgrywkach regionalnych.',
    order: 1,
    isEnabled: true
  }
]

// ==========================================
// FETCHING FUNCTIONS
// ==========================================

export async function getNewsPosts(limit = 6): Promise<NewsPost[]> {
  const state = await getNewsPostsState(limit)
  return state.data
}

export async function getNewsPostsState(limit = 6): Promise<DataState<NewsPost[]>> {
  try {
    const response = await fetchJsonState<unknown>(
      cmsPath(
        `/api/news-posts?sort=publishedAtCustom:desc&pagination[limit]=${limit}&populate[coverImage]=true&populate[attachments]=true`
      ),
      { headers: cmsHeaders(), revalidate: 300 }
    )
    if (response.status === 'error') {
      return { status: 'error', data: fallbackNews.slice(0, limit), source: 'fallback', message: response.message }
    }

    const items = toNormalizedArray(response.payload)
      .map((item, index) => {
        const title = sanitizeText(item.title, 'Bez tytulu')
        const content = sanitizeText(item.content, '')
        const excerptRaw = sanitizeText(item.excerpt, sanitizeText(item.description, ''))
        return {
          id: sanitizeText(item.id, String(index)),
          title,
          slug: resolveNewsSlug(sanitizeText(item.slug, ''), title, index),
          excerpt: excerptRaw || excerptFromContent(content),
          content,
          publishedAt: sanitizeText(item.publishedAtCustom, sanitizeText(item.publishedAt, '')),
          coverImageUrl: mapMediaUrl(item.coverImage),
          attachments: mapMediaAttachments(item.attachments)
        }
      })
      .map((item) => newsPostSchema.parse(item))

    const sorted = sortNewsPostsByDate(items)

    if (sorted.length === 0) {
      return { status: 'empty', data: fallbackNews.slice(0, limit), source: 'fallback', message: 'Brak wpisów news w CMS.' }
    }

    return stateFromArray(sorted)
  } catch {
    return { status: 'error', data: fallbackNews.slice(0, limit), source: 'fallback', message: 'Nie udało się pobrać aktualności z CMS.' }
  }
}

export async function getEvents(limit = 6): Promise<EventItem[]> {
  const state = await getEventsState(limit)
  return state.data
}

export async function getEventsState(limit = 6): Promise<DataState<EventItem[]>> {
  try {
    const response = await fetchJsonState<unknown>(
      cmsPath(`/api/events?sort=startAt:asc&pagination[limit]=${limit}`),
      { headers: cmsHeaders(), revalidate: 300 }
    )
    if (response.status === 'error') {
      return { status: 'error', data: fallbackEvents.slice(0, limit), source: 'fallback', message: response.message }
    }

    const items = toNormalizedArray(response.payload)
      .map((item, index) => ({
        id: sanitizeText(item.id, String(index)),
        title: sanitizeText(item.title, sanitizeText(item.name, 'Wydarzenie')),
        slug: sanitizeText(item.slug, `event-${index}`),
        type: sanitizeText(item.type, 'other'),
        description: sanitizeText(item.description, ''),
        location: sanitizeText(item.location, ''),
        startAt: sanitizeText(item.startAt, ''),
        endAt: sanitizeText(item.endAt, ''),
        registrationUrl: sanitizeText(item.registrationUrl, '')
      }))
      .map((item) => eventSchema.parse(item))

    if (items.length === 0) {
      return { status: 'empty', data: fallbackEvents.slice(0, limit), source: 'fallback', message: 'Brak wydarzeń w CMS.' }
    }

    return stateFromArray(items)
  } catch {
    return { status: 'error', data: fallbackEvents.slice(0, limit), source: 'fallback', message: 'Nie udało się pobrać wydarzeń z CMS.' }
  }
}

export async function getDocuments(limit = 20): Promise<DocumentItem[]> {
  const state = await getDocumentsState(limit)
  return state.data
}

export async function getDocumentsState(limit = 20): Promise<DataState<DocumentItem[]>> {
  try {
    const response = await fetchJsonState<unknown>(
      cmsPath(`/api/documents?sort=effectiveDate:desc&pagination[limit]=${limit}`),
      { headers: cmsHeaders(), revalidate: 600 }
    )
    if (response.status === 'error') {
      return { status: 'error', data: fallbackDocuments.slice(0, limit), source: 'fallback', message: response.message }
    }

    const items = toNormalizedArray(response.payload)
      .map((item, index) => ({
        id: sanitizeText(item.id, String(index)),
        title: sanitizeText(item.title, 'Dokument'),
        slug: sanitizeText(item.slug, `document-${index}`),
        category: sanitizeText(item.category, 'other'),
        effectiveDate: sanitizeText(item.effectiveDate, ''),
        fileUrl: toAbsoluteCmsUrl(sanitizeText(item.fileUrl, ''))
      }))
      .map((item) => documentSchema.parse(item))

    if (items.length === 0) {
      return { status: 'empty', data: fallbackDocuments.slice(0, limit), source: 'fallback', message: 'Brak dokumentów w CMS.' }
    }

    return stateFromArray(items)
  } catch {
    return { status: 'error', data: fallbackDocuments.slice(0, limit), source: 'fallback', message: 'Nie udało się pobrać dokumentów z CMS.' }
  }
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
  const state = await getHomepageSectionsState()
  return state.data
}

export async function getHomepageSectionsState(): Promise<DataState<HomepageSection[]>> {
  try {
    const response = await fetchJsonState<unknown>(
      cmsPath('/api/homepage-sections?sort=order:asc&pagination[limit]=50'),
      { headers: cmsHeaders(), revalidate: 300 }
    )
    if (response.status === 'error') {
      return { status: 'error', data: fallbackHomepageSections, source: 'fallback', message: response.message }
    }

    const items = toNormalizedArray(response.payload)
      .map((item, index) => ({
        id: sanitizeText(item.id, String(index)),
        key: sanitizeText(item.key, `section-${index}`),
        title: sanitizeText(item.title, ''),
        subtitle: sanitizeText(item.subtitle, ''),
        body: sanitizeText(item.body, ''),
        order: sanitizeNumber(item.order, index),
        isEnabled: item.isEnabled !== false
      }))
      .filter((item) => item.isEnabled)
      .map((item) => homepageSectionSchema.parse(item))

    if (items.length === 0) {
      return { status: 'empty', data: fallbackHomepageSections, source: 'fallback', message: 'Brak sekcji homepage w CMS.' }
    }

    return stateFromArray(items)
  } catch {
    return { status: 'error', data: fallbackHomepageSections, source: 'fallback', message: 'Nie udało się pobrać sekcji homepage z CMS.' }
  }
}
