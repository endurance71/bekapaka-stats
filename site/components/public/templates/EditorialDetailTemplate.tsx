import Link from 'next/link'
import { PageScaffold } from './PageScaffold'

export function EditorialDetailTemplate({
  sectionLabel,
  title,
  meta,
  content,
  parentHref
}: {
  sectionLabel: string
  title: string
  meta?: string
  content: React.ReactNode
  parentHref: string
}) {
  return (
    <article className='article-detail'>
      <PageScaffold title={title} description={meta} eyebrow={sectionLabel}>
        <p className='article-detail__back'>
          <Link href={parentHref}>← Wróć do listy</Link>
        </p>
        <div className='article-detail__content'>{content}</div>
      </PageScaffold>
    </article>
  )
}
