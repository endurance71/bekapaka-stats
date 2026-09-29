import Link from 'next/link'
import { bindPolishOrphans } from '../../../lib/typography'
import { ShareActions } from '../shared/ShareActions'

export function EditorialDetailTemplate({
  sectionLabel,
  title,
  meta,
  lead,
  author,
  tags,
  share = false,
  content,
  parentHref,
  parentLabel = 'Wróć do listy'
}: {
  sectionLabel: string
  title: string
  meta?: string
  lead?: string
  author?: string
  tags?: string[]
  share?: boolean
  content: React.ReactNode
  parentHref: string
  parentLabel?: string
}) {
  return (
    <article className='article-detail'>
      <div className='article-detail__shell'>
        <nav className='article-detail__nav' aria-label='Nawigacja powrotna'>
          <ol className='article-detail__breadcrumbs'>
            <li><Link href={parentHref}>{sectionLabel || 'Aktualności'}</Link></li>
            <li aria-current='page'>{title}</li>
          </ol>
          <Link href={parentHref} className='article-detail__back-link'>
            <span aria-hidden='true' className='article-detail__back-arrow'>←</span>
            <span>{parentLabel}</span>
          </Link>
        </nav>

        <div className='article-detail__card'>
          <header className='article-detail__header'>
            {sectionLabel ? <p className='article-detail__eyebrow'>{sectionLabel}</p> : null}
            <h1 className='article-detail__title'>{bindPolishOrphans(title)}</h1>
            {lead ? (
              <div className='article-detail__lead-wrap'>
                <p className='article-detail__lead'>{bindPolishOrphans(lead)}</p>
              </div>
            ) : null}
            {meta || author || share ? (
              <div className='article-detail__meta-wrap'>
                {meta ? <span className='article-detail__meta'>{meta}</span> : null}
                {author ? <span className='article-detail__author'>{author}</span> : null}
                {share ? <ShareActions /> : null}
              </div>
            ) : null}
            {tags && tags.length > 0 ? (
              <ul className='article-detail__tags' aria-label='Tagi artykułu'>
                {tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
            ) : null}
          </header>

          <div className='article-detail__content'>{content}</div>
        </div>
      </div>
    </article>
  )
}
