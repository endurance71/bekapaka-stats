import { ListingPageHero } from '../shared/ListingPageHero'

export function PageScaffold({
  title,
  description,
  children,
  eyebrow = 'Sezon 2026'
}: {
  title: string
  description?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  children: React.ReactNode
  eyebrow?: string
}) {
  return (
    <div className='listing-page'>
      <div className='listing-page__hero'>
        <ListingPageHero title={title} description={description ?? ''} eyebrow={eyebrow} />
      </div>
      <div className='listing-page__body'>{children}</div>
    </div>
  )
}
