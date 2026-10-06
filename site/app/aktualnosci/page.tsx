import Link from 'next/link'
import { getNewsCategory, newsCategories } from '../../lib/news-category'
import { getAllNewsPosts } from '../../lib/data/cms'
import type { Metadata } from 'next'
import { EditorialNewsTemplate } from '../../components/public/templates/EditorialNewsTemplate'
import { FeaturedStory } from '../../components/public/shared/FeaturedStory'
import { NewsCard } from '../../components/public/shared/NewsCard'
import { NewsPagination } from '../../components/public/shared/NewsPagination'
import { EmptyState } from '../../components/public/shared/EmptyState'
import { getNewsPostsState, getSiteMetadataBase } from '../../lib/data'
import { draftMode } from 'next/headers'

export const revalidate = 60

const baseMetadata: Metadata = {
  ...getSiteMetadataBase(),
  alternates: { canonical: '/aktualnosci' },
  title: 'Aktualności | BeKaPaKa Bobolice',
  description: 'Najnowsze aktualności drużyny BeKaPaKa Bobolice.'
}

export async function generateMetadata({ searchParams }: { searchParams?: Promise<{ page?: string; category?: string }> }): Promise<Metadata> {
  const params = await searchParams
  const query = new URLSearchParams()
  if (params?.category) query.set('category', params.category)
  const page = Number.parseInt(params?.page || '1', 10)
  if (page > 1) query.set('page', String(page))
  return { ...baseMetadata, alternates: { canonical: `/aktualnosci${query.size ? `?${query}` : ''}` } }
}

export default async function NewsPage({ searchParams }: { searchParams?: Promise<{ page?: string; category?: string }> }) {
  const { isEnabled } = await draftMode()
  const category = (await searchParams)?.category || ''
  const rawPage = Number.parseInt((await searchParams)?.page || '1', 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const pageSize = 20
  const newsState = await getNewsPostsState(pageSize, { includeDrafts: isEnabled, start: (page - 1) * pageSize })
  const all = await getAllNewsPosts({ includeDrafts: isEnabled })
  const categories = newsCategories.filter(category => all.some(item => getNewsCategory(item) === category))
  const filtered = category ? all.filter(item => getNewsCategory(item) === category || item.tags?.includes(category)) : null
  const news = filtered ? filtered.slice((page - 1) * pageSize, page * pageSize) : newsState.data
  const pinnedIndex = news.findIndex((item) => item.isPinned)
  const featuredIndex = pinnedIndex >= 0 ? pinnedIndex : 0

  return (
    <EditorialNewsTemplate
      title='Z klubu'
      description='Relacje, zapowiedzi i ogłoszenia BeKaPaKa Bobolice.'
      hasItems={news.length > 0 || page > 1}
      stateStatus={newsState.status}
      stateSource={newsState.source}
      stateMessage={newsState.message}
      emptyTitle={newsState.status === 'error' ? 'Nie można pobrać aktualności' : 'Brak aktualności'}
      emptyDescription={newsState.status === 'error' ? 'Odśwież stronę lub wróć za chwilę.' : 'Nowe informacje pojawią się po publikacji przez klub.'}
    >
      <nav className='news-filters' aria-label='Kategorie aktualności'><Link href='/aktualnosci' aria-current={!category ? 'page' : undefined}>Wszystkie</Link>{categories.map(label => <Link key={label} href={`/aktualnosci?category=${encodeURIComponent(label)}`} aria-current={category === label ? 'page' : undefined}>{label}</Link>)}</nav>
      {news.length > 0 ? (
        <>
          <div className='editorial-news__featured'>
            <FeaturedStory item={news[featuredIndex]} />
          </div>
          <div className='news-grid'>
            {news.filter((_, index) => index !== featuredIndex).map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState mode='empty' title='Brak starszych aktualności' description='Wróć do poprzedniej strony listy.' />
      )}
      <NewsPagination category={category} page={page} hasNext={(filtered || all).length > page * pageSize} />
    </EditorialNewsTemplate>
  )
}
