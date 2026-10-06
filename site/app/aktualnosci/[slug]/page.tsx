import { serializeJsonLd } from '../../../lib/json-ld'
import { getAllNewsPosts } from '../../../lib/data/cms'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticleMarkdown } from '../../../components/public/shared/ArticleMarkdown'
import { ArticleRelations } from '../../../components/public/shared/ArticleRelations'
import { FallbackImage } from '../../../components/public/shared/FallbackImage'
import { NewsAttachments } from '../../../components/public/shared/NewsAttachments'
import { ViewTracker } from '../../../components/public/shared/ViewTracker'
import { EditorialDetailTemplate } from '../../../components/public/templates/EditorialDetailTemplate'
import { getNewsPosts, getSiteMetadataBase, type NewsPost } from '../../../lib/data'
import { getStrapiMediaProps } from '../../../lib/data/media'
import { calculateReadingTime, excerptFromContent, slugifyTitle } from '../../../lib/data/utils'
import { formatDateTime } from '../../../lib/format'
import { draftMode } from 'next/headers'

export const revalidate = 60

type Params = { slug: string }

function formatViewsCount(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (count === 1) return '1 wyświetlenie'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} wyświetlenia`
  }
  return `${count} wyświetleń`
}

function matchesNewsSlug(item: NewsPost, rawSlug: string): boolean {
  const slug = decodeURIComponent(rawSlug).trim()
  if (item.slug === slug) return true
  return slugifyTitle(item.title) === slug
}

type NewsContext = {
  item: NewsPost | null
  previous?: NewsPost
  next?: NewsPost
  related: NewsPost[]
}

async function getNewsContext(slug: string): Promise<NewsContext> {
  const { isEnabled } = await draftMode()
  const includeDrafts = isEnabled
  const items = await getAllNewsPosts({ includeDrafts })
  const itemIndex = items.findIndex((item) => matchesNewsSlug(item, slug))
  const item = itemIndex >= 0 ? items[itemIndex] : null
  if (!item) return { item: null, related: [] }

  const previous = items[itemIndex + 1]
  const next = items[itemIndex - 1]
  const related = items
    .filter((candidate) => candidate.id !== item.id)
    .filter((candidate) => {
      const sameType = item.type && candidate.type && item.type === candidate.type
      const sameTag = item.tags?.some((tag) => candidate.tags?.includes(tag))
      return Boolean(sameType || sameTag)
    })
    .slice(0, 3)

  return { item, previous, next, related }
}

async function getNewsBySlug(slug: string): Promise<NewsPost | null> {
  return (await getNewsContext(slug)).item
}

export async function generateStaticParams() {
  const items = await getNewsPosts(100)
  return items.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const item = await getNewsBySlug(slug)
  if (!item) return { title: 'Aktualność | BeKaPaKa Bobolice' }
  return {
    ...getSiteMetadataBase(),
    title: `${item.title} | BeKaPaKa Bobolice`,
    description: item.excerpt || 'Aktualność BeKaPaKa Bobolice',
    alternates: { canonical: `/aktualnosci/${item.slug}` },
    robots: (await draftMode()).isEnabled ? { index: false, follow: false } : undefined,
    openGraph: { ...getSiteMetadataBase().openGraph, type: 'article', images: [{ url: `/api/og?type=news&id=${encodeURIComponent(item.slug)}`, width: 1200, height: 630 }] }
  }
}

export default async function NewsDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const context = await getNewsContext(slug)
  const item = context.item
  if (!item) notFound()

  const formattedDate = formatDateTime(item.publishedAt)
  const readingTime = calculateReadingTime(item.content)
  const viewsText = typeof item.views === 'number' && item.views > 0 ? formatViewsCount(item.views) : null
  const metaText = [formattedDate, readingTime, viewsText].filter(Boolean).join(' · ')
  const leadText = item.excerpt || excerptFromContent(item.content)
  const isPoster =
    item.type?.toLowerCase().includes('turniej') ||
    item.slug.includes('turniej') ||
    Boolean(item.tags?.some((t) => /turniej|plakat|afisz/i.test(t)))

  return (
    <EditorialDetailTemplate
      sectionLabel={item.type || 'Aktualności'}
      title={item.title}
      meta={metaText}
      lead={leadText}
      author={item.author || 'Redakcja BeKaPaKa'}
      tags={item.tags}
      share
      parentHref='/aktualnosci'
      parentLabel='Wróć do aktualności'
      coverFit={isPoster ? 'contain' : 'cover'}
      cover={
        item.coverImageUrl ? (
            <div className={`article-detail__cover-media${isPoster ? ' article-detail__cover-media--contain' : ''}`}>
              <FallbackImage
                {...getStrapiMediaProps(item.coverImageUrl, {
                  isCover: true,
                  sources: item.coverImageSources,
                  width: item.coverImageWidth,
                  height: item.coverImageHeight,
                  sizes: '(max-width: 1023px) 100vw, 42vw'
                })}
                alt={item.coverImageAlt || ''}
                className='article-detail__cover-image'
                fallbackSrc={item.coverImageUrl}
                fetchPriority='high'
              />
            </div>
          ) : null
      }
      sidebar={<ArticleRelations related={context.related} previous={context.previous} next={context.next} />}
      content={
        <>
          <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: serializeJsonLd({ '@context': 'https://schema.org', '@type': 'NewsArticle', headline: item.title, datePublished: item.publishedAt, dateModified: item.updatedAt || item.publishedAt, author: { '@type': 'Organization', name: item.author || 'BeKaPaKa Bobolice' }, mainEntityOfPage: `https://bekapaka.pl/aktualnosci/${item.slug}` }) }}/>
          <ViewTracker slug={item.slug} />
          <div className='article-content'>
            <ArticleMarkdown content={item.content} contextTitle={item.title} mediaRecords={item.mediaRecords} mediaPreview={item.mediaPreview} />
          </div>
          <NewsAttachments items={item.attachments} />
        </>
      }
    />
  )
}
