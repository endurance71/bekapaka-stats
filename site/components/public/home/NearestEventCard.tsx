import Link from 'next/link'
import type { NearestHighlight } from '../../../lib/data'
import { formatDateTime } from '../../../lib/format'
import { Countdown } from './Countdown'
import { NearestEventCalendarActions } from './NearestEventCalendarActions'
import { MatchCard } from '../shared/MatchCard'
export function NearestEventCard({ highlight }: { highlight: NearestHighlight }) {
 if (highlight.source === 'kalk') return <MatchCard hero game={highlight.game} actions={<NearestEventCalendarActions primary highlight={highlight} />} />
 const event = highlight.event
 return <article className="tile match-tile"><div className="tile__body">
  <span className="tag tag--gold">Wydarzenie</span><h2>{event.title}</h2>
  <p>{formatDateTime(event.startAt)}</p>{event.location && <p>{event.location}</p>}
  <Countdown date={event.startAt} />
  <div className="match-card__actions"><NearestEventCalendarActions primary highlight={highlight} /><Link className="btn btn--secondary" href={`/mecze/${event.slug}`}>Szczegóły wydarzenia</Link></div>
 </div></article>
}
export function EmptyNearestEventCard() {
 return <div className="tile"><div className="tile__body"><h2>Czekamy na kolejny mecz</h2><p>Termin pojawi się po potwierdzeniu przez klub.</p><Link href="/mecze" className="btn btn--primary">Mecze i wyniki</Link></div></div>
}
