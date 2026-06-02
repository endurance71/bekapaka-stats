import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EditorialDetailTemplate } from '../../../components/public/templates/EditorialDetailTemplate'
import { getNewsPosts, getSiteMetadataBase, type NewsPost } from '../../../lib/data'
import { formatDateTime } from '../../../lib/format'

export const dynamic = 'force-dynamic'

type Params = { slug: string }

async function getNewsBySlug(slug: string): Promise<NewsPost | null> {
  const items = await getNewsPosts(200)
  return items.find((item) => item.slug === slug) || null
}

export async function generateStaticParams() {
  const items = await getNewsPosts(100)
  return items.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const item = await getNewsBySlug(params.slug)
  if (!item) return { title: 'Aktualnosc | BeKaPaKa Bobolice' }
  return {
    ...getSiteMetadataBase(),
    title: `${item.title} | BeKaPaKa Bobolice`,
    description: item.excerpt || 'Aktualnosc BeKaPaKa Bobolice'
  }
}

export default async function NewsDetailPage({ params }: { params: Params }) {
  const item = await getNewsBySlug(params.slug)
  if (!item) notFound()

  return (
    <EditorialDetailTemplate
      sectionLabel='Aktualnosci'
      title={item.title}
      meta={formatDateTime(item.publishedAt)}
      parentHref='/aktualnosci'
      content={
        <>
          <p>{item.excerpt}</p>
          <div className='article-content'>
            <p>{item.content || 'Tresc artykulu zostanie uzupelniona przez redakcje.'}</p>
          </div>
        </>
      }
    />
  )
}
