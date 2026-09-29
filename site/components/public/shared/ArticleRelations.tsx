import Link from 'next/link'
import type { NewsPost } from '../../../lib/data'
import { formatDateTime } from '../../../lib/format'

function RelationLink({ item }: { item: NewsPost }) {
  return (
    <Link href={`/aktualnosci/${item.slug}`} className='article-relations__link'>
      <span className='article-relations__date'>{formatDateTime(item.publishedAt)}</span>
      <span className='article-relations__title'>{item.title}</span>
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
    <aside className='article-relations' aria-label='Powiązane artykuły'>
      {related.length > 0 ? (
        <section className='article-relations__related'>
          <h2>Powiązane artykuły</h2>
          <div className='article-relations__grid'>
            {related.map((item) => <RelationLink key={item.id} item={item} />)}
          </div>
        </section>
      ) : null}
      {previous || next ? (
        <nav className='article-relations__pager' aria-label='Nawigacja między artykułami'>
          {previous ? (
            <div className='article-relations__pager-item'>
              <span>Poprzedni artykuł</span>
              <RelationLink item={previous} />
            </div>
          ) : <span />}
          {next ? (
            <div className='article-relations__pager-item'>
              <span>Następny artykuł</span>
              <RelationLink item={next} />
            </div>
          ) : <span />}
        </nav>
      ) : null}
    </aside>
  )
}
