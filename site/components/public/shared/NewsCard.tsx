import Link from 'next/link'
import type { NewsPost } from '../../../lib/data'
import { getStrapiMediaProps } from '../../../lib/data/media'
import { formatDateTime } from '../../../lib/format'
import { bindPolishOrphans } from '../../../lib/typography'
import { FallbackImage } from './FallbackImage'

export function NewsCard({
  item,
  featured = false
}: {
  item: NewsPost
  featured?: boolean
}) {
  const imageFit = item.imageFit || 'cover'
  const category = item.type || item.tags?.[0]

  return (
    <article className={`news-card ${featured ? 'news-card--featured' : ''} news-card--image-${imageFit}`}>
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
              alt=''
              className='news-card__image'
              fallbackSrc={item.coverImageUrl}
              fallback={
                <div className='news-card__placeholder' aria-label='Grafika artykułu niedostępna'>
                  <span>BKP</span>
                </div>
              }
              fetchPriority={featured ? 'high' : 'auto'}
            />
          ) : (
            <div className='news-card__placeholder' aria-hidden='true'>
              <span>BKP</span>
            </div>
          )}
          <div className='news-card__media-overlay' aria-hidden='true' />
          <time className='news-card__date' dateTime={item.publishedAt}>
            {formatDateTime(item.publishedAt)}
          </time>
        </div>
        <div className='news-card__body'>
          {category ? <span className='news-card__category'>{category}</span> : null}
          <h2>{bindPolishOrphans(item.title)}</h2>
          <p>{bindPolishOrphans(item.excerpt || 'Brak opisu.')}</p>
          <span className='news-card__cta'>Czytaj więcej</span>
        </div>
      </Link>
    </article>
  )
}
