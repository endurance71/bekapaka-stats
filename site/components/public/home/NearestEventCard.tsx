'use client'

import { useEffect, useState } from 'react'
import type { NearestHighlight } from '../../../lib/data'
import { cmsEventCategoryLabel } from '../../../lib/data'
import { formatDateTime } from '../../../lib/format'
import { formatVenue } from '../../../lib/venue'

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

  if (days > 0) {
    return `${days} d ${hours} h ${minutes} min`
  }
  if (hours > 0) {
    return `${hours} h ${minutes} min ${seconds} s`
  }
  return `${minutes} min ${seconds} s`
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
    <div className='next-event-hero__countdown' aria-live='polite'>
      <span className='next-event-hero__countdown-label'>Do startu</span>
      <strong className='next-event-hero__countdown-value' suppressHydrationWarning>
        {label}
      </strong>
    </div>
  )
}

export function NearestEventCard({ highlight }: NearestEventCardProps) {
  const startsAt = getStartsAtIso(highlight)

  if (highlight.source === 'kalk') {
    const { game } = highlight
    return (
      <div className='next-event-hero'>
        <div className='next-event-hero__bg' aria-hidden />
        <div className='next-event-hero__content'>
          <span className='next-event-hero__eyebrow'>Zmagania ligowe · KALK</span>
          <h2 className='next-event-hero__match-title'>
            <span className='next-event-hero__team'>BEKAPAKA</span>
            <span className='next-event-hero__vs'>VS</span>
            <span className='next-event-hero__team next-event-hero__team--gold'>{game.opponent.toUpperCase()}</span>
          </h2>
          <div className='next-event-hero__meta'>
            <div className='next-event-hero__meta-item'>
              <span className='next-event-hero__meta-label'>Termin</span>
              <strong>{formatDateTime(game.date)}</strong>
            </div>
            <div className='next-event-hero__meta-item'>
              <span className='next-event-hero__meta-label'>Miejsce</span>
              <strong>{formatVenue(game.data?.venue)}</strong>
            </div>
          </div>
          <NearestEventCountdown startsAt={startsAt} />
          <span className='next-event-hero__badge'>Liga KALK</span>
        </div>
      </div>
    )
  }

  const { event } = highlight
  return (
    <div className='next-event-hero'>
      <div className='next-event-hero__bg' aria-hidden />
      <div className='next-event-hero__content'>
        <span className='next-event-hero__eyebrow'>{cmsEventCategoryLabel(event.type)}</span>
        <h2 className='next-event-hero__event-title'>{event.title}</h2>
        {event.description ? <p className='next-event-hero__lead muted'>{event.description}</p> : null}
        <div className='next-event-hero__meta'>
          <div className='next-event-hero__meta-item'>
            <span className='next-event-hero__meta-label'>Termin</span>
            <strong>{formatDateTime(event.startAt)}</strong>
          </div>
          <div className='next-event-hero__meta-item'>
            <span className='next-event-hero__meta-label'>Miejsce</span>
            <strong>{event.location || 'Do potwierdzenia'}</strong>
          </div>
        </div>
        <NearestEventCountdown startsAt={startsAt} />
        <span className='next-event-hero__badge'>Wydarzenie klubu</span>
      </div>
    </div>
  )
}

export function NearestEventEmpty() {
  return (
    <div className='next-event-hero next-event-hero--empty'>
      <div className='next-event-hero__bg' aria-hidden />
      <div className='next-event-hero__content'>
        <h3 className='next-event-hero__empty-title'>Brak zaplanowanych wydarzeń</h3>
        <p className='muted'>Nie ma nadchodzących meczów w KALK ani wpisów w kalendarzu klubu.</p>
      </div>
    </div>
  )
}
