import Link from 'next/link'
import type { ReactNode } from 'react'

export function ArrowIcon() {
  return (
    <svg className="arrow-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}

/** Link „dalej”: tekst + strzałka, podkreślenie 2 px. */
export function ArrowLink({ href, children, external = false }: { href: string; children: ReactNode; external?: boolean }) {
  if (external)
    return (
      <a className="arrow-link" href={href} target="_blank" rel="noopener noreferrer">
        <span>{children}</span>
        <ArrowIcon />
      </a>
    )
  return (
    <Link className="arrow-link" href={href}>
      <span>{children}</span>
      <ArrowIcon />
    </Link>
  )
}
