import type { NewsPost } from '../../../lib/data'
import { NewsCard } from './NewsCard'

export function FeaturedStory({ item }: { item: NewsPost }) {
  return <NewsCard item={item} featured />
}
