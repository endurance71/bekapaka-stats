import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticleMarkdown } from '../../../components/public/shared/ArticleMarkdown'
import { NewsAttachments } from '../../../components/public/shared/NewsAttachments'
import { EditorialDetailTemplate } from '../../../components/public/templates/EditorialDetailTemplate'
import { getNewsPosts, getSiteMetadataBase, type NewsPost } from '../../../lib/data'
import { slugifyTitle } from '../../../lib/data/utils'
import { formatDateTime } from '../../../lib/format'

export const dynamic = 'force-dynamic'

type Params = { slug: string }

function matchesNewsSlug(item: NewsPost, rawSlug: string): boolean {
  const slug = decodeURIComponent(rawSlug).trim()
  if (item.slug === slug) return true
  return slugifyTitle(item.title) === slug
}

async function getNewsBySlug(slug: string): Promise<NewsPost | null> {
  const items = await getNewsPosts(200)
  return items.find((item) => matchesNewsSlug(item, slug)) || null
}

export async function generateStaticParams() {
  const items = await getNewsPosts(100)
  return items.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const item = await getNewsBySlug(slug)
  if (!item) return { title: 'Aktualnosc | BeKaPaKa Bobolice' }
  return {
    ...getSiteMetadataBase(),
    title: `${item.title} | BeKaPaKa Bobolice`,
    description: item.excerpt || 'Aktualnosc BeKaPaKa Bobolice'
  }
}

export default async function NewsDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const item = await getNewsBySlug(slug)
  if (!item) notFound()

  return (
    <EditorialDetailTemplate
      sectionLabel='Aktualnosci'
      title={item.title}
      meta={formatDateTime(item.publishedAt)}
      parentHref='/aktualnosci'
      content={
        <>
          {item.coverImageUrl ? (
            <div className='article-detail__cover'>
              <img src={item.coverImageUrl} alt='' className='article-detail__cover-image' />
            </div>
          ) : null}
          <div className='article-content'>
            <ArticleMarkdown content={item.content} />
          </div>
          <NewsAttachments items={item.attachments} />
        </>
      }
    />
  )
}
