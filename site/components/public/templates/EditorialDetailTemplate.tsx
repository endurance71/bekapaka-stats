import { serializeJsonLd } from '../../../lib/json-ld'
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
  cover,
  coverFit = 'cover',
  parentHref,
  parentLabel = 'Wróć do listy',
  theme = 'papier',
  sidebar
}: {
  sectionLabel: string
  title: string
  meta?: string
  lead?: string
  author?: string
  tags?: string[]
  share?: boolean
  content: React.ReactNode
  cover?: React.ReactNode
  coverFit?: 'cover' | 'contain'
  parentHref: string
  parentLabel?: string
  theme?: 'papier' | 'plyta'
  sidebar?: React.ReactNode
}) {
  return (
    <article
      className={`article-detail${theme === 'plyta' ? ' article-detail--sport' : ''}${cover ? '' : ' article-detail--no-cover'}`}
      data-theme={theme}
    >
      <div className="article-detail__shell">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: sectionLabel,
                  item: `https://bekapaka.pl${parentHref}`
                },
                { '@type': 'ListItem', position: 2, name: title }
              ]
            })
          }}
        />

        <nav aria-label="Ścieżka" className="article-breadcrumbs-nav">
          <ol className="breadcrumbs" role="list">
            <li>
              <Link href="/">Start</Link>
            </li>
            <li>
              <Link href={parentHref}>{sectionLabel || 'Aktualności'}</Link>
            </li>
            <li aria-current="page">{title}</li>
          </ol>
          {parentLabel && (
            <Link href={parentHref} className="article-detail__back-link visually-hidden-focusable">
              {parentLabel}
            </Link>
          )}
        </nav>

        <header className="article-detail__header">
          <div className="stack" style={{ '--stack': 'var(--space-5)' } as React.CSSProperties}>
            {sectionLabel && (
              <span className="article-detail__eyebrow">{sectionLabel}</span>
            )}
            <h1 className="article-detail__title">{bindPolishOrphans(title)}</h1>
            {lead && (
              <p
                className="article-detail__lead"
                style={{ fontSize: 'var(--fs-lead)', lineHeight: 'var(--lh-lead)' }}
              >
                {bindPolishOrphans(lead)}
              </p>
            )}
            <div className="article-meta meta">
              {meta && <span className="article-detail__meta">{meta}</span>}
              {author && <span className="article-detail__author">{author}</span>}
              {share && <ShareActions />}
            </div>
            {tags && tags.length > 0 && (
              <ul className="article-detail__tags" aria-label="Tagi artykułu">
                {tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            )}
          </div>
          {cover && (
            <figure className={`art-cover${coverFit === 'contain' ? ' art-cover--contain' : ''}`}>
              {cover}
            </figure>
          )}
        </header>

        <div className="art-body">
          <div className="prose">{content}</div>
          {sidebar && <aside className="art-aside" aria-label="Boczny panel artykułu">{sidebar}</aside>}
        </div>
      </div>
    </article>
  )
}
