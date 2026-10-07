import type { ReactNode } from 'react'
import { JerseyStripes } from './JerseyStripes'

/** Pasmo strony: tło na pełną szerokość w materiale płyta / papier, treść w kontenerze. */
export function Band({
  id,
  theme = 'plyta',
  size = 'md',
  stripes = false,
  labelledBy,
  label,
  className = '',
  children
}: {
  id?: string
  theme?: 'plyta' | 'papier'
  size?: 'md' | 'lg' | 'flush'
  /** Paski stroju na dolnej krawędzi pasma — separator przed zmianą materiału. */
  stripes?: boolean
  labelledBy?: string
  label?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      data-theme={theme}
      className={`band band--${size} ${className}`.trim()}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
    >
      <div className="container">{children}</div>
      {stripes && <JerseyStripes className="band__stripes" />}
    </section>
  )
}
