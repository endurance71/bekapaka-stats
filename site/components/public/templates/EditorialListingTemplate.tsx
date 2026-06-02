import Link from 'next/link'
import { Breadcrumbs, PageHeader } from '../../public-site'
import { ClubLogo } from '../shared/ClubLogo'
import { EmptyState } from '../shared/EmptyState'

export function EditorialListingTemplate({
  title,
  description,
  children,
  hasItems,
  emptyTitle,
  emptyDescription
}: {
  title: string
  description: string
  children: React.ReactNode
  hasItems: boolean
  emptyTitle: string
  emptyDescription: string
}) {
  return (
    <section className='section-card'>
      <Breadcrumbs items={[{ label: 'Start', href: '/' }, { label: title }]} />
      <div className='listing-top'>
        <PageHeader title={title} description={description} />
        <ClubLogo compact />
      </div>
      <p className='listing-quick-links'>
        <Link href='/tabela'>Tabela</Link> · <Link href='/sklad'>Sklad</Link> · <Link href='/sponsorzy'>Sponsorzy</Link>
      </p>
      {hasItems ? children : <EmptyState title={emptyTitle} description={emptyDescription} />}
    </section>
  )
}
