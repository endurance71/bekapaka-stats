import Link from 'next/link'
import type { NewsPost } from '../../../lib/data'
import { formatDateTime } from '../../../lib/format'

function PagerCard({
  item,
  label
}: {
  item: NewsPost
  label: string
}) {
  return (
    <Link href={`/aktualnosci/${item.slug}`} className="card article-relations__card">
      <div className="card__body">
        <span className="tag tag--accent">{label}</span>
        <h3 className="card__title">{item.title}</h3>
        <div className="card__foot">
          <time className="meta" dateTime={item.publishedAt}>
            {formatDateTime(item.publishedAt)}
          </time>
          <svg
            className="ico"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="miter"
            aria-hidden="true"
          >
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

function RelationLink({ item }: { item: NewsPost }) {
  return (
    <Link href={`/aktualnosci/${item.slug}`} className="article-relations__link">
      <span className="article-relations__date">{formatDateTime(item.publishedAt)}</span>
      <span className="article-relations__title">{item.title}</span>
    </Link>
  )
}

export function ArticleRelations({
  related,
  previous,
  next
}: {
  related: NewsPost[]
  previous?: NewsPost
  next?: NewsPost
}) {
  if (related.length === 0 && !previous && !next) return null

  return (
    <div className="article-relations-wrapper" aria-label="Powiązane artykuły">
      {previous || next ? (
        <nav className="article-relations__pager" aria-label="Nawigacja między artykułami">
          {previous ? <PagerCard item={previous} label="Poprzedni artykuł" /> : null}
          {next ? <PagerCard item={next} label="Następny artykuł" /> : null}
        </nav>
      ) : null}

      {related.length > 0 ? (
        <section className="article-relations factbox">
          <p className="label muted" style={{ marginBottom: 'var(--space-3)' }}>Powiązane artykuły</p>
          <div className="article-relations__grid">
            {related.map((item) => (
              <RelationLink key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
