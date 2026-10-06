import type { NewsPost } from './data/schemas'
export const newsCategories = ['Mecze', 'Turniej', 'Drużyna', 'Klub'] as const
export function getNewsCategory(item: Pick<NewsPost, 'type' | 'tags' | 'title'>): string {
  const text = [item.type, item.title, ...(item.tags || [])].filter(Boolean).join(' ').toLocaleLowerCase('pl')
  if (/turniej|parafiad|puchar/.test(text)) return 'Turniej'
  if (/trening|nabór|nabor|skład|sklad|szukasz drużyny/.test(text)) return 'Drużyna'
  if (/mecz|kolejka|relacja ligowa/.test(text)) return 'Mecze'
  return 'Klub'
}
