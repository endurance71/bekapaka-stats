import { newsImageFit, isArchivedEvent } from '../../../lib/news-presentation'
import { getNewsCategory } from '../../../lib/news-category'
import { ArticleImageCarousel } from '../../../components/public/shared/ArticleImageCarousel'
import { serializeJsonLd } from '../../../lib/json-ld'
import { getAllNewsPosts } from '../../../lib/data/cms'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticleMarkdown, getArticleNavigation } from '../../../components/public/shared/ArticleMarkdown'
import { Band } from '../../../components/public/primitives/Band'
import { BandHead } from '../../../components/public/primitives/BandHead'
import { ArrowLink } from '../../../components/public/primitives/ArrowLink'
import { Story } from '../../../components/public/news/Story'
import { ArticleRelations } from '../../../components/public/shared/ArticleRelations'
import { NewsAttachments } from '../../../components/public/shared/NewsAttachments'
import { ViewTracker } from '../../../components/public/shared/ViewTracker'
import { EditorialDetailTemplate } from '../../../components/public/templates/EditorialDetailTemplate'
import { getNewsPosts, getSiteMetadataBase, type NewsPost } from '../../../lib/data'
import { calculateReadingTime, excerptFromContent, slugifyTitle } from '../../../lib/data/utils'
import { formatDateTime } from '../../../lib/format'
import { draftMode } from 'next/headers'

export const revalidate = 60

type Params = { slug: string }

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
  /** Pasmo pod artykułem: powiązane, dopełnione najnowszymi — do 6 historii. */
  more: NewsPost[]
  /** Kolumna boczna: najnowsze poza nowszym / starszym — razem do 5 pozycji. */
  latest: NewsPost[]
}

async function getNewsContext(slug: string): Promise<NewsContext> {
  const { isEnabled } = await draftMode()
  const includeDrafts = isEnabled
  const items = await getAllNewsPosts({ includeDrafts })
  const itemIndex = items.findIndex((item) => matchesNewsSlug(item, slug))
  const item = itemIndex >= 0 ? items[itemIndex] : null
  if (!item) return { item: null, related: [], more: [], latest: [] }

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
  const others = items.filter((candidate) => candidate.id !== item.id)
  const more = [...related, ...others.filter((candidate) => !related.includes(candidate))].slice(0, 6)
  const latest = others.filter((candidate) => candidate !== previous && candidate !== next).slice(0, 5 - [previous, next].filter(Boolean).length)

  return { item, previous, next, related, more, latest }
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
  const metaText = [formattedDate, readingTime, isArchivedEvent(item) ? 'Wydarzenie zakończone' : null].filter(Boolean).join(' · ')
  const leadText = item.excerpt || excerptFromContent(item.content)
  const isPoster = newsImageFit(item) === 'contain'
  const toc = getArticleNavigation(item.content, { contextTitle: item.title, mediaRecords: item.mediaRecords, mediaPreview: item.mediaPreview })

  return (
    <EditorialDetailTemplate
      sectionLabel={getNewsCategory(item) || 'Aktualności'}
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
              <ArticleImageCarousel variant="cover" images={[{ src: item.coverImageUrl, alt: item.coverImageAlt || `Okładka: ${item.title}`, width: item.coverImageWidth, height: item.coverImageHeight, author: item.mediaRecords?.find(record => record.url === item.coverImageUrl)?.author }]} />
            </div>
          ) : null
      }
      toc={toc}
      sidebar={<ArticleRelations previous={context.previous} next={context.next} latest={context.latest} />}
      more={
        context.more.length > 0 && (
          <Band theme='plyta' labelledBy='czytaj-dalej' className='article-more'>
            <BandHead kicker='Co jeszcze?' title='Czytaj dalej' titleId='czytaj-dalej' action={<ArrowLink href='/aktualnosci'>Wszystkie aktualności</ArrowLink>} />
            <div className='news-grid article-more__grid'>
              {context.more.map((story) => (
                <Story key={story.id} item={story} variant='grid' />
              ))}
            </div>
          </Band>
        )
      }
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
