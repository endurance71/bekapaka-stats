import type { ReactNode } from 'react'

/** Nagłówek pasma: pytanie kibica (kicker) → odpowiedź (H2) → link dalej. */
export function BandHead({
  kicker,
  title,
  titleId,
  action,
  children,
  as: Heading = 'h2'
}: {
  kicker?: string
  title: ReactNode
  titleId?: string
  action?: ReactNode
  children?: ReactNode
  as?: 'h1' | 'h2' | 'h3'
}) {
  return (
    <header className="band-head">
      <div className="band-head__text">
        {kicker && <p className="kicker">{kicker}</p>}
        <Heading id={titleId} className="band-head__title">
          {title}
        </Heading>
        {children && <div className="band-head__lead">{children}</div>}
      </div>
      {action && <div className="band-head__action">{action}</div>}
    </header>
  )
}
