import { Link } from 'react-router';
import { AlertTriangle, LayoutGrid } from 'lucide-react';
import { API } from '../../lib/api';
import type { GridEntry, Item } from '../../lib/publications';

const dateOf = (e: Pick<GridEntry, 'publishedAt' | 'plannedAt'>) => e.publishedAt || e.plannedAt;
const shortDate = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', day: 'numeric', month: 'short' }).format(
        new Date(iso),
      )
    : '';

/** One tile of a feed grid: the published graphic, or its composition name when no image is kept. */
export function GridTile({ entry, highlight = false, src }: { entry?: GridEntry; highlight?: boolean; src?: string }) {
  const image = src || (entry?.thumbnail ? API + entry.thumbnail : '');
  return (
    <figure className={`grid-tile${highlight ? ' is-candidate' : ''}${entry?.warnings?.length ? ' is-repeated' : ''}`}>
      {image ? (
        <img src={image} alt="" loading="lazy" />
      ) : (
        <span className="grid-tile-name">{entry?.composition || '—'}</span>
      )}
      <figcaption>
        {highlight ? 'Ten post' : shortDate(entry ? dateOf(entry) : null)}
        {entry?.status === 'approved' && ' · plan'}
      </figcaption>
    </figure>
  );
}

type Props = {
  item: Item;
  candidateImage?: string;
  accepted: boolean;
  onAccept: (value: boolean) => void;
};

/**
 * Feed variety next to the approval: the candidate in front of the channel's last posts (as on the
 * Instagram profile, newest first) and the repetition warnings the owner has to accept explicitly.
 */
export default function GridVariety({ item, candidateImage, accepted, onAccept }: Props) {
  const variety = item.variety;
  if (!variety) return null;
  const tiles = variety.history.slice(0, 8);
  return (
    <section className="grid-variety">
      <header>
        <span>
          <LayoutGrid size={14} /> Siatka {item.channel === 'facebook' ? 'Facebooka' : 'Instagrama'}
        </span>
        <small>{variety.composition}</small>
        <Link to="/siatka">Cała siatka</Link>
      </header>
      <div className="grid-tiles">
        <GridTile highlight src={candidateImage} entry={{ composition: variety.composition } as GridEntry} />
        {tiles.map((t) => (
          <GridTile key={t.itemId} entry={t} />
        ))}
      </div>
      {variety.warnings.length > 0 && (
        <div className="grid-warnings">
          <ul>
            {variety.warnings.map((w) => (
              <li key={w.rule}>
                <AlertTriangle size={13} /> {w.message}
              </li>
            ))}
          </ul>
          {item.status === 'draft' && (
            <label className="accept-repetition">
              <input type="checkbox" checked={accepted} onChange={(e) => onAccept(e.target.checked)} /> Akceptuję
              powtórzenie
            </label>
          )}
        </div>
      )}
    </section>
  );
}
