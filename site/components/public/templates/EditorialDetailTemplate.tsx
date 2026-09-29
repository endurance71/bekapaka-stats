import Link from 'next/link'

export function EditorialDetailTemplate({
  sectionLabel,
  title,
  meta,
  lead,
  content,
  parentHref,
  parentLabel = 'Wróć do listy'
}: {
  sectionLabel: string
  title: string
  meta?: string
  lead?: string
  content: React.ReactNode
  parentHref: string
  parentLabel?: string
}) {
  return (
    <article className='article-detail'>
      <div className='article-detail__shell'>
        <nav className='article-detail__nav' aria-label='Nawigacja powrotna'>
          <Link href={parentHref} className='article-detail__back-link'>
            <span aria-hidden='true' className='article-detail__back-arrow'>←</span>
            <span>{parentLabel}</span>
          </Link>
        </nav>

        <div className='article-detail__card surface-card'>
          <header className='article-detail__header'>
            {sectionLabel ? <p className='article-detail__eyebrow'>{sectionLabel}</p> : null}
            <h1 className='article-detail__title'>{title}</h1>
            {meta ? (
              <div className='article-detail__meta-wrap'>
                <span className='article-detail__meta'>{meta}</span>
              </div>
            ) : null}
          </header>

          {lead ? (
            <div className='article-detail__lead-wrap'>
              <p className='article-detail__lead'>{lead}</p>
            </div>
          ) : null}

          <div className='article-detail__content'>{content}</div>
        </div>
      </div>
    </article>
  )
}
