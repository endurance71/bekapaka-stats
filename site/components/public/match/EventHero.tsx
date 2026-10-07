import Link from 'next/link'
import type { NearestHighlight } from '../../../lib/data'
import { matchDateParts } from '../../../lib/match-format'
import { Countdown } from '../home/Countdown'
import { NearestEventCalendarActions } from '../home/NearestEventCalendarActions'
import { FallbackImage } from '../shared/FallbackImage'
import { JerseyStripes } from '../primitives/JerseyStripes'

/** Hero wydarzenia z CMS (turniej, trening otwarty) — ten sam układ co mecz, bez pary drużyn. */
export function EventHero({ highlight }: { highlight: Extract<NearestHighlight, { source: 'cms' }> }) {
  const event = highlight.event
  const date = matchDateParts(event.startAt)
  return (
    <article className="match-hero match-hero--event" data-status="scheduled">
      <div className="match-hero__media" aria-hidden="true">
        <FallbackImage src="/brand/photography/arena.webp" width={1600} height={900} sizes="100vw" loading="eager" fetchPriority="high" preload alt="" />
      </div>
      <div className="container match-hero__inner">
        <div className="match-hero__top">
          <p className="kicker">Najbliższe wydarzenie</p>
        </div>
        <div className="match-hero__grid">
          <h2 className="match-hero__teams match-hero__event-title">{event.title}</h2>
          <div className="match-hero__panel">
            <div className="match-hero__when">
              <p className="match-hero__date">{date.valid ? `${date.weekdayLong}, ${date.dayNumber} ${date.monthLong}` : date.long}</p>
              {date.valid && (
                <p className="match-hero__time">
                  <time className="cut" dateTime={event.startAt}>
                    {date.time}
                  </time>
                </p>
              )}
            </div>
            <dl className="match-hero__facts">
              {event.location && (
                <div>
                  <dt>Miejsce</dt>
                  <dd>{event.location}</dd>
                </div>
              )}
              <div>
                <dt>Do startu</dt>
                <dd>
                  <Countdown date={event.startAt} />
                </dd>
              </div>
            </dl>
            <div className="match-hero__actions actions">
              <NearestEventCalendarActions primary highlight={highlight} />
              <Link className="btn btn--secondary" href={`/mecze/${event.slug}`}>
                Szczegóły wydarzenia
              </Link>
            </div>
          </div>
        </div>
      </div>
      <JerseyStripes className="match-hero__stripes" />
    </article>
  )
}
