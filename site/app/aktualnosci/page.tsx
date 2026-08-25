import type { Metadata } from 'next'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { NewsCard } from '../../components/public/shared/NewsCard'
import { getNewsPostsState, getSiteMetadataBase } from '../../lib/data'
import { draftMode } from 'next/headers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Aktualnosci | BeKaPaKa Bobolice',
  description: 'Najnowsze aktualnosci druzyny BeKaPaKa Bobolice.'
}

export default async function NewsPage() {
  const { isEnabled } = await draftMode()
  const newsState = await getNewsPostsState(20, { includeDrafts: isEnabled })
  const news = newsState.data

  return (
    <EditorialListingTemplate
      title='Aktualności'
      description='Najnowsze informacje, relacje i ogłoszenia klubowe.'
      hasItems={news.length > 0}
      stateStatus={newsState.status}
      stateSource={newsState.source}
      stateMessage={newsState.message}
      emptyTitle={newsState.status === 'error' ? 'Nie można pobrać aktualności' : 'Brak aktualności'}
      emptyDescription={newsState.status === 'error' ? 'Sprawdź konfigurację CMS i połączenie z API.' : 'Po publikacji artykułów w CMS pojawią się tutaj automatycznie.'}
    >
      <div className='news-grid'>
        {news.map((item, index) => (
          <NewsCard key={item.id} item={item} featured={index === 0} />
        ))}
      </div>
    </EditorialListingTemplate>
  )
}
