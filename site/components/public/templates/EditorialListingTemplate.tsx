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
  eyebrow = 'Sezon 2026'
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
  eyebrow?: string
}) {
  return (
    <section className='listing-page'>
      <article className='surface-card listing-page__hero'>
        <ListingPageHero title={title} description={description} eyebrow={eyebrow} />
      </article>

      <DataStateNotice status={stateStatus} source={stateSource} message={stateMessage} />

      <article className='surface-card listing-page__body'>
        {hasItems ? children : (
          <EmptyState
            mode={stateStatus === 'error' ? 'error' : 'empty'}
            title={emptyTitle}
            description={emptyDescription}
          />
        )}
      </article>
    </section>
  )
}
