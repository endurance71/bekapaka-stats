import Link from 'next/link'
import { Breadcrumbs } from '../../public-site'
import { ClubLogo } from '../shared/ClubLogo'

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
    <article className='section-card article-detail'>
      <Breadcrumbs items={[{ label: 'Start', href: '/' }, { label: sectionLabel, href: parentHref }, { label: title }]} />
      <div className='detail-header'>
        <div>
          <p className='eyebrow'>{sectionLabel}</p>
          <h1>{title}</h1>
          {meta ? <p className='muted'>{meta}</p> : null}
        </div>
        <ClubLogo compact />
      </div>
      <p className='listing-quick-links'>
        <Link href='/tabela'>Tabela</Link> · <Link href='/sklad'>Sklad</Link> · <Link href='/sponsorzy'>Sponsorzy</Link>
      </p>
      {content}
    </article>
  )
}
