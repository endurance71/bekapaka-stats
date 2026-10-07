import Link from 'next/link'
import type { ReactNode } from 'react'
import { JerseyStripes } from './JerseyStripes'

export type Crumb = { label: string; href?: string }

/** Nagłówek podstrony: płyta, kicker, tytuł w skali Display, lead, opcjonalne nawigacje/metadane. */
export function PageHeader({
  kicker,
  title,
  lead,
  crumbs,
  theme = 'plyta',
  children,
  aside
}: {
  kicker?: string
  title: ReactNode
  lead?: ReactNode
  crumbs?: Crumb[]
  theme?: 'plyta' | 'papier'
  children?: ReactNode
  aside?: ReactNode
}) {
  return (
    <header className="page-header" data-theme={theme}>
      <div className="container">
        {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
        <div className={`page-header__grid${aside ? ' page-header__grid--aside' : ''}`}>
          <div className="page-header__text">
            {kicker && <p className="kicker">{kicker}</p>}
            <h1 className="page-header__title">{title}</h1>
            {lead && <p className="page-header__lead">{lead}</p>}
          </div>
          {aside && <div className="page-header__aside">{aside}</div>}
        </div>
        {children && <div className="page-header__extra">{children}</div>}
      </div>
      {theme === 'plyta' && <JerseyStripes className="page-header__stripes" />}
    </header>
  )
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Ścieżka" className="breadcrumbs">
      <ol role="list">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} aria-current={index === items.length - 1 ? 'page' : undefined}>
            {item.href && index < items.length - 1 ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
