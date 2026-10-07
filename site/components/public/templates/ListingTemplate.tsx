import type { ReactNode } from 'react'
import type { DataStateSource, DataStateStatus } from '../../../lib/data'
import { DataStateNotice } from '../shared/DataStateNotice'
import { EmptyState } from '../shared/EmptyState'
import { PageHeader, type Crumb } from '../primitives/PageHeader'

/** Podstrona listingu: nagłówek strony + stany danych + treść w paśmie tego samego materiału. */
export function ListingTemplate({
  kicker,
  title,
  lead,
  crumbs,
  theme = 'plyta',
  headerExtra,
  headerAside,
  children,
  hasItems,
  stateStatus = 'ok',
  stateSource = 'live',
  stateMessage,
  emptyTitle,
  emptyDescription,
  emptyAction
}: {
  kicker?: string
  title: ReactNode
  lead?: ReactNode
  crumbs?: Crumb[]
  theme?: 'plyta' | 'papier'
  headerExtra?: ReactNode
  headerAside?: ReactNode
  children: ReactNode
  hasItems: boolean
  stateStatus?: DataStateStatus
  stateSource?: DataStateSource
  stateMessage?: string
  emptyTitle: string
  emptyDescription: string
  emptyAction?: ReactNode
}) {
  return (
    <div className="listing" data-theme={theme}>
      <PageHeader kicker={kicker} title={title} lead={lead} crumbs={crumbs} theme={theme} aside={headerAside}>
        {headerExtra}
      </PageHeader>
      <div className="container listing__body">
        <DataStateNotice status={stateStatus} source={stateSource} message={stateMessage} />
        {hasItems ? (
          children
        ) : (
          <EmptyState mode={stateStatus === 'error' ? 'error' : 'empty'} title={emptyTitle} description={emptyDescription} action={emptyAction} />
        )}
      </div>
    </div>
  )
}
