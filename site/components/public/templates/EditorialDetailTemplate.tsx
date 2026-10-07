import Link from 'next/link'
import { serializeJsonLd } from '../../../lib/json-ld'
import { bindPolishOrphans } from '../../../lib/typography'
import { ArticleToc, type ArticleTocItem } from '../news/ArticleToc'
import { ShareActions } from '../shared/ShareActions'

/**
 * Artykuł redakcyjny na papierze.
 * Nagłówek: tytuł i lead | okładka (na telefonie okładka zaraz pod tytułem).
 * Treść: z `toc` od 1280 px trzy strefy — szyna ze spisem treści · tekst · kolumna boczna, obie szyny przez cały artykuł.
 * Zakończenie: tematy, udostępnianie, a pod artykułem pasmo `more`.
 */
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
  sidebar,
  toc,
  more
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
  /** Sekcje artykułu dla szyny ze spisem treści (≥ 1280 px). */
  toc?: ArticleTocItem[]
  /** Pasmo pod artykułem, np. „Czytaj dalej” ze zdjęciami. */
  more?: React.ReactNode
}) {
  const rail = Boolean(toc && toc.length >= 3)
  const bodyClass = ['art-body', sidebar ? 'art-body--aside' : '', rail ? 'art-body--rail' : '', more ? 'art-body--more' : ''].filter(Boolean).join(' ')

  return (
    <article className={`article-detail${theme === 'plyta' ? ' article-detail--sport' : ''}${cover ? '' : ' article-detail--no-cover'}`} data-theme={theme}>
      <div className="article-detail__shell container">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: sectionLabel, item: `https://bekapaka.pl${parentHref}` },
                { '@type': 'ListItem', position: 2, name: title }
              ]
            })
          }}
        />

        <nav aria-label="Ścieżka" className="breadcrumbs">
          <ol role="list">
            <li>
              <Link href="/">Start</Link>
            </li>
            <li>
              <Link href={parentHref}>{sectionLabel || 'Aktualności'}</Link>
            </li>
            <li aria-current="page">
              <span>{title}</span>
            </li>
          </ol>
          {parentLabel && (
            <Link href={parentHref} className="article-detail__back-link visually-hidden-focusable">
              {parentLabel}
            </Link>
          )}
        </nav>

        <header className="article-detail__header">
          <div className="article-detail__headline">
            {sectionLabel && <p className="kicker article-detail__eyebrow">{sectionLabel}</p>}
            <h1 className="article-detail__title">{bindPolishOrphans(title)}</h1>
          </div>
          {cover && <figure className={`art-cover${coverFit === 'contain' ? ' art-cover--contain' : ''}`}>{cover}</figure>}
          {(lead || meta || author) && (
            <div className="article-detail__intro">
              {lead && <p className="article-detail__lead">{bindPolishOrphans(lead)}</p>}
              {(meta || author) && (
                <p className="article-detail__byline">
                  {meta && <span className="article-detail__meta">{meta}</span>}
                  {author && <span className="article-detail__author">{author}</span>}
                </p>
              )}
            </div>
          )}
        </header>

        <div className={bodyClass}>
          {rail && toc && (
            <aside className="art-rail" aria-label="Nawigacja po artykule">
              <div className="art-rail__inner">
                <ArticleToc items={toc} />
                {share && <ShareActions />}
              </div>
            </aside>
          )}
          <div className="prose">
            {content}
            {((tags && tags.length > 0) || share) && (
              <footer className="art-end">
                {tags && tags.length > 0 && (
                  <div className="art-end__tags">
                    <p className="t-label muted">Tematy</p>
                    <ul role="list" aria-label="Tematy artykułu">
                      {tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {share && <ShareActions />}
              </footer>
            )}
          </div>
          {sidebar && (
            <aside className="art-aside" aria-label="Czytaj dalej">
              <div className="art-aside__inner">{sidebar}</div>
            </aside>
          )}
        </div>
      </div>
      {more}
    </article>
  )
}
