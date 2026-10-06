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
export function newsEventDate(item: Pick<NewsPost, 'slug' | 'eventDate'>): string | undefined {
  return item.eventDate || knownEvents[item.slug]
}
export function isArchivedEvent(item: Pick<NewsPost, 'slug' | 'eventDate'>, now = Date.now()): boolean {
  const date = newsEventDate(item)
  return !!date && Number.isFinite(Date.parse(date)) && Date.parse(date) < now
}
