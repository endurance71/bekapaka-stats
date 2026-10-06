import type { DataStateSource, DataStateStatus } from '../../../lib/data'
import { DataStateNotice } from '../shared/DataStateNotice'
import { EmptyState } from '../shared/EmptyState'
import { ListingPageHero } from '../shared/ListingPageHero'

export function EditorialListingTemplate({
  title,
  description,
  children,
  hasItems,
  stateStatus = 'ok',
  stateSource = 'live',
  stateMessage,
  emptyTitle,
  emptyDescription,
  emptyAction,
  eyebrow = '',
  theme = 'plyta'
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
  emptyAction?: React.ReactNode
  eyebrow?: string
  theme?: 'plyta' | 'papier'
}) {
  return (
    <section className='listing-page' data-theme={theme}>
      <div className='listing-page__hero'>
        <ListingPageHero title={title} description={description} eyebrow={eyebrow} />
      </div>

      <DataStateNotice status={stateStatus} source={stateSource} message={stateMessage} />

      <div className='listing-page__body'>
        {hasItems ? children : (
          <EmptyState
            mode={stateStatus === 'error' ? 'error' : 'empty'}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        )}
      </div>
    </section>
  )
}
