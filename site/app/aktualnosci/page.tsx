import type { Metadata } from 'next'
import { EditorialNewsTemplate } from '../../components/public/templates/EditorialNewsTemplate'
import { FeaturedStory } from '../../components/public/shared/FeaturedStory'
import { NewsCard } from '../../components/public/shared/NewsCard'
import { NewsPagination } from '../../components/public/shared/NewsPagination'
import { EmptyState } from '../../components/public/shared/EmptyState'
import { getNewsPostsState, getSiteMetadataBase } from '../../lib/data'
import { draftMode } from 'next/headers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Aktualnosci | BeKaPaKa Bobolice',
  description: 'Najnowsze aktualnosci druzyny BeKaPaKa Bobolice.'
}

export default async function NewsPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const { isEnabled } = await draftMode()
  const rawPage = Number.parseInt((await searchParams)?.page || '1', 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const pageSize = 20
  const newsState = await getNewsPostsState(pageSize, { includeDrafts: isEnabled, start: (page - 1) * pageSize })
  const news = newsState.data
  const pinnedIndex = news.findIndex((item) => item.isPinned)
  const featuredIndex = pinnedIndex >= 0 ? pinnedIndex : 0

  return (
    <EditorialNewsTemplate
      title='Aktualności'
      description='Najnowsze informacje, relacje i ogłoszenia klubowe.'
      hasItems={news.length > 0 || page > 1}
      stateStatus={newsState.status}
      stateSource={newsState.source}
      stateMessage={newsState.message}
      emptyTitle={newsState.status === 'error' ? 'Nie można pobrać aktualności' : 'Brak aktualności'}
      emptyDescription={newsState.status === 'error' ? 'Sprawdź konfigurację CMS i połączenie z API.' : 'Po publikacji artykułów w CMS pojawią się tutaj automatycznie.'}
    >
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
      <NewsPagination page={page} hasNext={news.length === pageSize} />
    </EditorialNewsTemplate>
  )
}
