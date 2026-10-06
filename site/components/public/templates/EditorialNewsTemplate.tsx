import type { DataStateSource, DataStateStatus } from '../../../lib/data'
import { DataStateNotice } from '../shared/DataStateNotice'
import { EmptyState } from '../shared/EmptyState'
import { ListingPageHero } from '../shared/ListingPageHero'

export function EditorialNewsTemplate({
  title,
  description,
  children,
  hasItems,
  stateStatus = 'ok',
  stateSource = 'live',
  stateMessage,
  emptyTitle,
  emptyDescription
}: {
  title: string
  description: string
  children: React.ReactNode
  hasItems: boolean
  stateStatus?: DataStateStatus
  stateSource?: DataStateSource
  stateMessage?: string
  emptyTitle: string
  emptyDescription: string
}) {
  return (
    <section className='editorial-news-page' data-theme='papier'>
      <div className='listing-page__hero'>
        <ListingPageHero title={title} description={description} eyebrow="Aktualności" />
      </div>

      <DataStateNotice status={stateStatus} source={stateSource} message={stateMessage} />

      <div className='editorial-news-page__body'>
        {hasItems ? children : (
          <EmptyState
            mode={stateStatus === 'error' ? 'error' : 'empty'}
            title={emptyTitle}
            description={emptyDescription}
          />
        )}
      </div>
    </section>
  )
}
