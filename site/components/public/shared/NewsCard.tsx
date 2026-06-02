import Link from 'next/link'
import type { NewsPost } from '../../../lib/data'
import { formatDateTime } from '../../../lib/format'

export function NewsCard({
  item,
  featured = false
}: {
  item: NewsPost
  featured?: boolean
}) {
  return (
    <article className={`news-card ${featured ? 'news-card--featured' : ''}`}>
      <Link href={`/aktualnosci/${item.slug}`} className='news-card__link'>
        <div className='news-card__media'>
          {item.coverImageUrl ? (
            <img src={item.coverImageUrl} alt='' className='news-card__image' />
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
          <h2>{item.title}</h2>
          <p>{item.excerpt || 'Brak opisu.'}</p>
          <span className='news-card__cta'>Czytaj więcej</span>
        </div>
      </Link>
    </article>
  )
}
