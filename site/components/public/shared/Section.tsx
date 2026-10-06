import type { ReactNode } from 'react'

export function Section({
  id,
  tone = 'plate',
  tag,
  title,
  titleId,
  link,
  children,
  tight = false
}: {
  id?: string
  tone?: 'plate' | 'paper'
  tag?: string
  title?: string
  titleId?: string
  link?: ReactNode
  tight?: boolean
  children: ReactNode
}) {
  const headingId = titleId || (id ? `h-${id}` : undefined)

  return (
    <section
      id={id}
      data-theme={tone === 'paper' ? 'papier' : 'plyta'}
      className={`section section--${tone}${tight ? ' section--tight' : ''}`}
      aria-labelledby={title ? headingId : undefined}
    >
      <div className="container">
        {title && (
          <div className="section-head">
            <div className="section-head__title">
              {tag && <span className="tag tag--accent">{tag}</span>}
              <h2 className="h2">
                <span id={headingId}>{title}</span>
              </h2>
            </div>
            {link}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
