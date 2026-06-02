import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '../../components/public-site'
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
    <section className='section-card'>
      <PageHeader title='Aktualnosci' description='Najnowsze informacje, relacje i ogloszenia klubowe.' />
      <div className='card-grid'>
        {news.map((item) => (
          <article key={item.id} className='content-card'>
            <h2>{item.title}</h2>
            <p>{item.excerpt || 'Brak opisu.'}</p>
            <p className='muted'>{formatDateTime(item.publishedAt)}</p>
            <Link href={`/aktualnosci/${item.slug}`}>Czytaj wiecej</Link>
          </article>
        ))}
      </div>
    </section>
  )
}
