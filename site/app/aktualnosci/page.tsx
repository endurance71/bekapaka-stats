import type { Metadata } from 'next'
import Link from 'next/link'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { getNewsPosts, getSiteMetadataBase } from '../../lib/data'
import { formatDateTime } from '../../lib/format'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Aktualnosci | BeKaPaKa Bobolice',
  description: 'Najnowsze aktualnosci druzyny BeKaPaKa Bobolice.'
}

export default async function NewsPage() {
  const news = await getNewsPosts(20)

  return (
    <EditorialListingTemplate
      title='Aktualnosci'
      description='Najnowsze informacje, relacje i ogloszenia klubowe.'
      hasItems={news.length > 0}
      emptyTitle='Brak aktualnosci'
      emptyDescription='Po publikacji artykulow w CMS pojawia sie tutaj automatycznie.'
    >
      <div className='card-grid'>
        {news.map((item) => (
          <article key={item.id} className='content-card'>
            {item.coverImageUrl ? <img className='story-cover' src={item.coverImageUrl} alt={item.title} /> : null}
            <h2>{item.title}</h2>
            <p>{item.excerpt || 'Brak opisu.'}</p>
            <p className='muted'>{formatDateTime(item.publishedAt)}</p>
            <Link href={`/aktualnosci/${item.slug}`}>Czytaj wiecej</Link>
          </article>
        ))}
      </div>
    </EditorialListingTemplate>
  )
}
