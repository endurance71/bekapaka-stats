export function ListingPageHero({
  title,
  description,
  eyebrow = 'Sezon 2026'
}: {
  title: string
  description: string
  eyebrow?: string
}) {
  return (
    <header>
      <p className='listing-page__eyebrow'>{eyebrow}</p>
      <h1>{title}</h1>
      {description ? <p className='listing-page__lead'>{description}</p> : null}
    </header>
  )
}
