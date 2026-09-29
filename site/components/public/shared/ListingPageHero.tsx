export function ListingPageHero({
  title,
  description,
  eyebrow = ''
}: {
  title: string
  description: string
  eyebrow?: string
}) {
  return (
    <header>
      {eyebrow ? <p className='listing-page__eyebrow'>{eyebrow}</p> : null}
      <h1>{title}</h1>
      {description ? <p className='listing-page__lead'>{description}</p> : null}
    </header>
  )
}
