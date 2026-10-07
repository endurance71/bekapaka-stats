import Link from 'next/link'
import type { NewsPost } from '../../../lib/data'
import { getStrapiMediaProps } from '../../../lib/data/media'
import { formatDate } from '../../../lib/format'
import { getNewsCategory } from '../../../lib/news-category'
import { isArchivedEvent, storyImageFit } from '../../../lib/news-presentation'
import { bindPolishOrphans } from '../../../lib/typography'
import { FallbackImage } from '../shared/FallbackImage'

type Variant = 'lead' | 'item' | 'grid' | 'row'

const sizes: Record<Variant, string> = {
  lead: '(min-width: 1024px) 58vw, 100vw',
  item: '(min-width: 1024px) 20vw, 38vw',
  grid: '(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw',
  row: '1px'
}

/**
 * Historia w hierarchii redakcyjnej: wiodąca (lead), drugorzędna (item), siatka listingu (grid), feed (row).
 * Cała historia jest jednym linkiem; brak ramek i teł — zdjęcie, kategoria, tytuł, data.
 */
export function Story({
  item,
  variant = 'grid',
  priority = false,
  headingLevel = 'h3'
}: {
  item: NewsPost
  variant?: Variant
  priority?: boolean
  headingLevel?: 'h2' | 'h3'
}) {
  // Plakaty i grafiki innych proporcji niż zdjęcie pokazujemy w całości na czerni; zdjęcia kadrujemy.
  const fit = storyImageFit(item)
  const category = getNewsCategory(item)
  const Heading = headingLevel
  const archived = isArchivedEvent(item)

  if (variant === 'row')
    return (
      <Link className="story story--row" href={`/aktualnosci/${item.slug}`}>
        <time className="story__date" dateTime={item.publishedAt}>
          {formatDate(item.publishedAt)}
        </time>
        <span className="story__category">{category}</span>
        <Heading className="story__title">{bindPolishOrphans(item.title)}</Heading>
      </Link>
    )

  return (
    <article className={`story story--${variant} story--image-${fit}`}>
      <Link className="story__link" href={`/aktualnosci/${item.slug}`}>
        <span className="story__media">
          {item.coverImageUrl ? (
            <FallbackImage
              {...getStrapiMediaProps(item.coverImageUrl, {
                isCover: priority,
                sources: item.coverImageSources,
                width: item.coverImageWidth,
                height: item.coverImageHeight,
                sizes: sizes[variant]
              })}
              alt={item.coverImageAlt || ''}
              fallbackSrc={item.coverImageUrl}
              fallback={<StoryPlaceholder />}
              fetchPriority={priority ? 'high' : 'auto'}
              loading={priority ? 'eager' : 'lazy'}
            />
          ) : (
            <StoryPlaceholder />
          )}
        </span>
        <span className="story__body">
          <span className="story__labels">
            <span className="story__category">{category}</span>
            {archived && <span className="story__flag">Wydarzenie zakończone</span>}
          </span>
          <Heading className="story__title">
            <span>{bindPolishOrphans(item.title)}</span>
          </Heading>
          {variant !== 'item' && item.excerpt && <span className="story__excerpt">{bindPolishOrphans(item.excerpt)}</span>}
          <time className="story__date" dateTime={item.publishedAt}>
            {formatDate(item.publishedAt)}
          </time>
        </span>
      </Link>
    </article>
  )
}

function StoryPlaceholder() {
  return (
    <span className="story__placeholder" aria-hidden="true">
      <span>BeKaPaKa</span>
    </span>
  )
}
