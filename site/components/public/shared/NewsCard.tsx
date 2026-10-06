import Link from 'next/link'
import { newsImageFit, isArchivedEvent } from '../../../lib/news-presentation'
import type { NewsPost } from '../../../lib/data'
import { getStrapiMediaProps } from '../../../lib/data/media'
import { getNewsCategory } from '../../../lib/news-category'
import { formatDate } from '../../../lib/format'
import { bindPolishOrphans } from '../../../lib/typography'
import { FallbackImage } from './FallbackImage'

export function NewsCard({
  item,
  featured = false,
  compact = false
}: {
  item: NewsPost
  featured?: boolean
  compact?: boolean
}) {
  const imageFit = newsImageFit(item)
  const category = getNewsCategory(item)

  return (
    <article className={`news-card ${featured ? 'news-card--featured' : ''}${compact ? ' news-card--compact' : ''} news-card--image-${imageFit}`}>
      <Link href={`/aktualnosci/${item.slug}`} className='news-card__link'>
        <div className='news-card__media'>
          {item.coverImageUrl ? (
            <FallbackImage
              {...getStrapiMediaProps(item.coverImageUrl, {
                isCover: featured,
                sources: item.coverImageSources,
                width: item.coverImageWidth,
                height: item.coverImageHeight,
                sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px'
              })}
              alt={item.coverImageAlt || ''}
              className='news-card__image'
              fallbackSrc={item.coverImageUrl}
              fallback={
                <div className='news-card__placeholder' aria-hidden='true'><span>BeKaPaKa</span></div>
              }
              fetchPriority={featured ? 'high' : 'auto'}
            />
          ) : (
            <div className='news-card__placeholder' aria-hidden='true'>
              <span>BeKaPaKa</span>
            </div>
          )}

        </div>
        <div className='news-card__body'>
          <div className='news-card__meta-bar'>
            {category ? <span className='news-card__category'>{category}</span> : null}
            {isArchivedEvent(item) && (
              <span className='news-card__archival-badge' title='Termin wydarzenia minął'>Wydarzenie zakończone</span>
            )}
          </div>
          <h2>{bindPolishOrphans(item.title)}</h2>
          <p>{bindPolishOrphans(item.excerpt || 'Brak opisu.')}</p>
          <div className='news-card__foot'><time className='news-card__date' dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time><span aria-hidden='true'>→</span><span className='sr-only'>Czytaj więcej</span></div>
        </div>
      </Link>
    </article>
  )
}
