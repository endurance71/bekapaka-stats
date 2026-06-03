'use client'

import { useEffect, useState, type ReactNode } from 'react'
import type { NearestHighlight } from '../../../lib/data'
import { cmsEventCategoryLabel } from '../../../lib/data'
import { formatDateTime } from '../../../lib/format'
import { formatVenue } from '../../../lib/venue'
import { NearestEventCalendarActions } from './NearestEventCalendarActions'

interface NearestEventCardProps {
  highlight: NearestHighlight
}

function getStartsAtIso(highlight: NearestHighlight): string {
  return highlight.source === 'kalk' ? highlight.game.date : highlight.event.startAt
}

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return 'Trwa lub zakończone'
  const totalSeconds = Math.floor(msRemaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const sec = String(seconds).padStart(2, '0')

  if (days > 0) {
    return `${days} d ${hours} h ${minutes} min ${sec} s`
  }
  if (hours > 0) {
    return `${hours} h ${minutes} min ${sec} s`
  }
  return `${minutes} min ${sec} s`
}

function NearestEventCountdown({ startsAt }: { startsAt: string }) {
  const targetMs = new Date(startsAt).getTime()
  const [label, setLabel] = useState(() =>
    formatCountdown(Number.isFinite(targetMs) ? targetMs - Date.now() : 0)
  )

  useEffect(() => {
    if (!Number.isFinite(targetMs)) return undefined

    const tick = () => {
      setLabel(formatCountdown(targetMs - Date.now()))
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [targetMs])

  if (!Number.isFinite(targetMs)) return null

  return (
    <p className='next-event-hero__countdown' aria-live='polite'>
      <span className='next-event-hero__countdown-label'>Do startu</span>
      <span className='next-event-hero__countdown-value' suppressHydrationWarning>
        {label}
      </span>
    </p>
  )
}

function NearestEventLower({
  startsAt,
  calendar,
  children,
}: {
  startsAt: string
  calendar: ReactNode
  children: ReactNode
}) {
  return (
    <div className='next-event-hero__lower'>
      <div className='next-event-hero__meta-row'>
        <div className='next-event-hero__meta'>{children}</div>
        <NearestEventCountdown startsAt={startsAt} />
      </div>
      {calendar}
    </div>
  )
}

function NearestEventShell({
  upper,
  lower,
  isEmpty = false,
}: {
  upper: ReactNode
  lower?: ReactNode
  isEmpty?: boolean
}) {
  return (
    <div className={`next-event-hero${isEmpty ? ' next-event-hero--empty' : ''}`}>
      <div className='next-event-hero__top'>
        <p className='section-kicker next-event-hero__kicker'>Najbliższe wydarzenie</p>
        <div className='next-event-hero__upper'>{upper}</div>
      </div>
      {lower}
    </div>
  )
}

export function NearestEventCard({ highlight }: NearestEventCardProps) {
  const startsAt = getStartsAtIso(highlight)
  const calendar = <NearestEventCalendarActions highlight={highlight} />

  if (highlight.source === 'kalk') {
    const { game } = highlight
    return (
      <NearestEventShell
        upper={
          <>
            <span className='next-event-hero__eyebrow'>Zmagania ligowe · KALK</span>
            <h2 className='next-event-hero__match-title'>
              <span className='next-event-hero__team'>BEKAPAKA</span>
              <span className='next-event-hero__vs'>VS</span>
              <span className='next-event-hero__team next-event-hero__team--accent'>{game.opponent.toUpperCase()}</span>
            </h2>
          </>
        }
        lower={
          <NearestEventLower startsAt={startsAt} calendar={calendar}>
            <div className='next-event-hero__meta-item'>
              <span className='next-event-hero__meta-label'>Termin</span>
              <strong>{formatDateTime(game.date)}</strong>
            </div>
            <div className='next-event-hero__meta-item'>
              <span className='next-event-hero__meta-label'>Miejsce</span>
              <strong>{formatVenue(game.data?.venue)}</strong>
            </div>
          </NearestEventLower>
        }
      />
    )
  }

  const { event } = highlight
  return (
    <NearestEventShell
      upper={
        <>
          <span className='next-event-hero__eyebrow'>{cmsEventCategoryLabel(event.type)}</span>
          <h2 className='next-event-hero__event-title'>{event.title}</h2>
          {event.description ? <p className='next-event-hero__lead muted'>{event.description}</p> : null}
        </>
      }
      lower={
        <NearestEventLower startsAt={startsAt} calendar={calendar}>
          <div className='next-event-hero__meta-item'>
            <span className='next-event-hero__meta-label'>Termin</span>
            <strong>{formatDateTime(event.startAt)}</strong>
          </div>
          <div className='next-event-hero__meta-item'>
            <span className='next-event-hero__meta-label'>Miejsce</span>
            <strong>{event.location || 'Do potwierdzenia'}</strong>
          </div>
        </NearestEventLower>
      }
    />
  )
}

export function NearestEventEmpty() {
  return (
    <NearestEventShell
      isEmpty
      upper={
        <>
          <h3 className='next-event-hero__empty-title'>Brak zaplanowanych wydarzeń</h3>
          <p className='muted'>Nie ma nadchodzących meczów w KALK ani wpisów w kalendarzu klubu.</p>
        </>
      }
    />
  )
}
