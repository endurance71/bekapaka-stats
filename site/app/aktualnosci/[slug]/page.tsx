import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticleMarkdown } from '../../../components/public/shared/ArticleMarkdown'
import { NewsAttachments } from '../../../components/public/shared/NewsAttachments'
import { EditorialDetailTemplate } from '../../../components/public/templates/EditorialDetailTemplate'
import { getNewsPosts, getSiteMetadataBase, type NewsPost } from '../../../lib/data'
import { getStrapiMediaProps } from '../../../lib/data/media'
import { calculateReadingTime, excerptFromContent, slugifyTitle } from '../../../lib/data/utils'
import { formatDateTime } from '../../../lib/format'
import { draftMode } from 'next/headers'

export const dynamic = 'force-dynamic'

type Params = { slug: string }

function matchesNewsSlug(item: NewsPost, rawSlug: string): boolean {
  const slug = decodeURIComponent(rawSlug).trim()
  if (item.slug === slug) return true
  return slugifyTitle(item.title) === slug
}

async function getNewsBySlug(slug: string): Promise<NewsPost | null> {
  const { isEnabled } = await draftMode()
  const includeDrafts = isEnabled || process.env.INCLUDE_DRAFTS === 'true'
  const items = await getNewsPosts(200, { includeDrafts })
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

  const formattedDate = formatDateTime(item.publishedAt)
  const readingTime = calculateReadingTime(item.content)
  const metaText = formattedDate ? `${formattedDate} · ${readingTime}` : readingTime
  const leadText = item.excerpt || excerptFromContent(item.content)

  return (
    <EditorialDetailTemplate
      sectionLabel='Aktualności'
      title={item.title}
      meta={metaText}
      lead={leadText}
      parentHref='/aktualnosci'
      parentLabel='Wróć do aktualności'
      content={
        <>
          {item.coverImageUrl ? (
            <div className='article-detail__cover'>
              <img
                {...getStrapiMediaProps(item.coverImageUrl, { isCover: true })}
                alt={item.title}
                className='article-detail__cover-image'
                fetchPriority='high'
              />
            </div>
          ) : null}
          <div className='article-content'>
            <ArticleMarkdown content={item.content} contextTitle={item.title} />
          </div>
          <NewsAttachments items={item.attachments} />
        </>
      }
    />
  )
}
