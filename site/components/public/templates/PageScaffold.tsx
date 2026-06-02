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
      <article className='surface-card listing-page__hero'>
        <ListingPageHero title={title} description={description ?? ''} eyebrow={eyebrow} />
      </article>
      <article className='surface-card listing-page__body'>{children}</article>
    </div>
  )
}
