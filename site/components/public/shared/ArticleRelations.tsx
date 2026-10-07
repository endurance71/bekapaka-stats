import Link from 'next/link'
import type { NewsPost } from '../../../lib/data'
import { formatDate } from '../../../lib/format'
import { bindPolishOrphans } from '../../../lib/typography'

function RelationLink({ item, label }: { item: NewsPost; label?: string }) {
  return (
    <Link href={`/aktualnosci/${item.slug}`} className="relation">
      <span className="relation__meta">{label ?? formatDate(item.publishedAt)}</span>
      <span className="relation__title">{bindPolishOrphans(item.title)}</span>
    </Link>
  )
}

/** Kolumna boczna artykułu: nowszy / starszy, potem najnowsze — lista z liniami, bez kart. */
export function ArticleRelations({ previous, next, latest = [] }: { previous?: NewsPost; next?: NewsPost; latest?: NewsPost[] }) {
  if (!previous && !next && latest.length === 0) return null

  return (
    <nav className="relations" aria-label="Czytaj dalej">
      <p className="t-label muted">Czytaj dalej</p>
      <ul className="rule-list" role="list">
        {next && (
          <li>
            <RelationLink item={next} label="Nowszy artykuł" />
          </li>
        )}
        {previous && (
          <li>
            <RelationLink item={previous} label="Starszy artykuł" />
          </li>
        )}
        {latest.map((item) => (
          <li key={item.id}>
            <RelationLink item={item} />
          </li>
        ))}
      </ul>
    </nav>
  )
}
