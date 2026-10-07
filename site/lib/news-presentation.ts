import type { NewsPost } from './data/schemas'
// Explicit records verified in the local content inventory; no title/date guessing.
const knownEvents: Record<string, string> = {
  'szukamy-druzyny-otwarty-trening-2026': '2026-06-17T23:59:59+02:00',
  'iii-turniej-koszykowki-o-puchar-burmistrza-bobolic-26-wrzesnia-2026': '2026-09-26T23:59:59+02:00'
}
const knownPosters = new Set([
  'iii-turniej-koszykowki-o-puchar-burmistrza-bobolic-26-wrzesnia-2026'
])
export function newsImageFit(item: Pick<NewsPost, 'slug' | 'imageFit'>): 'cover' | 'contain' {
  return item.imageFit || (knownPosters.has(item.slug) ? 'contain' : 'cover')
}
/**
 * Kadrowanie okładki w kartach (3:2 / 16:10): zdjęcia o zbliżonych proporcjach kadrujemy, grafiki innych proporcji
 * (plakaty pionowe, kwadratowe i panoramiczne 16:9) pokazujemy w całości, żeby napisy przy krawędziach nie znikały.
 * Ustawienie `imageFit` w CMS ma pierwszeństwo.
 */
export function storyImageFit(item: Pick<NewsPost, 'slug' | 'imageFit' | 'coverImageWidth' | 'coverImageHeight'>): 'cover' | 'contain' {
  if (item.imageFit) return item.imageFit
  if (newsImageFit(item) === 'contain') return 'contain'
  const ratio = item.coverImageWidth && item.coverImageHeight ? item.coverImageWidth / item.coverImageHeight : null
  if (ratio === null) return 'cover'
  return ratio < 1.3 || ratio > 1.7 ? 'contain' : 'cover'
}
export function newsEventDate(item: Pick<NewsPost, 'slug' | 'eventDate'>): string | undefined {
  return item.eventDate || knownEvents[item.slug]
}
export function isArchivedEvent(item: Pick<NewsPost, 'slug' | 'eventDate'>, now = Date.now()): boolean {
  const date = newsEventDate(item)
  return !!date && Number.isFinite(Date.parse(date)) && Date.parse(date) < now
}
